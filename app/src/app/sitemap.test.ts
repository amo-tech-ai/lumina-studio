import { describe, expect, it, vi, afterEach } from "vitest";
import { SERVICES } from "@/components/marketing/services";
import sitemap from "./sitemap";

// IPI-902 · CF-MKT-002 — sitemap.ts is a plain module; the default export is
// testable directly. lastModified is a runtime timestamp, so assertions never
// pin exact dates.

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("sitemap.ts (application-owned sitemap.xml)", () => {
  it("contains the home page and every marketing service route", () => {
    delete process.env.NEXT_PUBLIC_SITE_URL;
    const urls = sitemap().map((entry) => entry.url);
    expect(urls).toContain("https://www.ipix.co/");
    for (const { href } of SERVICES) {
      expect(urls).toContain(`https://www.ipix.co${href}`);
    }
  });

  it("contains exactly one entry per public route (home + services)", () => {
    delete process.env.NEXT_PUBLIC_SITE_URL;
    const urls = sitemap().map((entry) => entry.url);
    expect(urls).toHaveLength(1 + SERVICES.length);
    expect(new Set(urls).size).toBe(urls.length);
  });

  it("never contains a preview or Vercel host", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://ipix-operator-preview.sk-498.workers.dev");
    for (const entry of sitemap()) {
      expect(entry.url.startsWith("https://www.ipix.co/")).toBe(true);
      expect(entry.url).not.toMatch(/workers\.dev/);
      expect(entry.url).not.toMatch(/vercel\.app/);
    }
  });

  it("excludes /login (noindex per login/page.tsx SEO policy)", () => {
    delete process.env.NEXT_PUBLIC_SITE_URL;
    const urls = sitemap().map((entry) => entry.url);
    expect(urls).not.toContain("https://www.ipix.co/login");
  });

  it("gives the home page top priority and services a lower priority", () => {
    delete process.env.NEXT_PUBLIC_SITE_URL;
    const entries = sitemap();
    expect(entries[0].url).toBe("https://www.ipix.co/");
    expect(entries[0].priority).toBe(1);
    for (const entry of entries.slice(1)) {
      expect(entry.priority).toBe(0.8);
    }
  });
});
