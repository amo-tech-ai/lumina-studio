import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

describe("CF-MIG-210 — auth callback trusted hosts", () => {
  it("allows *.workers.dev for OAuth redirect origin", () => {
    const src = readFileSync(
      join(process.cwd(), "src/app/auth/callback/route.ts"),
      "utf8",
    );
    expect(src).toMatch(/\.workers\.dev/);
    expect(src).toMatch(/\.vercel\.app/);
  });
});
