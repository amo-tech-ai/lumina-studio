import { existsSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { SERVICES } from "./services";

const APP_DIR = resolve(fileURLToPath(new URL(".", import.meta.url)), "../../app");

describe("SERVICES nav registry (WEB-001…011)", () => {
  it("lists all 9 iPix service pages", () => {
    expect(SERVICES).toHaveLength(9);
  });

  it("uses unique hrefs under /services/", () => {
    const hrefs = SERVICES.map((s) => s.href);
    expect(new Set(hrefs).size).toBe(hrefs.length);
    for (const href of hrefs) {
      expect(href).toMatch(/^\/services\/[a-z0-9-]+$/);
    }
  });

  it("maps every href to an on-disk page.tsx (no broken nav links)", () => {
    for (const { href, label } of SERVICES) {
      const segment = href.replace(/^\/services\//, "");
      const pagePath = join(APP_DIR, "(marketing)/services", segment, "page.tsx");
      expect(existsSync(pagePath), `${label} → ${pagePath}`).toBe(true);
    }
  });

  it("footer column slices partition all services (no orphan nav links)", () => {
    const col1 = SERVICES.slice(0, 5);
    const col2 = SERVICES.slice(5);
    expect(col1.length + col2.length).toBe(SERVICES.length);
    expect(col1.length).toBeGreaterThan(0);
    expect(col2.length).toBeGreaterThan(0);
    const covered = new Set([...col1, ...col2].map((s) => s.href));
    for (const { href } of SERVICES) {
      expect(covered.has(href), href).toBe(true);
    }
  });
});
