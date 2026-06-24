import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { SERVICES } from "@/components/marketing/services";

const APP_DIR = resolve(fileURLToPath(new URL(".", import.meta.url)), "../app");

const MARKETING_TOP_LEVEL = ["/", "/login"] as const;

const OPERATOR_SECTIONS = [
  "brand",
  "shoots",
  "assets",
  "campaigns",
  "matching",
] as const;

function marketingPagePath(urlPath: string): string {
  if (urlPath === "/") return join(APP_DIR, "(marketing)/page.tsx");
  const segments = urlPath.replace(/^\//, "").split("/");
  return join(APP_DIR, "(marketing)", ...segments, "page.tsx");
}

function operatorPagePath(section: string): string {
  return join(APP_DIR, "(operator)/app", section, "page.tsx");
}

describe("marketing route contract (WEB-001 / WEB-014)", () => {
  it("defines home and login marketing pages on disk", () => {
    for (const route of MARKETING_TOP_LEVEL) {
      expect(existsSync(marketingPagePath(route)), route).toBe(true);
    }
  });

  it("defines the operator hub at /app and every workspace section", () => {
    expect(existsSync(join(APP_DIR, "(operator)/app/page.tsx"))).toBe(true);
    for (const section of OPERATOR_SECTIONS) {
      expect(existsSync(operatorPagePath(section)), `/app/${section}`).toBe(
        true,
      );
    }
  });

  it("keeps operator sections aligned with on-disk routes (agent navigateTo guard)", () => {
    const onDisk = readdirSync(join(APP_DIR, "(operator)/app"), {
      withFileTypes: true,
    })
      .filter((e) => e.isDirectory())
      .map((e) => e.name)
      .sort();
    expect(onDisk).toEqual([...OPERATOR_SECTIONS].sort());
  });

  it("covers all service pages referenced by the nav registry", () => {
    expect(SERVICES.length).toBeGreaterThan(0);
    for (const { href } of SERVICES) {
      expect(existsSync(marketingPagePath(href)), href).toBe(true);
    }
  });
});

function mountsOperatorShell(source: string): boolean {
  return (
    /^import\s+.*\bCopilotKit\b/m.test(source) ||
    /^import\s+.*\bOperatorPanel\b/m.test(source) ||
    /<CopilotKit[\s>]/.test(source) ||
    /<OperatorPanel[\s>]/.test(source)
  );
}

describe("route group isolation (no CopilotKit on marketing)", () => {
  it("root layout does not mount CopilotKit or OperatorPanel", () => {
    const src = readFileSync(join(APP_DIR, "layout.tsx"), "utf8");
    expect(mountsOperatorShell(src)).toBe(false);
  });

  it("marketing layout does not mount operator shell", () => {
    const src = readFileSync(join(APP_DIR, "(marketing)/layout.tsx"), "utf8");
    expect(mountsOperatorShell(src)).toBe(false);
  });

  it("operator layout mounts CopilotKit + OperatorPanel", () => {
    const src = readFileSync(join(APP_DIR, "(operator)/layout.tsx"), "utf8");
    expect(mountsOperatorShell(src)).toBe(true);
  });

  it("not-found is root-scoped (no operator shell, marketing tokens only)", () => {
    const src = readFileSync(join(APP_DIR, "not-found.tsx"), "utf8");
    expect(mountsOperatorShell(src)).toBe(false);
    expect(src).toMatch(/className="marketing/);
    expect(src).toMatch(/index:\s*false/);
  });
});
