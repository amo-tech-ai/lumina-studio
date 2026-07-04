#!/usr/bin/env node
/**
 * IPI-347 · Model Gate backend QA — single entry for RPC/RLS/API verification.
 * Run: infisical run -- node scripts/verify-booking-gate.mjs
 */
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
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

function run(label, cmd, args, opts = {}) {
  console.log(`\n▶ ${label}`);
  const result = spawnSync(cmd, args, {
    cwd: opts.cwd ?? root,
    stdio: "inherit",
    env: process.env,
  });
  if (result.status !== 0) {
    console.error(`✗ ${label} failed (exit ${result.status})`);
    process.exit(result.status ?? 1);
  }
  console.log(`✓ ${label}`);
}

const sqlTests = [
  "scripts/test-create-booking-request.sql",
  "scripts/test-booking-transition-fsm.sql",
  "scripts/test-booking-transition-concurrency.sql",
  "scripts/test-booking-exclude-constraint.sql",
  "scripts/test-get-list-bookings.sql",
  "scripts/test-notification-reads-rls.sql",
  "scripts/test-booking-notifications-trigger.sql",
];

run("supabase:verify-rls", "node", ["scripts/verify-rls.mjs"]);

const dbUrl = process.env.DATABASE_URL;
if (dbUrl) {
  for (const file of sqlTests) {
    run(`psql ${file}`, "psql", ["-v", "ON_ERROR_STOP=1", dbUrl, "-f", file]);
  }
} else {
  console.warn("\n⚠ DATABASE_URL unset — skipping SQL integration scripts");
}

run("app typecheck", "npm", ["run", "typecheck"], { cwd: resolve(root, "app") });
run("app booking tests", "npm", ["test", "--", "booking"], { cwd: resolve(root, "app") });
run("app notification tests", "npm", ["test", "--", "notifications"], {
  cwd: resolve(root, "app"),
});

console.log("\n✅ Model Gate backend QA — all steps green");
