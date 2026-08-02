import { afterEach, describe, expect, it, vi } from "vitest";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe("SITE_URL (WEB-014 SEO)", () => {
  it("defaults to the production marketing domain when env is unset", async () => {
    delete process.env.NEXT_PUBLIC_SITE_URL;
    const { SITE_URL } = await import("./site");
    expect(SITE_URL).toBe("https://www.ipix.co");
  });

  it("honors NEXT_PUBLIC_SITE_URL for per-environment metadataBase", async () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://preview.fashionos.co");
    const { SITE_URL } = await import("./site");
    expect(SITE_URL).toBe("https://preview.fashionos.co");
  });

  it("is always a valid absolute https URL", async () => {
    const { SITE_URL } = await import("./site");
    const url = new URL(SITE_URL);
    expect(url.protocol).toBe("https:");
  });

  it("falls back to the default domain when NEXT_PUBLIC_SITE_URL is malformed", async () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "not a valid url!!!");
    const { SITE_URL } = await import("./site");
    expect(SITE_URL).toBe("https://www.ipix.co");
  });
});

describe("normalizeSiteUrl preview-host guard (IPI-902 · CF-MKT-002)", () => {
  it("rejects a workers.dev preview host — falls back to the canonical domain", async () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://ipix-operator-preview.sk-498.workers.dev");
    const { SITE_URL } = await import("./site");
    expect(SITE_URL).toBe("https://www.ipix.co");
  });

  it("rejects a vercel.app host — falls back to the canonical domain", async () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://ipix-operator-git-main.vercel.app");
    const { SITE_URL } = await import("./site");
    expect(SITE_URL).toBe("https://www.ipix.co");
  });

  it("rejects a subdomain of workers.dev (hosts that never become canonical)", async () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://anything.workers.dev");
    const { SITE_URL } = await import("./site");
    expect(SITE_URL).toBe("https://www.ipix.co");
  });
});

describe("canonicalUrl (IPI-902 · CF-MKT-002)", () => {
  it("resolves a service path to an absolute canonical URL on the canonical host", async () => {
    delete process.env.NEXT_PUBLIC_SITE_URL;
    const { canonicalUrl } = await import("./site");
    expect(canonicalUrl("/services/clothing")).toBe("https://www.ipix.co/services/clothing");
  });

  it("defaults to the home path", async () => {
    delete process.env.NEXT_PUBLIC_SITE_URL;
    const { canonicalUrl } = await import("./site");
    expect(canonicalUrl()).toBe("https://www.ipix.co/");
  });

  it("never emits a preview host into canonical URLs even when env points at one", async () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://ipix-operator-preview.sk-498.workers.dev");
    const { canonicalUrl } = await import("./site");
    expect(canonicalUrl("/services/amazon")).toBe("https://www.ipix.co/services/amazon");
  });
});
