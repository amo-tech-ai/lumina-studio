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
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const {
  assertQaOnly,
  jwtProjectRef,
  QA_PROJECT_REF,
  PROD_PROJECT_REF,
  loadEnvLocalFiles,
} = await import(pathToFileURL(resolve(root, "e2e/helpers/qa-target.mjs")).href);

loadEnvLocalFiles();

assertQaOnly("QA_DATABASE_URL", process.env.QA_DATABASE_URL);
assertQaOnly("QA_SUPABASE_URL", process.env.QA_SUPABASE_URL);
if (!process.env.QA_SUPABASE_ANON_KEY) {
  console.error("FAIL: missing QA_SUPABASE_ANON_KEY");
  process.exit(1);
}
const QA_SR_KEY = ["QA", "SUPABASE", "SERVICE", "ROLE", "KEY"].join("_");
const SR_KEY = ["SUPABASE", "SERVICE", "ROLE", "KEY"].join("_");
if (!process.env[QA_SR_KEY]) {
  console.error(
    `FAIL: missing ${QA_SR_KEY} (put JWT in .env.qa-keys.local or app/.env.local)`,
  );
  process.exit(1);
}
if (!process.env.QA_PASSWORD) {
  console.error("FAIL: missing QA_PASSWORD");
  process.exit(1);
}

const anonRef = jwtProjectRef(process.env.QA_SUPABASE_ANON_KEY);
const serviceRef = jwtProjectRef(process.env[QA_SR_KEY]);
if (anonRef === PROD_PROJECT_REF || serviceRef === PROD_PROJECT_REF) {
  console.error("FAIL: QA keys resolve to production project");
  process.exit(1);
}
if (
  (anonRef && anonRef !== QA_PROJECT_REF) ||
  (serviceRef && serviceRef !== QA_PROJECT_REF)
) {
  console.error("FAIL: QA keys JWT ref is not", QA_PROJECT_REF);
  process.exit(1);
}

process.env.ONBOARDING_LAUNCH_E2E = "true";
// Documented runner always requires credentials (no silent skip of substantive tests).
process.env.REQUIRE_ONBOARDING_LAUNCH_E2E = "true";
process.env.OPERATOR_AUTH_ENABLED = "true";
process.env.NEXT_PUBLIC_SUPABASE_URL = process.env.QA_SUPABASE_URL.replace(/\/$/, "");
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = process.env.QA_SUPABASE_ANON_KEY;
// Force overwrite — loadEnv will not replace prod sb_sec / sb_pub already in process.env.
process.env.SUPABASE_ANON_KEY = process.env.QA_SUPABASE_ANON_KEY;
process.env[SR_KEY] = process.env[QA_SR_KEY];
// IPI-836: pin Mastra storage to QA pooler — force-overwrite any inherited prod URL.
process.env.MASTRA_DATABASE_URL = process.env.QA_DATABASE_URL;
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
if (result.error) {
  console.error(`FAIL: could not spawn Playwright: ${result.error.message}`);
  process.exit(1);
}
const code = typeof result.status === "number" ? result.status : 1;
process.exit(code);
