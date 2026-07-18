#!/usr/bin/env node
/**
 * IPI-679 · SB-SEC-001 / IPI-691 · SB-SEC-001b — negative HTTP probes for residual DEFINER RPCs.
 *
 * Expects PostgREST to deny anon (and optional authenticated) EXECUTE:
 *   POST /rest/v1/rpc/<name> → 401/403/404 (not 200).
 *   404 = function not exposed to the role (common PostgREST hide).
 *
 * Authenticated probe (IPI-691):
 *   - Prefer AUTHENTICATED_JWT (real user access token), or
 *   - Mint via QA_EMAIL + QA_PASSWORD (signInWithPassword).
 *   - Never use SUPABASE_ACCESS_TOKEN (management PAT ≠ PostgREST JWT).
 *
 * Usage:
 *   infisical run --env=dev -- node scripts/probe-definer-rpc-deny.mjs
 */

import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY",
  );
  process.exit(1);
}

const rpcs = [
  { name: "search_context_snapshots", body: {} },
  { name: "traverse_brand_graph", body: {} },
  { name: "identify_rls_policies_needing_optimization", body: {} },
];

function looksLikeJwt(token) {
  if (!token || typeof token !== "string") return false;
  const parts = token.split(".");
  return parts.length === 3 && parts.every((p) => p.length > 0);
}

/** Resolve a real authenticated user JWT — never a management PAT. */
async function resolveAuthenticatedJwt() {
  const explicit = process.env.AUTHENTICATED_JWT?.trim();
  if (explicit) {
    if (!looksLikeJwt(explicit)) {
      console.error(
        "AUTHENTICATED_JWT is set but is not a JWT (expected 3 segments). Refusing probe.",
      );
      process.exit(1);
    }
    return { jwt: explicit, source: "AUTHENTICATED_JWT" };
  }

  if (process.env.SUPABASE_ACCESS_TOKEN) {
    console.warn(
      "warn: SUPABASE_ACCESS_TOKEN is set but ignored for PostgREST probes (management PAT ≠ user JWT). Use AUTHENTICATED_JWT or QA_EMAIL/QA_PASSWORD.",
    );
  }

  const email =
    process.env.QA_EMAIL?.trim() ||
    process.env.Email?.trim() ||
    process.env.E2E_EMAIL?.trim() ||
    "qa@ipix.test";
  const password =
    process.env.QA_PASSWORD?.trim() ||
    process.env.Password?.trim() ||
    process.env.E2E_PASSWORD?.trim() ||
    "";

  if (!email || !password) {
    return { jwt: "", source: "" };
  }

  const client = createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await client.auth.signInWithPassword({
    email,
    password,
  });
  const jwt = data.session?.access_token ?? "";
  if (error || !looksLikeJwt(jwt)) {
    console.error(
      `QA sign-in failed for authenticated probe: ${error?.message ?? "no access_token"}`,
    );
    process.exit(1);
  }
  return { jwt, source: `signInWithPassword(${email})` };
}

async function probe(role, headers) {
  const failures = [];
  for (const rpc of rpcs) {
    const res = await fetch(`${url}/rest/v1/rpc/${rpc.name}`, {
      method: "POST",
      headers: {
        apikey: anonKey,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
        ...headers,
      },
      body: JSON.stringify(rpc.body),
    });
    const okDeny =
      res.status === 401 || res.status === 403 || res.status === 404;
    const line = `${role} POST rpc/${rpc.name} → ${res.status}`;
    if (okDeny) {
      console.log(`ok: ${line}`);
    } else {
      console.error(`FAIL: ${line} (expected 401/403/404)`);
      failures.push(line);
    }
  }
  return failures;
}

const failed = await probe("anon", {
  Authorization: `Bearer ${anonKey}`,
});

const { jwt: authJwt, source: authSource } = await resolveAuthenticatedJwt();

if (authJwt) {
  console.log(`authenticated probe source: ${authSource}`);
  failed.push(
    ...(await probe("authenticated", {
      Authorization: `Bearer ${authJwt}`,
    })),
  );
} else {
  console.log(
    "skip: authenticated probe (set AUTHENTICATED_JWT or QA_EMAIL+QA_PASSWORD)",
  );
}

if (failed.length) {
  console.error(`probe-definer-rpc-deny: ${failed.length} failure(s)`);
  process.exit(1);
}

console.log("ok: definer RPC negative probes");
