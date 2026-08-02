import { afterEach, describe, expect, it, vi } from "vitest";
import { SERVICES } from "@/components/marketing/services";

// IPI-902 · CF-MKT-002 — sitemap.ts is a plain module; the default export is
// testable directly. The route module is imported dynamically per test:
// SITE_URL is resolved at module evaluation, so resetModules + dynamic import
// after each env change is required for env-dependent assertions to exercise
// the production-origin pinning. SERVICES is env-independent (static registry).
// lastModified is a runtime timestamp, so assertions never pin exact dates.

async function loadSitemap() {
  const { default: sitemap } = await import("./sitemap");
  return sitemap();
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe("sitemap.ts (application-owned sitemap.xml)", () => {
  it("contains the home page and every marketing service route", async () => {
    delete process.env.NEXT_PUBLIC_SITE_URL;
    const urls = (await loadSitemap()).map((entry) => entry.url);
    expect(urls).toContain("https://www.ipix.co/");
    for (const { href } of SERVICES) {
      expect(urls).toContain(`https://www.ipix.co${href}`);
    }
  });

  it("contains exactly one entry per public route (home + services)", async () => {
    delete process.env.NEXT_PUBLIC_SITE_URL;
    const urls = (await loadSitemap()).map((entry) => entry.url);
    expect(urls).toHaveLength(1 + SERVICES.length);
    expect(new Set(urls).size).toBe(urls.length);
  });

  it("never contains a preview or Vercel host", async () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://ipix-operator-preview.sk-498.workers.dev");
    for (const entry of await loadSitemap()) {
      expect(entry.url.startsWith("https://www.ipix.co/")).toBe(true);
      expect(entry.url).not.toMatch(/workers\.dev/);
      expect(entry.url).not.toMatch(/vercel\.app/);
    }
  });

  it("never contains a custom preview domain", async () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://preview.fashionos.co");
    for (const entry of await loadSitemap()) {
      expect(entry.url.startsWith("https://www.ipix.co/")).toBe(true);
      expect(entry.url).not.toMatch(/preview\.fashionos\.co/);
    }
  });

  it("excludes /login (noindex per login/page.tsx SEO policy)", async () => {
    delete process.env.NEXT_PUBLIC_SITE_URL;
    const urls = (await loadSitemap()).map((entry) => entry.url);
    expect(urls).not.toContain("https://www.ipix.co/login");
  });

  it("gives the home page top priority and services a lower priority", async () => {
    delete process.env.NEXT_PUBLIC_SITE_URL;
    const entries = await loadSitemap();
    expect(entries[0].url).toBe("https://www.ipix.co/");
    expect(entries[0].priority).toBe(1);
    for (const entry of entries.slice(1)) {
      expect(entry.priority).toBe(0.8);
    }
  });
});
