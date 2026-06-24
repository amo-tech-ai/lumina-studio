import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const ROUTE = resolve(fileURLToPath(new URL(".", import.meta.url)), "route.ts");

describe("CopilotKit route — operator auth boundary (IPI2-127)", () => {
  it("wraps every HTTP export with withOperatorAuth so both runtime modes stay gated", () => {
    const src = readFileSync(ROUTE, "utf8");
    expect(src).toMatch(/withOperatorAuth\(request,\s*endpoint\)/);
    for (const method of ["GET", "POST", "PATCH", "DELETE"] as const) {
      expect(src).toMatch(new RegExp(`export const ${method} = handler`));
    }
  });
});
