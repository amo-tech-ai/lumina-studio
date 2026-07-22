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
  return import("./cloudinary-signed-url");
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

describe("cloudinarySignedPresetUrl resource_type", () => {
  it("signs video delivery under /video/ without image crop transforms", async () => {
    const { cloudinarySignedPresetUrl } = await importSignedUrl();
    const url = cloudinarySignedPresetUrl("clip-01", "asset-detail", {
      resourceType: "video",
      deliveryType: "authenticated",
    });
    expect(url).toMatch(/^https:\/\/res\.cloudinary\.com\/dzqy2ixl0\/video\/authenticated\/s--[\w-]+--\//);
    expect(url).not.toContain("c_limit");
    expect(url).toContain("clip-01");
  });

  it("signs raw delivery under /raw/", async () => {
    const { cloudinarySignedPresetUrl } = await importSignedUrl();
    const url = cloudinarySignedPresetUrl("docs/brief.pdf", "asset-detail", {
      resourceType: "raw",
      deliveryType: "authenticated",
    });
    expect(url).toMatch(/^https:\/\/res\.cloudinary\.com\/dzqy2ixl0\/raw\/authenticated\/s--[\w-]+--\//);
  });
});

describe("cloudinarySignedDownloadUrl", () => {
  it("uses private_download_url with attachment when format is known", async () => {
    const { cloudinarySignedDownloadUrl } = await importSignedUrl();
    const url = cloudinarySignedDownloadUrl("brand/look-01", {
      resourceType: "image",
      deliveryType: "authenticated",
      format: "png",
    });
    expect(url).toContain("api.cloudinary.com");
    expect(url).toContain("attachment");
    expect(url).toContain("brand%2Flook-01");
  });

  it("falls back to signed fl_attachment delivery when format is unknown", async () => {
    const { cloudinarySignedDownloadUrl } = await importSignedUrl();
    const url = cloudinarySignedDownloadUrl("brand/look-01", {
      resourceType: "image",
      deliveryType: "authenticated",
    });
    expect(url).toMatch(/^https:\/\/res\.cloudinary\.com\/dzqy2ixl0\/image\/authenticated\/s--[\w-]+--\//);
    expect(url).toContain("fl_attachment");
  });
});
