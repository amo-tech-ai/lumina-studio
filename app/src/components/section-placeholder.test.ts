import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const COMPONENT_DIR = resolve(
  fileURLToPath(new URL(".", import.meta.url)),
  ".",
);

describe("SectionPlaceholder (operator scaffold back-link)", () => {
  it("links back to the operator Command Center at /app, not marketing home", () => {
    const src = readFileSync(join(COMPONENT_DIR, "section-placeholder.tsx"), "utf8");
    expect(src).toMatch(/href="\/app"/);
    expect(src).not.toMatch(/href="\/"/);
  });

  it("is used by every scaffolded operator workspace section", () => {
    const operatorAppDir = resolve(COMPONENT_DIR, "../app/(operator)/app");
    const sections = ["brand", "shoots", "assets", "campaigns", "matching"] as const;
    for (const section of sections) {
      const src = readFileSync(join(operatorAppDir, section, "page.tsx"), "utf8");
      expect(src, `/app/${section}`).toMatch(/SectionPlaceholder/);
    }
  });
});
