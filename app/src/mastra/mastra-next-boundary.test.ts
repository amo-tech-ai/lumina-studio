import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const NEXT_RUNTIME = /from\s+["']next\/(server|headers|cookies|cache)(?:\.js)?["']/;

function walkTs(dir: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    const full = path.join(dir, name);
    if (statSync(full).isDirectory()) {
      out.push(...walkTs(full));
      continue;
    }
    if (name.endsWith(".ts") && !name.endsWith(".test.ts")) {
      out.push(full);
    }
  }
  return out;
}

const MASTRA_REACHABLE_LIB = [
  path.join(__dirname, "../app/api/_lib/process-draft-approval.ts"),
  path.join(__dirname, "../app/api/_lib/with-workflow-mastra-pg-scope.ts"),
];

describe("IPI-1018 Mastra next/server boundary", () => {
  it("app/src/mastra/** does not import Next request/runtime APIs", () => {
    const hits = walkTs(__dirname).filter((file) =>
      NEXT_RUNTIME.test(readFileSync(file, "utf8")),
    );
    expect(hits).toEqual([]);
  });

  it("Mastra-reachable approval/resume modules do not import next/server", () => {
    for (const file of MASTRA_REACHABLE_LIB) {
      const src = readFileSync(file, "utf8");
      expect(src, file).not.toMatch(NEXT_RUNTIME);
    }
    const approval = readFileSync(MASTRA_REACHABLE_LIB[0], "utf8");
    expect(approval).not.toMatch(/import\("\.\/with-workflow-mastra-pg"\)/);
    expect(approval).toMatch(/import\("\.\/with-workflow-mastra-pg-scope"\)/);
  });
});
