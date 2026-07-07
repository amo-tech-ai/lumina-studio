#!/usr/bin/env node
/**
 * Create dev auth users + profiles + org for local/testing Supabase instances.
 * Uses service_role key via Supabase Auth Admin API — never run in production.
 *
 * This is the ONLY way to create auth.users — never INSERT into auth.users directly.
 * After this script, run: psql "$DATABASE_URL" -f supabase/seed.sql
 * (or: node scripts/seed-supabase.mjs if available)
 *
 * The deterministic IDs below are shared with supabase/seed.sql.
 * Auth Admin API users get auto-generated IDs; we then update profiles
 * to match because profiles.id FK references auth.users.id.
 *
 * Usage: node scripts/setup-dev-users.mjs
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

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

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  ?? process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const AUTH_HEADERS = {
  "Content-Type": "application/json",
  apikey: serviceRoleKey,
  Authorization: `Bearer ${serviceRoleKey}`,
};

const DEV_USERS = [
  { email: "alice@acme.com", password: "password123", full_name: "Alice Admin", role: "studio_admin" },
  { email: "bob@acme.com", password: "password123", full_name: "Bob Builder", role: "designer" },
  { email: "carol@acme.com", password: "password123", full_name: "Carol Viewer", role: "photographer" },
];

console.log("Creating auth users via Admin API...\n");

let createdCount = 0;
let skippedCount = 0;

for (const user of DEV_USERS) {
  const res = await fetch(`${supabaseUrl}/auth/v1/admin/users`, {
    method: "POST",
    headers: AUTH_HEADERS,
    body: JSON.stringify({
      email: user.email,
      password: user.password,
      email_confirm: true,
      user_metadata: { full_name: user.full_name },
    }),
  });

  if (!res.ok) {
    const body = await res.json();
    if (res.status === 409 || body?.msg?.includes("already exists")) {
      console.log(`  ↪ ${user.email} already exists — fetching ID`);
      skippedCount++;
      const listRes = await fetch(
        `${supabaseUrl}/auth/v1/admin/users?filter%5Bemail%5D=eq.${encodeURIComponent(user.email)}`,
        { headers: AUTH_HEADERS }
      );
      if (listRes.ok) {
        const list = await listRes.json();
        const uid = list?.users?.[0]?.id;
        if (uid) {
          console.log(`    id: ${uid}`);
          user.id = uid;
        }
      }
      continue;
    }
    console.error(`  ✗ ${user.email}: ${res.status} ${JSON.stringify(body)}`);
    process.exitCode = 1;
    continue;
  }

  const createdUser = await res.json();
  const uid = createdUser.id;
  console.log(`  ✓ ${user.email} → id: ${uid}`);
  user.id = uid;
  createdCount++;
}

console.log(`\nCreated: ${createdCount}, Skipped: ${skippedCount}`);

// Create/update profiles to match auth IDs
const { default: { createClient } } = await import("@supabase/supabase-js");
const sb = createClient(supabaseUrl, serviceRoleKey);

console.log("\nSyncing profiles...");
for (const user of DEV_USERS) {
  if (!user.id) {
    console.error(`  ✗ No ID for ${user.email} — skipping profile`);
    continue;
  }
  const { error } = await sb.from("profiles").upsert({
    id: user.id,
    email: user.email,
    full_name: user.full_name,
    role: user.role,
  }, { onConflict: "id" });
  if (error) {
    console.error(`  ✗ profile ${user.email}: ${error.message}`);
    process.exitCode = 1;
  } else {
    console.log(`  ✓ profile ${user.email} (id: ${user.id})`);
  }
}

// Map deterministic -> real IDs for seed.sql reference
const idMap = DEV_USERS.reduce((acc, u) => {
  const emailNick = u.email.split("@")[0];
  if (emailNick === "alice") acc.alice = u.id;
  if (emailNick === "bob") acc.bob = u.id;
  if (emailNick === "carol") acc.carol = u.id;
  return acc;
}, {});

console.log(`\nID mapping for seed.sql:`);
console.log(`  alice: ${idMap.alice}`);
console.log(`  bob:   ${idMap.bob}`);
console.log(`  carol: ${idMap.carol}`);
console.log(`\nIMPORTANT: Update supabase/seed.sql to use these IDs before running it.`);
console.log(`Next: update seed.sql user references, then run supabase/seed.sql`);
