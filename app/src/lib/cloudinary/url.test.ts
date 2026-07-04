import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

beforeEach(() => {
  vi.resetModules();
  vi.unstubAllEnvs();
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

async function importUrl() {
  return import("./url");
}

describe("cloudinaryImageUrl", () => {
  it("defaults to crop=fill and includes gravity=auto", async () => {
    const { cloudinaryImageUrl } = await importUrl();
    const url = cloudinaryImageUrl("some-public-id", { w: 400, h: 300 });
    expect(url).toMatch(/^https:\/\/res\.cloudinary\.com\//);
    expect(url).toContain("c_fill,w_400,h_300,g_auto");
    expect(url).toContain("some-public-id");
  });

  it("honors an explicit crop override", async () => {
    const { cloudinaryImageUrl } = await importUrl();
    const url = cloudinaryImageUrl("some-public-id", { w: 100, h: 100, crop: "thumb" });
    expect(url).toContain("c_thumb,w_100,h_100,g_auto");
  });
});

describe("cloudinaryPresetUrl", () => {
  it("builds the asset-tile preset (thumb crop, no explicit gravity override)", async () => {
    const { cloudinaryPresetUrl } = await importUrl();
    const url = cloudinaryPresetUrl("some-public-id", "asset-tile");
    expect(url).toContain("c_thumb,w_120,h_120,g_auto");
    expect(url).toContain("f_auto");
    expect(url).toContain("q_auto");
  });

  it("builds the brand-cover preset", async () => {
    const { cloudinaryPresetUrl } = await importUrl();
    const url = cloudinaryPresetUrl("some-public-id", "brand-cover");
    expect(url).toContain("c_fill,w_400,h_300,g_auto");
    expect(url).toContain("f_auto");
    expect(url).toContain("q_auto");
  });

  it("builds the asset-masonry preset (limit crop, width only, no gravity)", async () => {
    const { cloudinaryPresetUrl } = await importUrl();
    const url = cloudinaryPresetUrl("some-public-id", "asset-masonry");
    expect(url).toContain("c_limit,w_600");
    expect(url).not.toContain("g_auto");
    expect(url).toContain("f_auto");
    expect(url).toContain("q_auto");
  });
});

describe("cloudinaryChannelUrl", () => {
  it("builds a fill crop from an arbitrary channel spec's dimensions", async () => {
    const { cloudinaryChannelUrl } = await importUrl();
    const url = cloudinaryChannelUrl("some-public-id", { widthPx: 1080, heightPx: 1350 });
    expect(url).toContain("c_fill,w_1080,h_1350,g_auto");
    expect(url).toContain("f_auto");
    expect(url).toContain("q_auto");
  });
});

describe("CLOUDINARY_CLOUD_NAME", () => {
  it("prefers NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME over the server-only var and the default", async () => {
    vi.stubEnv("NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME", "public-cloud");
    vi.stubEnv("CLOUDINARY_CLOUD_NAME", "server-cloud");
    const { CLOUDINARY_CLOUD_NAME, cloudinaryImageUrl } = await importUrl();
    expect(CLOUDINARY_CLOUD_NAME).toBe("public-cloud");
    expect(cloudinaryImageUrl("x", { w: 10, h: 10 })).toContain("res.cloudinary.com/public-cloud/");
  });

  it("falls back to CLOUDINARY_CLOUD_NAME when the public var is unset", async () => {
    vi.stubEnv("NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME", undefined);
    vi.stubEnv("CLOUDINARY_CLOUD_NAME", "server-cloud");
    const { CLOUDINARY_CLOUD_NAME } = await importUrl();
    expect(CLOUDINARY_CLOUD_NAME).toBe("server-cloud");
  });

  it("falls back to the dzqy2ixl0 default when neither var is set", async () => {
    vi.stubEnv("NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME", undefined);
    vi.stubEnv("CLOUDINARY_CLOUD_NAME", undefined);
    const { CLOUDINARY_CLOUD_NAME } = await importUrl();
    expect(CLOUDINARY_CLOUD_NAME).toBe("dzqy2ixl0");
  });
});
