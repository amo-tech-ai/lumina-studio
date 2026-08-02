import { afterEach, describe, expect, it, vi } from "vitest";

// IPI-902 · CF-MKT-002 — robots.ts is a plain module (no next/font, no server
// deps) so the default export is testable directly under vitest (node env).
// The route module is imported dynamically per test: SITE_URL is resolved at
// module evaluation, so resetModules + dynamic import after each env change
// is required for env-dependent assertions to exercise the guard.
// MetadataRoute.Robots.rules accepts a single rule or an array — normalize.

type RobotsRule = { userAgent: string | string[] } & Record<string, unknown>;

async function loadRobots() {
  const { default: robots } = await import("./robots");
  return robots();
}

function rulesOf(output: { rules: RobotsRule | RobotsRule[] }): RobotsRule[] {
  return Array.isArray(output.rules) ? output.rules : [output.rules];
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe("robots.ts (application-owned robots.txt)", () => {
  it("allows public marketing routes to be crawled", async () => {
    const output = await loadRobots();
    const rule = rulesOf(output).find((r) => r.userAgent === "*");
    expect(rule && "allow" in rule ? rule.allow : undefined).toBe("/");
  });

  it("keeps the operator hub, auth, and API routes out of the index", async () => {
    const output = await loadRobots();
    const rule = rulesOf(output).find((r) => r.userAgent === "*");
    expect(rule && "disallow" in rule ? rule.disallow : []).toEqual([
      "/app/",
      "/auth/",
      "/api/",
    ]);
  });

  it("points the sitemap at the canonical production domain", async () => {
    delete process.env.NEXT_PUBLIC_SITE_URL;
    const output = await loadRobots();
    expect(output.sitemap).toBe("https://www.ipix.co/sitemap.xml");
  });

  it("never points the sitemap at a workers.dev preview host", async () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://ipix-operator-preview.sk-498.workers.dev");
    const output = await loadRobots();
    expect(output.sitemap).toBe("https://www.ipix.co/sitemap.xml");
  });

  it("never points the sitemap at a custom preview domain", async () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://preview.fashionos.co");
    const output = await loadRobots();
    expect(output.sitemap).toBe("https://www.ipix.co/sitemap.xml");
  });
});
