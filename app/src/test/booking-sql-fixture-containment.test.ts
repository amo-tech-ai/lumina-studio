import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

/**
 * IPI-810 · DB-TEST-001 — every mutating booking SQL fixture must roll back.
 *
 * scripts/verify-booking-gate.mjs runs these files with psql against whatever database CI
 * points at. On a push to main that is production, so a file that COMMITs leaves auth.users /
 * organizations / brands rows behind permanently.
 *
 * Wrapping each file in `begin; … rollback;` fixes that, but nothing stops a ninth file being
 * added to the sqlTests array later without the wrapper — which would silently restore the
 * leak. This test is that guard.
 *
 * It reads the sqlTests array out of the runner rather than hard-coding a list, so a newly
 * added file is covered the moment it is registered.
 */

const repoRoot = resolve(__dirname, "../../..");
const runnerPath = resolve(repoRoot, "scripts/verify-booking-gate.mjs");
const runner = readFileSync(runnerPath, "utf8");

/**
 * Files that legitimately need no transaction wrapper because they never write.
 * Adding to this list is a deliberate act — a reviewer should ask why.
 */
const READ_ONLY_ALLOWLIST = new Set(["scripts/test-create-booking-request.sql"]);

/** The sqlTests array as the runner actually defines it. */
function registeredSqlTests(): string[] {
  const block = /const\s+sqlTests\s*=\s*\[([\s\S]*?)\]/.exec(runner);
  expect(block, "could not find the sqlTests array in verify-booking-gate.mjs").not.toBeNull();
  const files = [...block![1].matchAll(/["'`]([^"'`]+\.sql)["'`]/g)].map((m) => m[1]);
  expect(files.length, "sqlTests parsed as empty — the array shape changed").toBeGreaterThan(0);
  return files;
}

/** Statement-position lines only — ignores comments and plpgsql DO-block keywords. */
function topLevelStatements(sql: string): string[] {
  return sql
    .split("\n")
    .map((l) => l.trim().toLowerCase())
    .filter((l) => l.length > 0 && !l.startsWith("--"));
}

describe("booking SQL fixtures roll back (IPI-810 · DB-TEST-001)", () => {
  const files = registeredSqlTests();

  it("finds every registered SQL test on disk", () => {
    for (const rel of files) {
      expect(() => readFileSync(resolve(repoRoot, rel), "utf8"), `${rel} is registered but missing`)
        .not.toThrow();
    }
  });

  it.each(files)("%s is transaction-wrapped, or explicitly allowlisted as read-only", (rel) => {
    const sql = readFileSync(resolve(repoRoot, rel), "utf8");
    const statements = topLevelStatements(sql);

    if (READ_ONLY_ALLOWLIST.has(rel)) {
      // An allowlisted file must actually stay read-only, or the allowlist is a lie.
      const writes = statements.filter((l) =>
        /^(insert\s+into|update\s+|delete\s+from|truncate|create\s+(table|temp)|drop\s+table)\b/.test(l),
      );
      expect(
        writes,
        `${rel} is allowlisted as read-only but contains write statements — wrap it or remove it from the allowlist`,
      ).toEqual([]);
      return;
    }

    // `begin;` on its own line is a transaction start. plpgsql `begin` inside a DO block is
    // never followed by a semicolon on the same line, so this does not collide with it.
    expect(
      statements.filter((l) => l === "begin;").length,
      `${rel} must open with a top-level 'begin;' — otherwise its fixtures COMMIT into whatever database CI targets`,
    ).toBe(1);

    expect(
      statements.at(-1),
      `${rel} must end with 'rollback;' so its fixtures never persist`,
    ).toBe("rollback;");

    expect(
      statements.filter((l) => l === "commit;"),
      `${rel} contains a top-level 'commit;' — that defeats the rollback and persists fixtures`,
    ).toEqual([]);
  });

  it("keeps the read-only allowlist minimal and honest", () => {
    // Every allowlisted path must still be registered; a stale entry hides a real gap.
    for (const allowed of READ_ONLY_ALLOWLIST) {
      expect(files, `${allowed} is allowlisted but no longer registered in sqlTests`).toContain(
        allowed,
      );
    }
    expect(
      READ_ONLY_ALLOWLIST.size,
      "the read-only allowlist grew — each entry must be justified in review",
    ).toBeLessThanOrEqual(1);
  });
});
