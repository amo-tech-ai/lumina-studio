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

/**
 * Is `operand` a literal that GitHub Actions evaluates as falsy?
 *
 * Non-numeric spellings are a closed set. Numbers are *evaluated* rather than enumerated —
 * GitHub accepts JSON number syntax, so `0.00`, `-0.0`, `0e0` and `.0` are all zero and all
 * falsy. An earlier version of this file listed `0`, `-0` and `0.0` by hand and let `0.00`
 * through, which is exactly the silent-fallthrough this scan exists to prevent.
 *
 * Quoted strings stay truthy unless empty: `'0'` is a non-empty string, so it survives as a
 * middle operand and must not be flagged.
 * https://docs.github.com/actions/learn-github-actions/expressions
 */
function isFalsyOperand(operand: string): boolean {
  if (!operand) return false;
  if (operand === "''" || operand === '""' || operand === "false" || operand === "null") {
    return true;
  }
  // Only bare numerics reach Number() as a finite value; `secrets.X`, `true` and `'0'` are NaN.
  const asNumber = Number(operand);
  return Number.isFinite(asNumber) && asNumber === 0;
}

/**
 * Every `${{ … }}` expression in `text` whose `a && b || c` middle operand is falsy.
 *
 * Parses the operand rather than matching one spelling: the first version tested `/&& ''/` and
 * silently accepted `&& false`, `&& null` and `&& 0`, which fail identically. The operand
 * pattern stops at `&` and `|` so it cannot run past its own operators.
 */
function findFalsyMiddleOperands(text: string): string[] {
  return [...text.matchAll(/\$\{\{[^}]*\}\}/g)]
    .map((m) => m[0])
    .filter((expr) =>
      [...expr.matchAll(/&&\s*([^&|]+?)\s*\|\|/g)].some((m) => isFalsyOperand(m[1].trim())),
    );
}

/**
 * Every `run:` scalar in `jobText`, including `run: |` and `run: >` block bodies.
 *
 * Matching `run:` lines alone misses the common block form, where the expansion sits on a
 * continuation line — which would let the exact template-injection shape this file prohibits
 * pass unnoticed. A block body is every following line indented deeper than the `run:` key.
 */
