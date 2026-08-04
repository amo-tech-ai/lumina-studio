#!/usr/bin/env node
/**
 * IPI-836 — run onboarding launch Playwright against QA only.
 *
 * Fail-closed: refuses production project ref. Uses a dedicated Playwright config
 * (never the shared playwright.config.ts) that forces a fresh webServer onto QA.
 *
 * Usage:
 *   node scripts/run-onboarding-launch-e2e.mjs
 */
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const root = resolve(import.meta.dirname, "..");

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

loadEnv(resolve(root, "app/.env.local"));
loadEnv(resolve(root, ".env.local"));

const { assertQaOnly } = await import(
  pathToFileURL(resolve(root, "e2e/helpers/qa-target.mjs")).href
);

assertQaOnly("QA_DATABASE_URL", process.env.QA_DATABASE_URL);
assertQaOnly("QA_SUPABASE_URL", process.env.QA_SUPABASE_URL);
if (!process.env.QA_SUPABASE_ANON_KEY) {
  console.error("FAIL: missing QA_SUPABASE_ANON_KEY");
  process.exit(1);
}
if (!process.env.QA_PASSWORD) {
  console.error("FAIL: missing QA_PASSWORD");
  process.exit(1);
}

process.env.ONBOARDING_LAUNCH_E2E = "true";
// Documented runner always requires credentials (no silent skip of substantive tests).
process.env.REQUIRE_ONBOARDING_LAUNCH_E2E = "true";
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
  "--config=playwright.onboarding-launch.config.ts",
  "e2e/14-onboarding-launch.spec.ts",
  "--project=chromium-desktop",
  "--project=mobile-390",
  "--workers=1",
  ...extra,
];

console.log("IPI-836 onboarding launch e2e → QA only (dedicated config, fresh webServer)");
const result = spawnSync("npx", args, {
  cwd: root,
  stdio: "inherit",
  env: process.env,
});
const code = typeof result.status === "number" ? result.status : 1;
process.exit(code);
