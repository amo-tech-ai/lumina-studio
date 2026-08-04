import { randomUUID } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { resolve } from "node:path";

import { assertQaOnly, loadEnvLocalFiles, QA_PROJECT_REF } from "./qa-target";

const requireFromApp = createRequire(resolve(process.cwd(), "app/package.json"));
const { Client } = requireFromApp("pg") as typeof import("pg");

export type OnboardingUniqueness = {
  sessions: number;
  organizations: number;
  brands: number;
  brandsInOrg: number;
  crawls: number;
  sessionStatus: string | null;
  currentScreen: number | null;
  organizationId: string | null;
  brandId: string | null;
  intakeStatus: string | null;
};

/** Match scripts/ipi-894-materialize-race.mjs — strip only SSL URL params node-pg rejects. */
function sanitizePgConnectionString(raw: string): string {
  try {
    const u = new URL(raw);
    for (const key of ["sslmode", "sslrootcert", "sslcert", "sslkey"]) {
      u.searchParams.delete(key);
    }
    return u.toString();
  } catch {
    return raw;
  }
}

function resolvePgSsl():
  | { rejectUnauthorized: false }
  | { rejectUnauthorized: true; ca: string } {
  if (
    process.env.VERIFY_RLS_PG_INSECURE_SSL === "1" ||
    process.env.NODE_TLS_REJECT_UNAUTHORIZED === "0"
  ) {
    return { rejectUnauthorized: false };
  }
  const explicitCa =
    process.env.PGSSLROOTCERT || process.env.VERIFY_RLS_PG_SSLROOTCERT || "";
  const caPath =
    explicitCa || resolve(process.cwd(), "scripts/certs/supabase-prod-ca-2021.crt");
  if (!existsSync(caPath)) {
    // ponytail: QA pooler often needs TLS without a local CA in CI — opt-in insecure only.
    return { rejectUnauthorized: false };
  }
  return { rejectUnauthorized: true, ca: readFileSync(caPath, "utf8") };
}

export async function withQaPg<T>(fn: (client: import("pg").Client) => Promise<T>): Promise<T> {
  loadEnvLocalFiles();
  const connectionString = sanitizePgConnectionString(
    assertQaOnly("QA_DATABASE_URL", process.env.QA_DATABASE_URL),
  );
  if (!connectionString.includes(QA_PROJECT_REF)) {
    throw new Error("pg client connection string lost QA ref");
  }
  const client = new Client({
    connectionString,
    connectionTimeoutMillis: 15_000,
    ssl: resolvePgSsl(),
  });
  await client.connect();
  try {
    return await fn(client);
  } finally {
    await client.end().catch(() => undefined);
  }
}

/**
 * Count durable rows for one onboarding attempt (idempotency key + user).
 * Fail the caller when any count !== 1 after materialize.
 *
 * Counts distinct org/brand ids on the attempt's sessions, then brands under that org
 * so a duplicate brand left on the same org still fails uniqueness.
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
      distinct_orgs: number;
      distinct_brands: number;
    }>(
      `select count(*)::int as n,
              max(status) as status,
              max(current_screen)::int as current_screen,
              max(organization_id::text) as organization_id,
              max(brand_id::text) as brand_id,
              count(distinct organization_id)::int as distinct_orgs,
              count(distinct brand_id)::int as distinct_brands
         from public.onboarding_sessions
        where user_id = $1::uuid
          and idempotency_key = $2`,
      [opts.userId, opts.idempotencyKey],
    );
    const row = session.rows[0];
    const orgId = row?.organization_id ?? null;
    const brandId = row?.brand_id ?? null;

    let brandsInOrg = 0;
    let crawls = 0;
    let intakeStatus: string | null = null;

    if (orgId) {
      const orgBrands = await client.query<{ n: number }>(
        `select count(*)::int as n from public.brands where org_id = $1::uuid`,
        [orgId],
      );
      brandsInOrg = orgBrands.rows[0]?.n ?? 0;
    }
    if (brandId) {
      const brand = await client.query<{ intake_status: string | null }>(
        `select max(intake_status) as intake_status from public.brands where id = $1::uuid`,
        [brandId],
      );
      intakeStatus = brand.rows[0]?.intake_status ?? null;
      const crawl = await client.query<{ n: number }>(
        `select count(*)::int as n from public.brand_crawls where brand_id = $1::uuid`,
        [brandId],
      );
      crawls = crawl.rows[0]?.n ?? 0;
    }

    return {
      sessions: row?.n ?? 0,
      // Distinct org/brand ids on this attempt (idempotency key) — not PK existence alone.
      organizations: row?.distinct_orgs ?? 0,
      brands: row?.distinct_brands ?? 0,
      brandsInOrg,
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
  if (u.brands !== 1) throw new Error(`expected 1 brand on session, got ${u.brands}`);
  if (u.brandsInOrg !== 1) {
    throw new Error(`expected 1 brand under org, got ${u.brandsInOrg}`);
  }
  if (!u.organizationId || !u.brandId) {
    throw new Error("session missing organization_id or brand_id after materialize");
  }
}

/**
 * Tenant isolation (IPI-809): sole org membership for owner, plus RLS as a random
 * stranger JWT subject (set_config) so a broken "see all sessions" policy fails.
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

    // Fresh UUID each run — never a fixed seed that might exist in QA.
    const stranger = randomUUID();
    await client.query("begin");
    try {
      await client.query(`select set_config('request.jwt.claim.sub', $1, true)`, [stranger]);
      await client.query(`select set_config('request.jwt.claim.role', 'authenticated', true)`);
      await client.query(`set local role authenticated`);

      const foreignSession = await client.query<{ n: number }>(
        `select count(*)::int as n
           from public.onboarding_sessions
          where idempotency_key = $1`,
        [opts.idempotencyKey],
      );
      if ((foreignSession.rows[0]?.n ?? 0) !== 0) {
        throw new Error(
          "RLS leak: stranger JWT subject can see this onboarding session",
        );
      }

      const foreignBrand = await client.query<{ n: number }>(
        `select count(*)::int as n from public.brands where id = $1::uuid`,
        [opts.brandId],
      );
      if ((foreignBrand.rows[0]?.n ?? 0) !== 0) {
        throw new Error("RLS leak: stranger JWT subject can see this brand");
      }
    } finally {
      await client.query("rollback").catch(() => undefined);
    }
  });
}
