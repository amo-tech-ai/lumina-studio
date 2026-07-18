#!/usr/bin/env node
/**
 * IPI-679 · SB-SEC-001 — negative HTTP probes for residual DEFINER RPCs.
 *
 * Expects PostgREST to deny anon (and optional authenticated) EXECUTE:
 *   POST /rest/v1/rpc/<name> → 401/403 (not 200).
 *
 * Usage:
 *   infisical run --env=dev -- node scripts/probe-definer-rpc-deny.mjs
 *
 * Optional: SUPABASE_ACCESS_TOKEN or AUTHENTICATED_JWT for authenticated probe.
 */

const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const authJwt =
  process.env.SUPABASE_ACCESS_TOKEN ||
  process.env.AUTHENTICATED_JWT ||
  "";

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
    const okDeny = res.status === 401 || res.status === 403;
    const line = `${role} POST rpc/${rpc.name} → ${res.status}`;
    if (okDeny) {
      console.log(`ok: ${line}`);
    } else {
      console.error(`FAIL: ${line} (expected 401/403)`);
      failures.push(line);
    }
  }
  return failures;
}

const failed = await probe("anon", {
  Authorization: `Bearer ${anonKey}`,
});

if (authJwt) {
  failed.push(
    ...(await probe("authenticated", {
      Authorization: `Bearer ${authJwt}`,
    })),
  );
} else {
  console.log(
    "skip: authenticated probe (set SUPABASE_ACCESS_TOKEN or AUTHENTICATED_JWT)",
  );
}

if (failed.length) {
  console.error(`probe-definer-rpc-deny: ${failed.length} failure(s)`);
  process.exit(1);
}

console.log("ok: definer RPC negative probes");