function runScalars(jobText: string): string[] {
  const lines = jobText.split("\n");
  const scalars: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const match = /^(\s*)run:\s*(.*)$/.exec(lines[i]);
    if (!match) continue;

    const indent = match[1].length;
    const inline = match[2].trim();
    if (inline && !/^[|>]/.test(inline)) {
      scalars.push(inline);
      continue;
    }

    const body: string[] = [];
    for (let j = i + 1; j < lines.length; j++) {
      if (lines[j].trim() === "") {
        body.push(lines[j]);
        continue;
      }
      if (lines[j].length - lines[j].trimStart().length <= indent) break;
      body.push(lines[j]);
    }
    scalars.push(body.join("\n"));
  }

  return scalars;
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
    expect(
      findFalsyMiddleOperands(ciYml),
      "GitHub's `a && b || c` returns operand values: a falsy middle operand always falls " +
        "through to c, so these expressions resolve to their fallback on every event. " +
        "Invert the condition and put the empty string last.",
    ).toEqual([]);
  });

  // The scanner is the thing standing between a one-character edit and production credentials
  // reaching a pull request, so it gets its own test. The first version matched only `&& ''`
  // and would have waved through `&& false`, `&& null` and `&& 0`, each of which is equally
  // falsy in a GitHub expression and falls through to the fallback in exactly the same way.
  it("flags every falsy literal as a middle operand, not just the empty string", () => {
    // Numeric zero has many spellings and GitHub accepts JSON number syntax, so these are
    // evaluated rather than enumerated. `0.00` slipped past the hand-written list.
    for (const falsy of ["''", '""', "false", "null", "0", "-0", "0.0", "0.00", "-0.0", "0e0", ".0"]) {
      const expr = `\${{ github.event_name == 'pull_request' && ${falsy} || secrets.PROD_URL }}`;
      expect(findFalsyMiddleOperands(expr), `${falsy} must be flagged`).toHaveLength(1);
    }
    // Truthy middle operands are the correct shape and must not be flagged — including
    // ci.yml's own `&& '--skip-api'`, and the secret-in-the-middle credential form. `'0'` is a
    // non-empty string, so it is truthy despite looking like zero.
    for (const truthy of ["secrets.PROD_URL", "'--skip-api'", "'1'", "'0'", "true", "1"]) {
      const expr = `\${{ github.event_name != 'pull_request' && ${truthy} || '' }}`;
      expect(findFalsyMiddleOperands(expr), `${truthy} must not be flagged`).toHaveLength(0);
    }
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
    const modelGate = stepBlock(job, "Model Gate verification");
    // Truthy middle operand here, so this ternary is the correct shape.
    expect(modelGate).toMatch(
      /SKIP_API_FLAG: \$\{\{ github\.event_name == 'pull_request' && '--skip-api' \|\| '' \}\}/,
    );
    expect(modelGate).toMatch(/run: npm run supabase:verify-booking-gate -- \$\{SKIP_API_FLAG\}/);
  });

  // zizmor's template-injection rule: a ${{ }} expansion inside a shell `run:` is re-parsed by
  // the shell. Not exploitable for a fixed literal, but the whole booking-gate job handles
  // credentials, so the shape stays out of `run:` entirely — values come through `env:`.
  it("never interpolates a GitHub expression directly into a run: script", () => {
    const offenders = runScalars(job).filter((scalar) => scalar.includes("${{"));
    expect(
      offenders,
      "pass the value through env: and reference it as a shell variable instead",
    ).toEqual([]);
  });

  // The scanner above is only as good as its YAML handling. The booking-gate job already uses
  // `run: |` for the target guard, so a body-line expansion is the realistic way this rule gets
  // violated — and a line-by-line filter cannot see it.
  it("detects an expression on a run: block body line, not just the run: line", () => {
    const inlineForm = `      - name: x\n        run: echo \${{ secrets.TOKEN }}\n`;
    const blockForm = `      - name: y\n        run: |\n          echo "start"\n          echo \${{ secrets.TOKEN }}\n`;
    const safeBlock = `      - name: z\n        run: |\n          echo "$TOKEN"\n`;

    expect(runScalars(inlineForm).filter((s) => s.includes("${{"))).toHaveLength(1);
    expect(
      runScalars(blockForm).filter((s) => s.includes("${{")),
      "a ${{ }} on a block-scalar body line must be caught",
    ).toHaveLength(1);
    expect(runScalars(safeBlock).filter((s) => s.includes("${{"))).toHaveLength(0);
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

  // IPI-892 · CI-QA-NET-001 — `db.<ref>.supabase.co` is IPv6-only and GitHub runners have no
  // IPv6 route, so psql fails at TCP connect with "Network is unreachable" and names neither
  // cause nor fix. It is also the first hostname the Supabase dashboard shows, so it is the
  // default mistake: QA_DATABASE_URL was wired that way and took every open pull request red
  // with it — booking-gate has no paths: filter, so this is repo-wide, not scoped to PRs that
  // touch supabase/**. The pattern is read out of ci.yml rather than restated, so an edit that
  // breaks the match fails here instead of at the next connection attempt.
  it("refuses a direct IPv6-only database host but allows the pooler", () => {
    const guard = stepBlock(job, "Refuse an IPv6-only direct database host");
    const pattern = /grep -qE '([^']+)'/.exec(guard);
    expect(pattern, "host-check grep pattern not found").not.toBeNull();
    const hostRe = new RegExp(pattern![1]);

    expect(hostRe.test("postgresql://postgres:pw@db.wtuhdynujhszsbwxlbdi.supabase.co:5432/postgres")).toBe(true);
    expect(
      hostRe.test(
        "postgresql://postgres.wtuhdynujhszsbwxlbdi:pw@aws-1-us-east-2.pooler.supabase.com:5432/postgres?sslmode=require",
      ),
      "the Supavisor pooler host is the fix, not the failure",
    ).toBe(false);
    // An unset secret means the job was already gated off upstream — not this step's call.
    expect(hostRe.test("")).toBe(false);
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
