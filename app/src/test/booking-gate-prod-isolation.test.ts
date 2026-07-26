import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

/**
 * IPI-810 phase 2 — the booking-gate job must never write to production on a pull request.
 *
 * Phase 1 routed DATABASE_URL to QA_DATABASE_URL and refused the production ref in the
 * connection string. That left the API path open: verify-booking-gate.mjs spawns
 * verify-rls.mjs, which builds a createClient() from NEXT_PUBLIC_SUPABASE_URL plus the
 * service-role key and creates real auth.users / organizations / brands rows with
 * non-atomic teardown. Those secrets had no pull_request branch, and the guard inspected
 * only the Postgres URL — so adding QA_DATABASE_URL alone would have unskipped the job and
 * written to production over HTTP while every check reported green.
 *
 * These are text assertions over ci.yml because the failure mode is a workflow edit, not
 * runtime behaviour. The first test is the important one: text assertions alone cannot see
 * GitHub expression *semantics*, and the first cut of this fix shipped a
 * `== 'pull_request' && '' || secrets.X` chain that reads as "empty on a pull request" but
 * evaluates to the production secret. That test encodes the semantic rule so the spelling
 * cannot regress.
 */

const ciYml = readFileSync(resolve(__dirname, "../../../.github/workflows/ci.yml"), "utf8");

/** The `booking-gate:` job body, sliced to the next top-level job key. */
function bookingGateJob(): string {
  const start = ciYml.indexOf("\n  booking-gate:\n");
  expect(start, "booking-gate job not found in ci.yml").toBeGreaterThanOrEqual(0);
  const rest = ciYml.slice(start + 1);
  const next = rest.search(/\n {2}[a-z0-9-]+:\n/);
  return next === -1 ? rest : rest.slice(0, next);
}

/** A named step's text, from its `- name:` line to the end of the job. */
function stepBlock(job: string, name: string): string {
  const i = job.indexOf(`- name: ${name}`);
  expect(i, `step "${name}" not found in the booking-gate job`).toBeGreaterThanOrEqual(0);
  return job.slice(i);
}

describe("booking-gate production isolation (IPI-810)", () => {
  const job = bookingGateJob();

  // GitHub's `a && b || c` returns operand *values*, not booleans. If b is falsy the chain
  // always falls through to c, so `cond && '' || secrets.X` yields secrets.X on every event
  // — the opposite of what it reads like. Any credential ternary must therefore put the
  // secret in the middle operand and the empty string last. Scanned across the whole file,
  // not just this job, because the trap is not job-specific.
  it("contains no falsy-middle-operand ternary anywhere in ci.yml", () => {
    const offenders = [...ciYml.matchAll(/\$\{\{[^}]*\}\}/g)]
      .map((m) => m[0])
      .filter((expr) => /&&\s*''/.test(expr));

    expect(
      offenders,
      "GitHub's `a && b || c` returns operand values: a falsy middle operand always falls " +
        "through to c, so these expressions resolve to their fallback on every event. " +
        "Invert the condition and put the empty string last.",
    ).toEqual([]);
  });

  it("withholds all three production API credentials from the Model Gate step on pull requests", () => {
    const modelGate = stepBlock(job, "Model Gate verification");
    for (const secret of [
      "NEXT_PUBLIC_SUPABASE_URL",
      "NEXT_PUBLIC_SUPABASE_ANON_KEY",
      "SUPABASE_SERVICE_ROLE_KEY",
    ]) {
      const line = modelGate.split("\n").find((l) => l.trim().startsWith(`${secret}:`));
      expect(line, `${secret} missing from Model Gate step`).toBeDefined();
      // Inverted form only: the secret in the middle, '' last.
      expect(
        line,
        `${secret} must resolve to '' on a pull request — put the secret in the middle operand`,
      ).toMatch(
        new RegExp(
          `github\\.event_name != 'pull_request' && secrets\\.${secret} \\|\\| ''`,
        ),
      );
    }
  });

  it("passes --skip-api to the gate script on pull requests", () => {
    // Truthy middle operand here, so this ternary is correct as written.
    expect(job).toMatch(
      /npm run supabase:verify-booking-gate -- \$\{\{ github\.event_name == 'pull_request' && '--skip-api'/,
    );
  });

  it("runs the planner scenario on push only", () => {
    const planner = stepBlock(job, "Planner scenario + Realtime verification");
    // It takes production API credentials directly and writes fixtures. Its credentials are
    // intentionally unconditional because this guard stops it running on a pull request.
    expect(planner.split("run:")[0]).toMatch(/if: github\.event_name != 'pull_request'/);
  });

  it("refuses the production ref in the Supabase API URL as well as the Postgres URL", () => {
    const guard = stepBlock(job, "Refuse the production project");
    expect(guard).toContain("RESOLVED_API_URL");
    expect(guard).toMatch(/Postgres URL:\$RESOLVED_DB_URL/);
    expect(guard).toMatch(/Supabase API URL:\$RESOLVED_API_URL/);
  });

  it("gates the verify-rls probe behind --skip-api in the gate script", () => {
    const script = readFileSync(
      resolve(__dirname, "../../../scripts/verify-booking-gate.mjs"),
      "utf8",
    );
    expect(script).toMatch(/--skip-api/);
    // The probe must sit in the else branch, never called unconditionally.
    expect(script).toMatch(/if \(skipApi\)[\s\S]*?\} else \{[\s\S]*?verify-rls\.mjs/);
    // And skipping it must not short-circuit the SQL tests that follow.
    expect(script).not.toMatch(/if \(skipApi\)[\s\S]{0,200}process\.exit/);
  });
});
