#!/usr/bin/env node
/**
 * IPI-836 — run onboarding launch Playwright against QA only.
 *
 * Fail-closed: refuses production project ref. Forces Next webServer env onto
 * QA_SUPABASE_* + QA_DATABASE_URL so materialize never hits fashionos prod.
 *
 * Usage:
 *   node scripts/run-onboarding-launch-e2e.mjs
 */
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const QA = "wtuhdynujhszsbwxlbdi";
const PROD = "nvdlhrodvevgwdsneplk";

function loadEnv(path) {
  if (!existsSync(path)) return;
  for (const raw of readFileSync(path, "utf8").split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith("#") || !line.includes("=")) continue;
    const i = line.indexOf("=");
    const k = line.slice(0, i).trim();
    let v = line.slice(i + 1).trim();
    if (
      (v.startsWith('"') && v.endsWith('"')) ||
      (v.startsWith("'") && v.endsWith("'"))
    ) {
      v = v.slice(1, -1);
    }
    if (!process.env[k]) process.env[k] = v;
  }
}

function refuse(msg) {
  console.error(`FAIL: ${msg}`);
  process.exit(1);
}

function assertQa(label, value) {
  if (!value) refuse(`missing ${label}`);
  if (value.includes(PROD)) refuse(`${label} points at production (${PROD})`);
  if (!value.includes(QA)) refuse(`${label} must reference QA (${QA})`);
}

loadEnv(resolve(root, "app/.env.local"));
loadEnv(resolve(root, ".env.local"));

assertQa("QA_DATABASE_URL", process.env.QA_DATABASE_URL);
assertQa("QA_SUPABASE_URL", process.env.QA_SUPABASE_URL);
if (!process.env.QA_SUPABASE_ANON_KEY) refuse("missing QA_SUPABASE_ANON_KEY");
if (!process.env.QA_PASSWORD) refuse("missing QA_PASSWORD");

process.env.ONBOARDING_LAUNCH_E2E = "true";
process.env.OPERATOR_AUTH_ENABLED = "true";
process.env.NEXT_PUBLIC_SUPABASE_URL = process.env.QA_SUPABASE_URL.replace(/\/$/, "");
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = process.env.QA_SUPABASE_ANON_KEY;
process.env.DATABASE_URL = process.env.QA_DATABASE_URL;
process.env.CLOUDFLARE_HYPERDRIVE_LOCAL_CONNECTION_STRING_HYPERDRIVE_FRESH =
  process.env.QA_DATABASE_URL;

const extra = process.argv.slice(2);
const args = [
  "playwright",
  "test",
  "e2e/14-onboarding-launch.spec.ts",
  "--project=chromium-desktop",
  "--project=mobile-390",
  "--workers=1",
  ...extra,
];

console.log("IPI-836 onboarding launch e2e → QA only (prod ref refused)");
const result = spawnSync("npx", args, {
  cwd: root,
  stdio: "inherit",
  env: process.env,
});
const code = typeof result.status === "number" ? result.status : 1;
process.exit(code);
