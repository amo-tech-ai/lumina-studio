import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import { BOOKING_SQL_TESTS } from "../../../scripts/booking-sql-tests.mjs";

/**
 * IPI-810 · DB-TEST-001 — every mutating booking SQL fixture must roll back.
 *
 * scripts/verify-booking-gate.mjs runs these files with psql against whatever database CI
 * points at. On a push to main that is production, so a file that COMMITs leaves auth.users /
 * organizations / brands rows behind permanently.
 *
 * Wrapping each file in `begin; … rollback;` fixes that, but nothing stops a ninth file being
 * added to the shared BOOKING_SQL_TESTS list later without the wrapper — which would silently
 * restore the leak. This test is that guard.
 *
 * It imports BOOKING_SQL_TESTS (same module the runner uses) rather than regex-parsing the
 * runner source, so a newly registered file is covered the moment it is added to the list.
 */

const repoRoot = resolve(__dirname, "../../..");

/**
 * Files that legitimately need no transaction wrapper because they never write.
 * Adding to this list is a deliberate act — a reviewer should ask why.
 */
const READ_ONLY_ALLOWLIST = new Set(["scripts/test-create-booking-request.sql"]);

/**
 * Allowlisted files must be exactly this shape: a pg_catalog identity-args lookup.
 * Absence of INSERT/UPDATE is not enough — SELECT public.some_rpc(...) or CALL could still write.
 */
const PERMITTED_CATALOG_QUERY =
  /^select\s+pg_catalog\.pg_get_function_identity_arguments\(p\.oid\)\s+as\s+args\s+from\s+pg_proc\s+p\s+join\s+pg_namespace\s+n\s+on\s+n\.oid\s*=\s+p\.pronamespace\s+where\s+n\.nspname\s*=\s+'public'\s+and\s+p\.proname\s*=\s+'[a-z0-9_]+'\s*;$/;

/** Statement-position lines only — ignores comments and plpgsql DO-block keywords. */
function topLevelStatements(sql: string): string[] {
  return sql
    .split("\n")
    .map((l) => l.trim().toLowerCase())
    .filter((l) => l.length > 0 && !l.startsWith("--"));
}

describe("booking SQL fixtures roll back (IPI-810 · DB-TEST-001)", () => {
  const files = BOOKING_SQL_TESTS;

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
      // Narrow permit: only the documented catalog query — not "no known write prefixes".
      const body = statements.join(" ").replace(/\s+/g, " ").trim();
      expect(
        body,
        `${rel} is allowlisted as read-only but is not the permitted pg_catalog identity-args query — wrap it or remove it from the allowlist`,
      ).toMatch(PERMITTED_CATALOG_QUERY);
      return;
    }

    // `begin;` on its own line is a transaction start. plpgsql `begin` inside a DO block is
    // never followed by a semicolon on the same line, so this does not collide with it.
    //
    // Position matters, not just presence: a file could write rows, THEN open a transaction and
    // roll it back, and a presence-only check would pass while the earlier writes persisted.
    expect(
      statements[0],
      `${rel} must open with 'begin;' as its very first statement — anything executed before it commits directly`,
    ).toBe("begin;");

    expect(
      statements.filter((l) => l === "begin;").length,
      `${rel} has more than one top-level 'begin;' — nested transaction starts are a mistake here`,
    ).toBe(1);

    expect(
      statements.at(-1),
      `${rel} must end with 'rollback;' so its fixtures never persist`,
    ).toBe("rollback;");

    // Matched by shape rather than exact equality: `commit;`, `COMMIT ;`, and
    // `commit; -- note` are all the same defect, and an exact === check misses the last two.
    expect(
      statements.filter((l) => /^commit\s*;/.test(l)),
      `${rel} contains a top-level 'commit;' — that defeats the rollback and persists fixtures`,
    ).toEqual([]);
  });

  it("keeps the read-only allowlist minimal and honest", () => {
    // Every allowlisted path must still be registered; a stale entry hides a real gap.
    for (const allowed of READ_ONLY_ALLOWLIST) {
      expect(files, `${allowed} is allowlisted but no longer registered in BOOKING_SQL_TESTS`).toContain(
        allowed,
      );
    }
    expect(
      READ_ONLY_ALLOWLIST.size,
      "the read-only allowlist grew — each entry must be justified in review",
    ).toBeLessThanOrEqual(1);
  });
});
