#!/usr/bin/env node
/**
 * IPI-894 · ONB2-DB-001c — concurrent materialize_onboarding_session race on QA.
 *
 * Proof target: two concurrently *launched* RPCs (Promise.all) with the same
 * idempotency key return identical organization_id + brand_id and leave exactly
 * one session / org / brand. This proves idempotent concurrent *client* behavior;
 * it does not guarantee overlapping Postgres transactions (PostgREST may serialize).
 * After the pair, one sequential replay must return the same IDs, and the session
 * row must be status=materialized, current_screen=12, with matching stored IDs.
 *
 * Safety:
 *   - Hard-fail unless QA_DATABASE_URL embeds wtuhdynujhszsbwxlbdi
 *   - Hard-fail if QA_SUPABASE_URL / QA_DATABASE_URL looks like prod (nvdlhrodvevgwdsneplk)
 *   - Race uses authenticated supabase-js (anon + password JWT), not service_role
 *   - Cleanup uses QA_DATABASE_URL (postgres) scoped to test-tagged / test-named rows only
 *   - Fixture cleanup runs in `finally` even when assertions fail
 *
 * Usage:
 *   node scripts/ipi-894-materialize-race.mjs
 *   node scripts/ipi-894-materialize-race.mjs --runs=3
 *
 * Required env (app/.env.local or process):
 *   QA_DATABASE_URL
 *   QA_SUPABASE_URL          https://wtuhdynujhszsbwxlbdi.supabase.co
 *   QA_SUPABASE_ANON_KEY
 *   QA_EMAIL / QA_PASSWORD   (defaults email to qa@ipix.test)
 */

import { createRequire } from "node:module";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";

import { loadRepoEnv, repoRoot as ROOT } from "./lib/script-env.mjs";
import { resolvePgSsl, sanitizePgConnectionString } from "./lib/pg-ssl.mjs";

const requireFromApp = createRequire(resolve(ROOT, "app/package.json"));
const { Client } = requireFromApp("pg");

const QA_REF = "wtuhdynujhszsbwxlbdi";
const PROD_REF = "nvdlhrodvevgwdsneplk";

loadRepoEnv({ includeApp: true });

function parseArgs(argv) {
  let runs = 3;
  for (const arg of argv) {
    if (arg.startsWith("--runs=")) {
      const raw = arg.slice("--runs=".length);
      if (!/^\d+$/.test(raw)) {
        refuse(`--runs must be a positive integer, got ${JSON.stringify(raw)}`);
      }
      const n = Number.parseInt(raw, 10);
      if (n < 1) {
        refuse(`--runs must be a positive integer, got ${JSON.stringify(raw)}`);
      }
      runs = n;
    }
  }
  return { runs };
}

/** Fatal preflight — no fixtures yet. */
function refuse(msg) {
  console.error(`FAIL: ${msg}`);
  process.exit(1);
}

/** In-run assertion — caught so `finally` can still clean fixtures. */
function fail(msg) {
  throw new Error(msg);
}

function assertQaOnly(label, value) {
  if (!value) refuse(`missing ${label}`);
  if (value.includes(PROD_REF)) {
    refuse(`${label} points at production (${PROD_REF}) — abort`);
  }
  if (!value.includes(QA_REF)) {
    refuse(`${label} must reference QA project ${QA_REF}`);
  }
}

/** A missing CA is fatal here — never connect on a weaker trust chain. */
function requiredPgSsl() {
  try {
    return resolvePgSsl({ requireCa: true });
  } catch (err) {
    refuse(err.message);
  }
}

async function withPgClient(fn) {
  const connectionString = sanitizePgConnectionString(process.env.QA_DATABASE_URL);
  const client = new Client({
    connectionString,
    ssl: requiredPgSsl(),
  });
  await client.connect();
  try {
    return await fn(client);
  } finally {
    await client.end().catch(() => {});
  }
}

function parseRpcPayload(data) {
  if (data && typeof data === "object" && !Array.isArray(data)) {
    return {
      organization_id: data.organization_id ?? null,
      brand_id: data.brand_id ?? null,
    };
  }
  fail(`unexpected RPC payload: ${typeof data}`);
}

/**
 * Destructive cleanup is predicate-scoped:
 *   - sessions: user + idempotency key + draft_answers._ipi894
 *   - orgs/brands: owner/user + exact unique test name (never bare IDs)
 */
async function cleanupFixtures(pg, { userId, idempotencyKey, brandName }) {
  await pg.query("begin");
  try {
    await pg.query(
      `delete from public.onboarding_sessions
        where user_id = $1
          and idempotency_key = $2
          and (draft_answers->>'_ipi894') = 'true'`,
      [userId, idempotencyKey],
    );
    await pg.query(
      `delete from public.brands
        where user_id = $1 and name = $2`,
      [userId, brandName],
    );
    await pg.query(
      `delete from public.org_members
        where org_id in (
          select id from public.organizations
           where owner_id = $1 and name = $2
        )`,
      [userId, brandName],
    );
    await pg.query(
      `delete from public.organizations
        where owner_id = $1 and name = $2`,
      [userId, brandName],
    );
    await pg.query("commit");
  } catch (err) {
    await pg.query("rollback");
    throw err;
  }
}

