import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const ROUTE = resolve(fileURLToPath(new URL(".", import.meta.url)), "route.ts");

// Regression guard (IPI2-127): a refactor must not un-wrap a handler and re-open
// the unauthenticated-SSE bypass. Asserts every HTTP method export goes through
// withOperatorAuth. (Absorbed from the superseded #44.)
describe("CopilotKit route — operator auth boundary (IPI2-127)", () => {
  it("wraps every HTTP export with withOperatorAuth so both runtime modes stay gated", () => {
    const src = readFileSync(ROUTE, "utf8");
    expect(src).toMatch(/withOperatorAuth\(request,\s*endpoint\)/);
    for (const method of ["GET", "POST", "PATCH", "DELETE"] as const) {
      expect(src).toMatch(new RegExp(`export const ${method} = handler`));
    }
  });
});
