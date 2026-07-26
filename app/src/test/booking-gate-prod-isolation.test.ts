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
 * These assertions pin the invariants that closed it. They are text assertions over
 * ci.yml because the failure mode is a workflow edit, not runtime behaviour.
 */

const ciYml = readFileSync(resolve(__dirname, "../../../.github/workflows/ci.yml"), "utf8");

/** The `booking-gate:` job body, sliced to the next top-level job key. */
function bookingGateJob(): string {
  const start = ciYml.indexOf("\n  booking-gate:\n");
  expect(start, "booking-gate job not found in ci.yml").toBeGreaterThan(-1);
  const rest = ciYml.slice(start + 1);
  const next = rest.search(/\n {2}[a-z0-9-]+:\n/);
  return next === -1 ? rest : rest.slice(0, next);
}

describe("booking-gate production isolation (IPI-810)", () => {
  const job = bookingGateJob();

  it("withholds all three production API credentials from the Model Gate step on pull requests", () => {
    // Each must be conditioned on the event, not passed unconditionally. A bare
    // `secrets.NEXT_PUBLIC_SUPABASE_URL` here is exactly the phase 1 hole.
    for (const secret of [
      "NEXT_PUBLIC_SUPABASE_URL",
      "NEXT_PUBLIC_SUPABASE_ANON_KEY",
      "SUPABASE_SERVICE_ROLE_KEY",
    ]) {
      const modelGate = job.slice(job.indexOf("- name: Model Gate verification"));
      const line = modelGate
        .split("\n")
        .find((l) => l.trim().startsWith(`${secret}:`));
      expect(line, `${secret} missing from Model Gate step`).toBeDefined();
      expect(
        line,
        `${secret} must be empty on pull_request, not the production secret`,
      ).toMatch(/github\.event_name == 'pull_request' && ''/);
    }
  });

  it("passes --skip-api to the gate script on pull requests", () => {
    expect(job).toMatch(
      /npm run supabase:verify-booking-gate -- \$\{\{ github\.event_name == 'pull_request' && '--skip-api'/,
    );
  });

  it("runs the planner scenario on push only", () => {
    const planner = job.slice(job.indexOf("- name: Planner scenario + Realtime verification"));
    expect(planner, "planner step not found").not.toHaveLength(0);
    // It takes production API credentials directly and writes fixtures.
    expect(planner.split("run:")[0]).toMatch(/if: github\.event_name != 'pull_request'/);
  });

  it("refuses the production ref in the Supabase API URL as well as the Postgres URL", () => {
    const guard = job.slice(job.indexOf("- name: Refuse the production project"));
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
    // The probe must be inside the else branch, never called unconditionally.
    expect(script).toMatch(/if \(skipApi\)[\s\S]*?\} else \{[\s\S]*?verify-rls\.mjs/);
  });
});
