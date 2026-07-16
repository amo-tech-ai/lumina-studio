import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const NEXT_CONFIG = join(import.meta.dirname, "..", "next.config.ts");

describe("next.config.ts build guard (IPI-468)", () => {
  it("does not import operator-gate — that module pulls @/lib/auth into config compile", () => {
    const src = readFileSync(NEXT_CONFIG, "utf8");
    expect(src).not.toMatch(/from\s+["'].*operator-gate["']/);
    expect(src).toMatch(/operator-auth-env/);
  });
});
