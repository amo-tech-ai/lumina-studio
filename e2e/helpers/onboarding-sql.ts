import { createRequire } from "node:module";
import { resolve } from "node:path";

import { assertQaOnly, loadEnvLocalFiles, QA_PROJECT_REF } from "./qa-target";

const requireFromApp = createRequire(resolve(process.cwd(), "app/package.json"));
const { Client } = requireFromApp("pg") as typeof import("pg");

export type OnboardingUniqueness = {
  sessions: number;
  organizations: number;
  brands: number;
  crawls: number;
  sessionStatus: string | null;
  currentScreen: number | null;
  organizationId: string | null;
  brandId: string | null;
  intakeStatus: string | null;
};

function sanitizePgConnectionString(raw: string): string {
  // Strip query params Playwright/CI sometimes leave that break node-pg.
  try {
    const u = new URL(raw);
    u.search = "";
    return u.toString();
  } catch {
    return raw;
  }
}

export async function withQaPg<T>(fn: (client: import("pg").Client) => Promise<T>): Promise<T> {
  loadEnvLocalFiles();
  const connectionString = sanitizePgConnectionString(
    assertQaOnly("QA_DATABASE_URL", process.env.QA_DATABASE_URL),
  );
  const client = new Client({ connectionString, connectionTimeoutMillis: 15_000 });
  await client.connect();
  try {
    // Belt-and-suspenders: refuse if connected DB is not the QA project.
    const { rows } = await client.query<{ ref: string }>(
      `select current_setting('request.jwt.claim.ref', true) as ref`,
    ).catch(() => ({ rows: [{ ref: "" }] }));
    void rows;
    if (!connectionString.includes(QA_PROJECT_REF)) {
      throw new Error("pg client connection string lost QA ref");
    }
    return await fn(client);
  } finally {
    await client.end().catch(() => undefined);
  }
}

/**
 * Count durable rows for one onboarding attempt (idempotency key + user).
 * Fail the caller when any count !== 1 after materialize.
 */
export async function queryOnboardingUniqueness(opts: {
  userId: string;
  idempotencyKey: string;
}): Promise<OnboardingUniqueness> {
  return withQaPg(async (client) => {
    const session = await client.query<{
      n: number;
      status: string | null;
      current_screen: number | null;
      organization_id: string | null;
      brand_id: string | null;
    }>(
      `select count(*)::int as n,
              max(status) as status,
              max(current_screen)::int as current_screen,
              max(organization_id::text) as organization_id,
              max(brand_id::text) as brand_id
         from public.onboarding_sessions
        where user_id = $1::uuid
          and idempotency_key = $2`,
      [opts.userId, opts.idempotencyKey],
    );
    const row = session.rows[0];
    const orgId = row?.organization_id ?? null;
    const brandId = row?.brand_id ?? null;

    let organizations = 0;
    let brands = 0;
    let crawls = 0;
    let intakeStatus: string | null = null;

    if (orgId) {
      const org = await client.query<{ n: number }>(
        `select count(*)::int as n from public.organizations where id = $1::uuid`,
        [orgId],
      );
      organizations = org.rows[0]?.n ?? 0;
    }
    if (brandId) {
      const brand = await client.query<{ n: number; intake_status: string | null }>(
        `select count(*)::int as n, max(intake_status) as intake_status
           from public.brands where id = $1::uuid`,
        [brandId],
      );
      brands = brand.rows[0]?.n ?? 0;
      intakeStatus = brand.rows[0]?.intake_status ?? null;
      const crawl = await client.query<{ n: number }>(
        `select count(*)::int as n from public.brand_crawls where brand_id = $1::uuid`,
        [brandId],
      );
      crawls = crawl.rows[0]?.n ?? 0;
    }

    return {
      sessions: row?.n ?? 0,
      organizations,
      brands,
      crawls,
      sessionStatus: row?.status ?? null,
      currentScreen: row?.current_screen ?? null,
      organizationId: orgId,
      brandId,
      intakeStatus,
    };
  });
}

export function assertUniqueMaterialized(u: OnboardingUniqueness): void {
  if (u.sessions !== 1) throw new Error(`expected 1 onboarding session, got ${u.sessions}`);
  if (u.organizations !== 1) throw new Error(`expected 1 organization, got ${u.organizations}`);
  if (u.brands !== 1) throw new Error(`expected 1 brand, got ${u.brands}`);
  if (!u.organizationId || !u.brandId) {
    throw new Error("session missing organization_id or brand_id after materialize");
  }
}

/**
 * Tenant isolation (IPI-809): org membership is only for the owning user;
 * a stranger UUID has zero membership / session rows for this attempt.
 */
export async function assertTenantIsolation(opts: {
  userId: string;
  organizationId: string;
  brandId: string;
  idempotencyKey: string;
}): Promise<void> {
  await withQaPg(async (client) => {
    const members = await client.query<{ user_id: string; n: number }>(
      `select user_id::text, count(*)::int as n
         from public.org_members
        where org_id = $1::uuid
        group by user_id`,
      [opts.organizationId],
    );
    if (members.rows.length !== 1 || members.rows[0]?.user_id !== opts.userId) {
      throw new Error(
        `expected sole org member ${opts.userId}, got ${JSON.stringify(members.rows)}`,
      );
    }

    const stranger = "00000000-0000-4000-8000-000000000099";
    const foreignSession = await client.query<{ n: number }>(
      `select count(*)::int as n
         from public.onboarding_sessions
        where user_id = $1::uuid
          and idempotency_key = $2`,
      [stranger, opts.idempotencyKey],
    );
    if ((foreignSession.rows[0]?.n ?? 0) !== 0) {
      throw new Error("stranger user unexpectedly owns this idempotency session");
    }

    const brandOwner = await client.query<{ n: number }>(
      `select count(*)::int as n
         from public.brands b
         join public.org_members m on m.org_id = b.org_id
        where b.id = $1::uuid
          and m.user_id = $2::uuid`,
      [opts.brandId, opts.userId],
    );
    if ((brandOwner.rows[0]?.n ?? 0) < 1) {
      throw new Error("owner is not a member of the brand's organization");
    }
  });
}
