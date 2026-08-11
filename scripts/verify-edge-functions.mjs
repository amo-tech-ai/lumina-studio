#!/usr/bin/env node
/**
 * PLT-003 edge function smoke test (remote).
 * Run: npm run supabase:verify-edge
 *
 * Default: `health` only (no edge-test / no ai_agent_logs).
 * Opt-in auth smoke: REQUIRE_AUTH_EDGE_SMOKE=1 (requires remote ALLOW_EDGE_TEST=1).
 */
import { createClient } from "@supabase/supabase-js";

import { createJsonFetcher } from "./lib/fetch-json.mjs";
import { createReporter } from "./lib/check-reporter.mjs";
import { loadRepoEnv, resolveSupabaseEnv } from "./lib/script-env.mjs";

loadRepoEnv();

const { url, anonKey, serviceRoleKey: serviceKey } = resolveSupabaseEnv();
const requireAuthSmoke = process.env.REQUIRE_AUTH_EDGE_SMOKE === "1";

if (!url || !anonKey) {
  console.error(
    "Missing Supabase URL / anon key (NEXT_PUBLIC_SUPABASE_URL + NEXT_PUBLIC_SUPABASE_ANON_KEY)",
  );
  process.exit(1);
}

const functionsBase = `${url}/functions/v1`;
const fetchJson = createJsonFetcher(functionsBase);
const reporter = createReporter();
const { fail, pass } = reporter;

async function main() {
  console.log("PLT-003 edge function verification\n");

  const optionsRes = await fetch(`${functionsBase}/health`, { method: "OPTIONS" });
  if (optionsRes.status === 204 || optionsRes.status === 200) {
    pass("health OPTIONS preflight");
  } else {
    fail(`health OPTIONS → ${optionsRes.status}`);
  }

  const health = await fetchJson("/health", {
    method: "GET",
    headers: { apikey: anonKey },
  });
  if (health.res.status === 200 && health.json?.ok === true && health.json?.data?.status === "ok") {
    pass("health GET returns ok envelope");
  } else {
    fail(`health GET → ${health.res.status} ${health.text?.slice(0, 120)}`);
  }

  if (!requireAuthSmoke) {
    pass("skipped edge-test auth smoke (set REQUIRE_AUTH_EDGE_SMOKE=1 to enable)");
    console.log(
      reporter.failures ? "\nEdge verification FAILED" : "\nEdge verification passed",
    );
    process.exit(reporter.failures ? 1 : 0);
  }

  // Opt-in: authenticated Edge runtime probe (remote must have ALLOW_EDGE_TEST=1)
  const anonTest = await fetchJson("/edge-test", {
    method: "POST",
    headers: { apikey: anonKey, "Content-Type": "application/json" },
    body: "{}",
  });
  if (anonTest.res.status === 401 || anonTest.res.status === 404) {
    pass(`edge-test rejects anonymous call (${anonTest.res.status})`);
  } else {
    fail(`edge-test without JWT expected 401/404, got ${anonTest.res.status}`);
  }

  const stamp = Date.now();
  const email = `plt003-edge-${stamp}@example.com`;
  const password = "EdgeTestPass123!";

  const admin = serviceKey
    ? createClient(url, serviceKey, {
        auth: { persistSession: false, autoRefreshToken: false },
      })
    : null;

  const userClient = createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  if (admin) {
    const { error: createError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    if (createError) throw new Error(createError.message);
  } else {
    const { error: signUpError } = await userClient.auth.signUp({ email, password });
    if (signUpError) throw new Error(signUpError.message);
  }

  const { data: signIn, error: signInError } = await userClient.auth.signInWithPassword({
    email,
    password,
  });
  if (signInError || !signIn.session?.access_token) {
    throw new Error(signInError?.message ?? "no session");
  }

  const token = signIn.session.access_token;
  const authed = await fetchJson("/edge-test", {
    method: "POST",
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: "{}",
  });

  // Must reject legacy spam shape: old edge-test returned 200 + userId + logId
  // after writing ai_agent_logs. IPI-688 is read-only — no logId.
  if (
    authed.res.status === 200 &&
    authed.json?.ok === true &&
    authed.json?.data?.status === "ok" &&
    authed.json?.data?.userId &&
    authed.json?.data?.logId == null
  ) {
    pass(`edge-test authenticated probe userId=${authed.json.data.userId} (no logId)`);
  } else {
    fail(
      `edge-test authed → ${authed.res.status} ${authed.text?.slice(0, 200)}` +
        (authed.json?.data?.logId != null ? " (unexpected logId — still writing logs?)" : ""),
    );
  }

  if (admin && signIn.user?.id) {
    await admin.auth.admin.deleteUser(signIn.user.id);
    pass("cleaned up test user");
  }

  console.log(
    reporter.failures ? "\nEdge verification FAILED" : "\nEdge verification passed",
  );
  process.exit(reporter.failures ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