async function runOnce(runIndex) {
  const qaUrl = process.env.QA_SUPABASE_URL?.replace(/\/$/, "");
  const qaAnon = process.env.QA_SUPABASE_ANON_KEY;
  const email = process.env.QA_EMAIL?.trim() || "qa@ipix.test";
  const password = process.env.QA_PASSWORD?.trim() || "";

  assertQaOnly("QA_DATABASE_URL", process.env.QA_DATABASE_URL);
  assertQaOnly("QA_SUPABASE_URL", qaUrl);
  if (!qaAnon) refuse("missing QA_SUPABASE_ANON_KEY");
  if (!password) refuse("missing QA_PASSWORD");

  const suffix = `${Date.now().toString(36)}-${runIndex}-${Math.random().toString(36).slice(2, 8)}`;
  const idempotencyKey = `ipi894-${suffix}`;
  const brandName = `IPI894 Race ${suffix}`;
  const brandUrl = `https://example.com/ipi894-${suffix}`;

  const authClient = createClient(qaUrl, qaAnon, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: signIn, error: signErr } = await authClient.auth.signInWithPassword({
    email,
    password,
  });
  if (signErr || !signIn.user?.id || !signIn.session?.access_token) {
    refuse(
      `QA sign-in failed for ${email}: ${signErr?.message ?? "no session"} (user must exist on QA ${QA_REF})`,
    );
  }
  const userId = signIn.user.id;
  const accessToken = signIn.session.access_token;

  // Two clients with the same JWT — concurrent rpc() on one client can drop auth.
  async function authedClient() {
    const client = createClient(qaUrl, qaAnon, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { error } = await client.auth.setSession({
      access_token: accessToken,
      refresh_token: signIn.session.refresh_token,
    });
    if (error) refuse(`setSession failed: ${error.message}`);
    return client;
  }
  const clientA = await authedClient();
  const clientB = await authedClient();

  let draftInserted = false;
  let runError = null;
  let cleanupError = null;

  try {
    // Draft MUST exist before the race (RPC raises P0002 otherwise).
    const { error: draftErr } = await clientA.from("onboarding_sessions").insert({
      user_id: userId,
      idempotency_key: idempotencyKey,
      status: "draft",
      current_screen: 11,
      draft_answers: { _ipi894: true, brandName, brandUrl },
    });
    if (draftErr) {
      fail(`draft insert failed: ${draftErr.message} (${draftErr.code ?? "?"})`);
    }
    draftInserted = true;

    // Durability check before race (replica / RLS visibility).
    const { data: draftRow, error: draftReadErr } = await clientB
      .from("onboarding_sessions")
      .select("id, status")
      .eq("user_id", userId)
      .eq("idempotency_key", idempotencyKey)
      .maybeSingle();
    if (draftReadErr || !draftRow || draftRow.status !== "draft") {
      fail(
        `draft not visible before race: ${draftReadErr?.message ?? "missing/wrong status"}`,
      );
    }

    const rpcArgs = {
      p_idempotency_key: idempotencyKey,
      p_brand_name: brandName,
      p_brand_url: brandUrl,
    };

    // ponytail: best-effort concurrency — both HTTP RPCs start before either is
    // awaited. True TX-overlap proof needs a server-side barrier inside the RPC
    // (out of scope for this harness-only change).
    const started = Date.now();
    const [a, b] = await Promise.all([
      clientA.rpc("materialize_onboarding_session", rpcArgs),
      clientB.rpc("materialize_onboarding_session", rpcArgs),
    ]);
    const elapsedMs = Date.now() - started;

    if (a.error) fail(`RPC A failed: ${a.error.message} (${a.error.code ?? "?"})`);
    if (b.error) {
      fail(
        `RPC B failed: ${b.error.message} (${b.error.code ?? "?"}) after A ok org=${a.data?.organization_id ?? "?"}`,
      );
    }

    const left = parseRpcPayload(a.data);
    const right = parseRpcPayload(b.data);

    if (!left.organization_id || !left.brand_id) {
      fail("RPC A missing organization_id/brand_id");
    }
    if (left.organization_id !== right.organization_id) {
      fail(
        `org mismatch A=${left.organization_id} B=${right.organization_id}`,
      );
    }
    if (left.brand_id !== right.brand_id) {
      fail(`brand mismatch A=${left.brand_id} B=${right.brand_id}`);
    }

    // Sequential replay after the concurrent pair — same IDs required.
    const replay = await clientA.rpc("materialize_onboarding_session", rpcArgs);
    if (replay.error) {
      fail(`sequential replay failed: ${replay.error.message} (${replay.error.code ?? "?"})`);
    }
    const replayed = parseRpcPayload(replay.data);
    if (
      replayed.organization_id !== left.organization_id ||
      replayed.brand_id !== left.brand_id
    ) {
      fail(
        `sequential replay mismatch race=${left.organization_id}/${left.brand_id} replay=${replayed.organization_id}/${replayed.brand_id}`,
      );
    }

    const counts = await withPgClient(async (pg) => {
      const sessions = await pg.query(
        `select count(*)::int as n from public.onboarding_sessions
          where user_id = $1 and idempotency_key = $2`,
        [userId, idempotencyKey],
      );
      const sessionRow = await pg.query(
        `select status, current_screen, organization_id, brand_id
           from public.onboarding_sessions
          where user_id = $1 and idempotency_key = $2`,
        [userId, idempotencyKey],
      );
      const linked = await pg.query(
        `select o.id as org_id, b.id as brand_id
           from public.organizations o
           join public.brands b on b.org_id = o.id
          where o.id = $1
            and b.id = $2
            and o.owner_id = $3
            and o.name = $4
            and b.user_id = $3
            and b.name = $4`,
        [left.organization_id, left.brand_id, userId, brandName],
      );
      const orgsByName = await pg.query(
        `select count(*)::int as n from public.organizations
          where owner_id = $1 and name = $2`,
        [userId, brandName],
      );
      const brandsByName = await pg.query(
        `select count(*)::int as n from public.brands
          where user_id = $1 and name = $2`,
        [userId, brandName],
      );
      return {
        sessions: sessions.rows[0].n,
        session: sessionRow.rows[0] ?? null,
        linkedRows: linked.rows.length,
        orgsByName: orgsByName.rows[0].n,
        brandsByName: brandsByName.rows[0].n,
      };
    });

    if (counts.sessions !== 1) {
      fail(`expected 1 session for key, got ${counts.sessions}`);
    }
    if (!counts.session) {
      fail("session row missing after materialize");
    }
    if (counts.session.status !== "materialized") {
      fail(`expected session status=materialized, got ${counts.session.status}`);
    }
    if (Number(counts.session.current_screen) !== 12) {
      fail(
        `expected current_screen=12, got ${counts.session.current_screen}`,
      );
    }
    if (
      counts.session.organization_id !== left.organization_id ||
      counts.session.brand_id !== left.brand_id
    ) {
      fail(
        `session stored IDs mismatch rpc=${left.organization_id}/${left.brand_id} row=${counts.session.organization_id}/${counts.session.brand_id}`,
      );
    }
    if (counts.linkedRows !== 1) {
      fail(
        `returned org/brand IDs are not the test-named owned row (org=${left.organization_id} brand=${left.brand_id} name=${brandName})`,
      );
    }
    if (counts.orgsByName !== 1 || counts.brandsByName !== 1) {
      fail(
        `expected 1 org + 1 brand by test name, got orgs=${counts.orgsByName} brands=${counts.brandsByName}`,
      );
    }

    console.log(
      JSON.stringify({
        ok: true,
        run: runIndex,
        elapsedMs,
        orgId: left.organization_id,
        brandId: left.brand_id,
        idempotencyKey,
        session: {
          status: counts.session.status,
          current_screen: counts.session.current_screen,
        },
        sequentialReplay: true,
        counts: {
          sessions: counts.sessions,
          linkedRows: counts.linkedRows,
          orgsByName: counts.orgsByName,
          brandsByName: counts.brandsByName,
        },
        auth: "signInWithPassword",
        qaRef: QA_REF,
        proof: "concurrent-client-launch+sequential-replay",
      }),
    );
  } catch (err) {
    runError = err;
  } finally {
    if (draftInserted) {
      try {
        await withPgClient((pg) =>
          cleanupFixtures(pg, { userId, idempotencyKey, brandName }),
        );
      } catch (cleanupErr) {
        cleanupError = cleanupErr;
        console.error(
          `FAIL: cleanup failed for ${idempotencyKey}: ${cleanupErr?.message ?? cleanupErr}`,
        );
      }
    }
  }

  if (runError) throw runError;
  if (cleanupError) {
    fail(`cleanup failed: ${cleanupError?.message ?? cleanupError}`);
  }
}

async function main() {
  const { runs } = parseArgs(process.argv.slice(2));
  console.log(
    JSON.stringify({
      starting: true,
      runs,
      qaRef: QA_REF,
      note: "secrets redacted; concurrent client launch + sequential replay; not a TX-overlap proof",
    }),
  );

  for (let i = 1; i <= runs; i += 1) {
    await runOnce(i);
  }

  console.log(JSON.stringify({ allPassed: true, runs, qaRef: QA_REF }));
}

main().catch((err) => {
  console.error(`FAIL: ${err?.message ?? err}`);
  process.exit(1);
});
