#!/usr/bin/env node
/**
 * PLT-003 edge function smoke test (remote).
 * Run: npm run supabase:verify-edge
 *
 * Default: `health` only (no edge-test / no ai_agent_logs).
 * Opt-in auth smoke: REQUIRE_AUTH_EDGE_SMOKE=1 (requires remote ALLOW_EDGE_TEST=1).
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";

const root = resolve(import.meta.dirname, "..");
const envPath = resolve(root, ".env.local");

if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq);
    const val = trimmed.slice(eq + 1);
    if (!process.env[key]) process.env[key] = val;
  }
}

const url =
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.NEXT_SUPABASE_URL;
const anonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  process.env.NEXT_SUPABASE_PUBLISHABLE_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const requireAuthSmoke = process.env.REQUIRE_AUTH_EDGE_SMOKE === "1";

if (!url || !anonKey) {
  console.error(
    "Missing Supabase URL / anon key (NEXT_PUBLIC_SUPABASE_URL + NEXT_PUBLIC_SUPABASE_ANON_KEY)",
  );
  process.exit(1);
}

const functionsBase = `${url}/functions/v1`;
let failures = 0;

function fail(msg) {
  console.error(`FAIL: ${msg}`);
  failures += 1;
}

function pass(msg) {
  console.log(`ok: ${msg}`);
}

async function fetchJson(path, init = {}) {
  const res = await fetch(`${functionsBase}${path}`, init);
  const text = await res.text();
  let json;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = null;
  }
  return { res, json, text };
}

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
    console.log(failures ? "\nEdge verification FAILED" : "\nEdge verification passed");
    process.exit(failures ? 1 : 0);
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

  if (
    authed.res.status === 200 &&
    authed.json?.ok === true &&
    authed.json?.data?.status === "ok" &&
    authed.json?.data?.userId
  ) {
    pass(`edge-test authenticated probe userId=${authed.json.data.userId}`);
  } else {
    fail(`edge-test authed → ${authed.res.status} ${authed.text?.slice(0, 200)}`);
  }

  if (admin && signIn.user?.id) {
    await admin.auth.admin.deleteUser(signIn.user.id);
    pass("cleaned up test user");
  }

  console.log(failures ? "\nEdge verification FAILED" : "\nEdge verification passed");
  process.exit(failures ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
