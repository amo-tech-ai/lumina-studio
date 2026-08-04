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
  const { assertQaOnly, PROD_PROJECT_REF, QA_PROJECT_REF } = loaded;

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

  console.log("qa-target self-check OK");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
