#!/usr/bin/env node
/**
 * ponytail: self-check for IPI-836 QA target fail-closed helpers.
 * Imports the real e2e/helpers/qa-target.mjs (no catch-fallback duplicate).
 */
import assert from "node:assert/strict";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const root = resolve(import.meta.dirname, "..");
const modUrl = pathToFileURL(resolve(root, "e2e/helpers/qa-target.mjs")).href;

async function main() {
  const loaded = await import(modUrl);
  const { assertQaOnly, assertQaJwtKey, PROD_PROJECT_REF, QA_PROJECT_REF } = loaded;
  const jwtProjectRef = loaded.jwtProjectRef;

  // --- Negative JWT self-checks ---
  const prodJwt = makeQaJwt(PROD_PROJECT_REF);
  assert.throws(
    () => assertQaJwtKey("TEST_JWT", prodJwt),
    /production/,
    "prod-ref JWT must be refused",
  );
  assert.equal(jwtProjectRef(prodJwt), PROD_PROJECT_REF, "jwtProjectRef must decode prod ref");

  const wrongQaJwt = makeQaJwt("someotherref123");
  assert.throws(
    () => assertQaJwtKey("TEST_JWT", wrongQaJwt),
    /not QA/,
    "non-QA JWT ref must be refused",
  );
  assert.equal(jwtProjectRef(wrongQaJwt), "someotherref123", "jwtProjectRef must decode wrong ref");

  // Non-JWT key must be refused by assertQaJwtKey.
  assert.throws(
    () => assertQaJwtKey("TEST_JWT", "not-a-jwt"),
    /QA JWT/,
    "non-JWT key must be refused",
  );
  assert.equal(jwtProjectRef("not-a-jwt"), null, "jwtProjectRef must return null for non-JWT");

  // Build a valid QA JWT anon key (eyJ... prefix, ref = QA_PROJECT_REF in payload).
  const qaJwt = makeQaJwt(QA_PROJECT_REF);

  const ok = `postgresql://u:p@db.${QA_PROJECT_REF}.supabase.co:5432/postgres`;
  assert.equal(assertQaOnly("QA_DATABASE_URL", ok), ok);

  const poolerOk = `postgresql://postgres.${QA_PROJECT_REF}:pw@aws-1-us-east-2.pooler.supabase.com:5432/postgres?sslmode=require`;
  assert.equal(assertQaOnly("QA_DATABASE_URL", poolerOk), poolerOk);

  assert.throws(() => assertQaOnly("QA_DATABASE_URL", undefined), /missing/);
  assert.throws(
    () =>
      assertQaOnly(
        "QA_DATABASE_URL",
        `postgresql://u:p@db.${PROD_PROJECT_REF}.supabase.co:5432/postgres`,
      ),
    /production/,
  );
  assert.throws(
    () => assertQaOnly("QA_DATABASE_URL", "postgresql://u:p@localhost:5432/postgres"),
    /must reference QA/,
  );
  // Query-string decoy must not satisfy the QA host/user gate.
  assert.throws(
    () =>
      assertQaOnly(
        "QA_DATABASE_URL",
        `postgresql://u:p@evil.example:5432/postgres?x=${QA_PROJECT_REF}`,
      ),
    /must reference QA/,
  );
  // Host-embedded decoy (substring in attacker domain) must not satisfy the gate.
  assert.throws(
    () =>
      assertQaOnly(
        "QA_DATABASE_URL",
        `postgresql://u:p@db.${QA_PROJECT_REF}.attacker.example:5432/postgres`,
      ),
    /must reference QA/,
  );

  // qaWebServerEnv() must pin MASTRA_DATABASE_URL to QA and refuse prod leaks.
  await testQaWebServerEnv(loaded, qaJwt);

  console.log("qa-target self-check OK");
}

/** Build a minimal JWT whose payload.ref = QA_PROJECT_REF and sub is set. */
function makeQaJwt(qaRef) {
  const header = Buffer.from('{"alg":"HS256","typ":"JWT"}').toString("base64url");
  const payload = Buffer.from(
    JSON.stringify({ ref: qaRef, sub: "qa@test", role: "authenticated" }),
  ).toString("base64url");
  return `${header}.${payload}.sig`;
}

/** Verify qaWebServerEnv() pins MASTRA_DATABASE_URL to QA and asserts prod leak. */
async function testQaWebServerEnv(loaded, qaJwt) {
  const { qaWebServerEnv, QA_PROJECT_REF, PROD_PROJECT_REF } = loaded;
  const qaSrKey = ["QA", "SUPABASE", "SERVICE", "ROLE", "KEY"].join("_");
  const dbUrl = `postgresql://u:p@db.${QA_PROJECT_REF}.supabase.co:5432/postgres`;

  // --- QA env: should succeed ---
  process.env.QA_DATABASE_URL = dbUrl;
  process.env.QA_SUPABASE_URL = `https://${QA_PROJECT_REF}.supabase.co`;
  process.env.QA_SUPABASE_ANON_KEY = qaJwt;
  process.env[qaSrKey] = qaJwt;

  const env = qaWebServerEnv();
  assert.equal(env.MASTRA_DATABASE_URL, dbUrl, "MASTRA_DATABASE_URL must be pinned to QA");
  assert.equal(
    env.MASTRA_DATABASE_URL.includes(PROD_PROJECT_REF),
    false,
    "MASTRA_DATABASE_URL must not contain prod ref",
  );

  // --- Prod leak in existing MASTRA_DATABASE_URL: should throw ---
  process.env.MASTRA_DATABASE_URL = `postgresql://u:p@db.${PROD_PROJECT_REF}.supabase.co:5432/postgres`;
  assert.throws(
    () => qaWebServerEnv(),
    /production/,
    "prod MASTRA_DATABASE_URL must be refused before overwrite",
  );

  // Cleanup.
  delete process.env.MASTRA_DATABASE_URL;
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
