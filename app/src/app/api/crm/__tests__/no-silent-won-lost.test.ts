import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

/** IPI-367 Task 3 — regression proof that exactly one production file across
 *  every CRM API route and every crm-assistant Mastra tool can even
 *  syntactically construct a won/lost stage write. This is a source-grep
 *  test, not a runtime one — it catches a *second* write path being added
 *  later (e.g. a new route, a new Mastra tool) before it ever ships, which
 *  no amount of unit-testing the convert route alone would catch. */

const SCAN_ROOTS = [
  join(__dirname, ".."), // app/src/app/api/crm/**
  join(__dirname, "..", "..", "..", "..", "mastra", "tools", "crm"), // app/src/mastra/tools/crm/**
];

const WON_LOST_LITERAL = /['"]won['"]|['"]lost['"]/;

function listTsFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      out.push(...listTsFiles(full));
    } else if (entry.endsWith(".ts") && !entry.endsWith(".test.ts")) {
      out.push(full);
    }
  }
  return out;
}

describe("IPI-367 — no silent won/lost write path", () => {
  it("exactly one production file under api/crm/** + mastra/tools/crm/** contains a won/lost literal, and it's the convert route", () => {
    const files = SCAN_ROOTS.flatMap(listTsFiles);
    expect(files.length).toBeGreaterThan(0); // sanity — the scan actually found files

    const matches = files.filter((f) => WON_LOST_LITERAL.test(readFileSync(f, "utf8")));

    expect(matches).toHaveLength(1);
    expect(matches[0]).toMatch(/deals[/\\]\[id\][/\\]convert[/\\]route\.ts$/);
  });
});
