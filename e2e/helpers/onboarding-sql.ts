import { randomUUID } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { resolve } from "node:path";

import { assertQaOnly, loadEnvLocalFiles, QA_PROJECT_REF } from "./qa-target";
import { getQaCredentials } from "./qa-credentials";

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

/** Existing QA materialized session ready for Brand DNA (screen 13) — no new crawl. */
export type DraftReadySession = {
  sessionId: string;
  userId: string;
  idempotencyKey: string;
  organizationId: string;
  brandId: string;
  intakeStatus: string;
  currentScreen: number | null;
  crawls: number;
  brandName: string | null;
};

export type OnboardingProgressSnapshot = {
  browser: "healthy" | "unknown";
  session: "created" | "resumed" | "missing";
  crawl: "pending" | "running" | "completed" | "failed" | "unknown";
  brandIntelligence:
    | "pending"
    | "running"
    | "draft_ready"
    | "ready"
    | "failed"
    | "unknown";
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
    // Fail closed: explicit CA path configured but file missing, or default CA missing.
    // Only allow insecure when VERIFY_RLS_PG_INSECURE_SSL=1 is explicitly set.
    throw new Error(
      `QA database TLS verification failed: CA certificate not found at ${caPath}. Set VERIFY_RLS_PG_INSECURE_SSL=1 to explicitly opt out of certificate validation.`,
    );
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
 * Prefer a reusable draft_ready/scores_complete session for the QA operator.
 * Never creates rows — resume-only path for DNA / approve / Hub checks.
 */
export async function findDraftReadyOnboardingSession(opts?: {
  userId?: string;
  email?: string;
}): Promise<DraftReadySession | null> {
  return withQaPg(async (client) => {
    let userId = opts?.userId?.trim() || "";
    if (!userId) {
      const email =
        opts?.email?.trim() || getQaCredentials().email?.trim() || "qa@ipix.test";
      const u = await client.query<{ id: string }>(
        `select id::text as id from auth.users where email = $1 limit 1`,
        [email],
      );
      userId = u.rows[0]?.id ?? "";
    }
    if (!userId) return null;

    const r = await client.query<{
      session_id: string;
      user_id: string;
      idempotency_key: string;
      organization_id: string;
      brand_id: string;
      intake_status: string;
      current_screen: number | null;
      crawls: number;
      brand_name: string | null;
    }>(
      `select s.id::text as session_id,
              s.user_id::text as user_id,
              s.idempotency_key,
              s.organization_id::text as organization_id,
              s.brand_id::text as brand_id,
              b.intake_status,
              s.current_screen::int as current_screen,
              (select count(*)::int from public.brand_crawls c where c.brand_id = b.id) as crawls,
              b.name as brand_name
         from public.onboarding_sessions s
         join public.brands b on b.id = s.brand_id
        where s.user_id = $1::uuid
          and s.status = 'materialized'
          and b.intake_status in ('draft_ready', 'scores_complete')
          and s.organization_id is not null
          and s.brand_id is not null
        order by s.updated_at desc nulls last
        limit 1`,
      [userId],
    );
    const row = r.rows[0];
    if (!row) return null;
    return {
      sessionId: row.session_id,
      userId: row.user_id,
      idempotencyKey: row.idempotency_key,
      organizationId: row.organization_id,
      brandId: row.brand_id,
      intakeStatus: row.intake_status,
      currentScreen: row.current_screen,
      crawls: row.crawls,
      brandName: row.brand_name,
    };
  });
}

export async function snapshotOnboardingProgress(opts: {
  brandId: string;
  session?: "created" | "resumed" | "missing";
  browser?: "healthy" | "unknown";
}): Promise<OnboardingProgressSnapshot> {
  return withQaPg(async (client) => {
    const brand = await client.query<{ intake_status: string | null }>(
      `select intake_status from public.brands where id = $1::uuid`,
      [opts.brandId],
    );
    const intake = brand.rows[0]?.intake_status ?? null;
    const crawl = await client.query<{ job_status: string | null; created_at: string | null }>(
      `select job_status, created_at
         from public.brand_crawls
        where brand_id = $1::uuid
        order by created_at desc nulls last
        limit 1`,
      [opts.brandId],
    );
    const crawlStatus = (crawl.rows[0]?.job_status ?? "").toLowerCase();
    const crawlN = crawl.rows.length;

    let crawlPhase: OnboardingProgressSnapshot["crawl"] = "unknown";
    if (crawlN === 0) crawlPhase = "pending";
    else if (/run|pend|start|queue/i.test(crawlStatus)) crawlPhase = "running";
    else if (/fail|cancel|abort/i.test(crawlStatus)) crawlPhase = "failed";
    else if (/complete|success|done|finish/i.test(crawlStatus)) crawlPhase = "completed";
    else crawlPhase = "running";

    let bi: OnboardingProgressSnapshot["brandIntelligence"] = "unknown";
    if (!intake) bi = "pending";
    else if (intake === "draft_ready" || intake === "scores_complete") bi = "draft_ready";
    else if (intake === "ready") bi = "ready";
    else if (intake === "failed") bi = "failed";
    else if (/crawl|analysis|brand_created/i.test(intake)) bi = "running";

    return {
      browser: opts.browser ?? "healthy",
      session: opts.session ?? "resumed",
      crawl: crawlPhase,
      brandIntelligence: bi,
      intakeStatus: intake,
    };
  });
}

export function formatOnboardingProgress(p: OnboardingProgressSnapshot): string {
  return [
    `Browser: ${p.browser}`,
    `Onboarding session: ${p.session}`,
    `Crawl: ${p.crawl}`,
    `Brand Intelligence: ${p.brandIntelligence}`,
  ].join("\n");
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
      // Positive control first: with the owner as the JWT subject and the
      // authenticated role, the brand must remain readable. Guard against a
      // claim-shape mismatch silently passing the deny assertions below.
      await client.query(`select set_config('request.jwt.claim.sub', $1, true)`, [
        opts.userId,
      ]);
      await client.query(
        `select set_config('request.jwt.claims', json_build_object('sub', $1::text)::text, true)`,
        [opts.userId],
      );
      await client.query(`select set_config('request.jwt.claim.role', 'authenticated', true)`);
      await client.query(`set local role authenticated`);

      const ownerBrand = await client.query<{ n: number }>(
        `select count(*)::int as n from public.brands where id = $1::uuid`,
        [opts.brandId],
      );
      if ((ownerBrand.rows[0]?.n ?? 0) !== 1) {
        throw new Error(
          "RLS allow control: owner JWT subject cannot read own brand",
        );
      }

      // Now impersonate a stranger — deny assertions must hold under both
      // claim shapes so a policy keyed on either shape is still blocked.
      await client.query(`select set_config('request.jwt.claim.sub', $1, true)`, [stranger]);
      await client.query(
        `select set_config('request.jwt.claims', json_build_object('sub', $1::text)::text, true)`,
        [stranger],
      );

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

/**
 * Reset a brand to a reusable draft_ready fixture for test fixture reuse.
 *
 * promoteBrandDraft (app/src/lib/brand/promote-draft.ts) moves ai_profile_draft
 * into ai_profile and nulls the draft on approval, so merely flipping
 * intake_status leaves a broken fixture: draft_ready with no draft → the Approve
 * button never enables on the next run. Restore the draft payload so the fixture
 * can be approved again. ai_profile is not touched — it is NOT NULL in the schema
 * and promote reads only ai_profile_draft, overwriting ai_profile on re-approval.
 */
export async function resetBrandToDraftReady(brandId: string): Promise<void> {
  return withQaPg(async (client) => {
    await client.query(
      `update public.brands
          set intake_status = 'draft_ready',
              ai_profile_draft = coalesce(ai_profile_draft, ai_profile),
              updated_at = now()
        where id = $1::uuid`,
      [brandId],
    );
  });
}
