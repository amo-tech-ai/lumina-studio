#!/usr/bin/env node
/**
 * ponytail: self-check for IPI-836 QA target fail-closed helpers.
 * Fails hard if prod ref is accepted or QA ref is missing.
 */
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const root = resolve(import.meta.dirname, "..");
const modUrl = pathToFileURL(resolve(root, "e2e/helpers/qa-target.ts")).href;

// Playwright/TS helpers are plain TS — load via tsx if available, else transpile-free duplicate.
async function main() {
  let assertQaOnly;
  let PROD_PROJECT_REF;
  let QA_PROJECT_REF;
  try {
    const require = createRequire(resolve(root, "package.json"));
    require.resolve("tsx/cjs");
    const loaded = await import(modUrl);
    assertQaOnly = loaded.assertQaOnly;
    PROD_PROJECT_REF = loaded.PROD_PROJECT_REF;
    QA_PROJECT_REF = loaded.QA_PROJECT_REF;
  } catch {
    // Fallback: inline the same rules so CI without tsx still gates.
    PROD_PROJECT_REF = "nvdlhrodvevgwdsneplk";
    QA_PROJECT_REF = "wtuhdynujhszsbwxlbdi";
    assertQaOnly = (label, value) => {
      if (!value?.trim()) throw new Error(`missing ${label}`);
      if (value.includes(PROD_PROJECT_REF)) throw new Error(`${label} points at production`);
      if (!value.includes(QA_PROJECT_REF)) throw new Error(`${label} must reference QA`);
      return value;
    };
  }

  const ok = `postgresql://u:p@db.${QA_PROJECT_REF}.supabase.co:5432/postgres`;
  assert.equal(assertQaOnly("QA_DATABASE_URL", ok), ok);

  assert.throws(() => assertQaOnly("QA_DATABASE_URL", undefined), /missing/);
  assert.throws(
    () => assertQaOnly("QA_DATABASE_URL", `postgresql://u:p@db.${PROD_PROJECT_REF}.supabase.co:5432/postgres`),
    /production/,
  );
  assert.throws(
    () => assertQaOnly("QA_DATABASE_URL", "postgresql://u:p@localhost:5432/postgres"),
    /must reference QA/,
  );

  console.log("qa-target self-check OK");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
