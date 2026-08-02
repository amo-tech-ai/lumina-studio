import { describe, expect, it, vi, afterEach } from "vitest";
import type { MetadataRoute } from "next";
import robots from "./robots";

// IPI-902 · CF-MKT-002 — robots.ts is a plain module (no next/font, no server
// deps) so the default export is testable directly under vitest (node env).
// MetadataRoute.Robots.rules accepts a single rule or an array — normalize.

function rulesOf(output: MetadataRoute.Robots): MetadataRoute.Robots["rules"][] {
  return Array.isArray(output.rules) ? output.rules : [output.rules];
}

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("robots.ts (application-owned robots.txt)", () => {
  it("allows public marketing routes to be crawled", async () => {
    const output = robots();
    const rule = rulesOf(output).find((r) => r.userAgent === "*");
    expect(rule && "allow" in rule ? rule.allow : undefined).toBe("/");
  });

  it("keeps the operator hub, auth, and API routes out of the index", () => {
    const output = robots();
    const rule = rulesOf(output).find((r) => r.userAgent === "*");
    expect(rule && "disallow" in rule ? rule.disallow : []).toEqual([
      "/app/",
      "/auth/",
      "/api/",
    ]);
  });

  it("points the sitemap at the canonical production domain", () => {
    delete process.env.NEXT_PUBLIC_SITE_URL;
    const output = robots();
    expect(output.sitemap).toBe("https://www.ipix.co/sitemap.xml");
  });

  it("never points the sitemap at a workers.dev preview host", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://ipix-operator-preview.sk-498.workers.dev");
    const output = robots();
    expect(output.sitemap).toBe("https://www.ipix.co/sitemap.xml");
  });
});
