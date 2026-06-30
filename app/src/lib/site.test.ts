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
