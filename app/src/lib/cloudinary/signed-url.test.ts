import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

beforeEach(() => {
  vi.resetModules();
  vi.unstubAllEnvs();
  vi.stubEnv("CLOUDINARY_CLOUD_NAME", "dzqy2ixl0");
  vi.stubEnv("CLOUDINARY_API_KEY", "test-api-key");
  vi.stubEnv("CLOUDINARY_API_SECRET", "test-api-secret");
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

async function importSignedUrl() {
  return import("./signed-url");
}

describe("cloudinarySignedPresetUrl", () => {
  it("builds a signed authenticated-type delivery URL for a preset", async () => {
    const { cloudinarySignedPresetUrl } = await importSignedUrl();
    const url = cloudinarySignedPresetUrl("some-public-id", "asset-tile");
    expect(url).toMatch(/^https:\/\/res\.cloudinary\.com\/dzqy2ixl0\/image\/authenticated\/s--[\w-]+--\//);
    expect(url).toContain("c_thumb,w_120,h_120,g_auto,f_auto,q_auto");
    expect(url).toContain("some-public-id");
  });

  it("produces a different signature for a different preset (no cross-preset collision)", async () => {
    const { cloudinarySignedPresetUrl } = await importSignedUrl();
    const tile = cloudinarySignedPresetUrl("some-public-id", "asset-tile");
    const cover = cloudinarySignedPresetUrl("some-public-id", "brand-cover");
    expect(tile).not.toBe(cover);
  });

  it("throws when Cloudinary env vars are missing", async () => {
    vi.stubEnv("CLOUDINARY_API_SECRET", "");
    const { cloudinarySignedPresetUrl } = await importSignedUrl();
    expect(() => cloudinarySignedPresetUrl("some-public-id", "asset-tile")).toThrow();
  });
});

describe("cloudinarySignedChannelUrl", () => {
  it("builds a signed authenticated-type delivery URL from arbitrary channel dimensions", async () => {
    const { cloudinarySignedChannelUrl } = await importSignedUrl();
    const url = cloudinarySignedChannelUrl("some-public-id", { widthPx: 1080, heightPx: 1350 });
    expect(url).toMatch(/^https:\/\/res\.cloudinary\.com\/dzqy2ixl0\/image\/authenticated\/s--[\w-]+--\//);
    expect(url).toContain("c_fill,w_1080,h_1350,g_auto,f_auto,q_auto");
  });
});
