#!/usr/bin/env node
/**
 * Verify Supabase env + REST connectivity (run: node scripts/verify-supabase.mjs)
 * Loads .env.local if present.
 */
import { loadRepoEnv, resolveSupabaseEnv } from "./lib/script-env.mjs";

loadRepoEnv();

const { url, anonKey: key } = resolveSupabaseEnv();

if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY");
  process.exit(1);
}

const tables = ["tasks", "profiles", "assets", "shoots"];

for (const table of tables) {
  const res = await fetch(`${url}/rest/v1/${table}?select=id&limit=1`, {
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
    },
  });
  const ok = res.ok;
  console.log(`${table}: ${ok ? "ok" : `fail ${res.status}`}`);
  if (!ok) process.exitCode = 1;
}

console.log(`project: ${url}`);
