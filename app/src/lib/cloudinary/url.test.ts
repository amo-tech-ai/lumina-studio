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

describe("presetTransformString / cropTransformString", () => {
  it("builds the asset-tile preset (thumb crop, gravity included)", async () => {
    const { presetTransformString } = await importUrl();
    expect(presetTransformString("asset-tile")).toBe("c_thumb,w_120,h_120,g_auto,f_auto,q_auto");
  });

  it("builds the brand-cover preset", async () => {
    const { presetTransformString } = await importUrl();
    expect(presetTransformString("brand-cover")).toBe("c_fill,w_400,h_300,g_auto,f_auto,q_auto");
  });

  it("builds the asset-masonry preset (limit crop, width only, no gravity)", async () => {
    const { presetTransformString } = await importUrl();
    expect(presetTransformString("asset-masonry")).toBe("c_limit,w_600,f_auto,q_auto");
  });

  it("builds an arbitrary fill crop from raw dimensions (channel-spec use case)", async () => {
    const { cropTransformString } = await importUrl();
    expect(cropTransformString({ width: 1080, height: 1350, crop: "fill" })).toBe(
      "c_fill,w_1080,h_1350,g_auto,f_auto,q_auto",
    );
  });
});

describe("withCloudinaryPreset", () => {
  it("inserts the preset transform right after /image/upload/", async () => {
    const { withCloudinaryPreset } = await importUrl();
    const url = withCloudinaryPreset(
      "https://res.cloudinary.com/dzqy2ixl0/image/upload/v1700000000/brand/asset_01.jpg",
      "asset-masonry",
    );
    expect(url).toBe(
      "https://res.cloudinary.com/dzqy2ixl0/image/upload/c_limit,w_600,f_auto,q_auto/v1700000000/brand/asset_01.jpg",
    );
  });

  it("returns the URL unchanged when it has no /image/upload/ marker", async () => {
    const { withCloudinaryPreset } = await importUrl();
    const url = "https://example.com/not-cloudinary.jpg";
    expect(withCloudinaryPreset(url, "asset-masonry")).toBe(url);
  });
});

describe("isDeliverableCover", () => {
  it("accepts a delivery URL under the configured cloud", async () => {
    const { isDeliverableCover } = await importUrl();
    expect(
      isDeliverableCover("https://res.cloudinary.com/dzqy2ixl0/image/upload/v1/5-fashionos_wc2p1c"),
    ).toBe(true);
  });

  it("rejects null, a foreign host, and a different cloud (next/image would throw)", async () => {
    const { isDeliverableCover } = await importUrl();
    expect(isDeliverableCover(null)).toBe(false);
    expect(isDeliverableCover("https://evil.example.com/x.jpg")).toBe(false);
    expect(isDeliverableCover("https://res.cloudinary.com/other-cloud/image/upload/x")).toBe(false);
  });
});

describe("CLOUDINARY_CLOUD_NAME", () => {
  it("resolves from NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME", async () => {
    vi.stubEnv("NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME", "public-cloud");
    const { CLOUDINARY_CLOUD_NAME, cloudinaryImageUrl } = await importUrl();
    expect(CLOUDINARY_CLOUD_NAME).toBe("public-cloud");
    expect(cloudinaryImageUrl("x", { w: 10, h: 10 })).toContain("res.cloudinary.com/public-cloud/");
  });

  it("ignores the server-only CLOUDINARY_CLOUD_NAME so client and server agree", async () => {
    // The client bundle can't see a non-public var; honoring it here would make the
    // client guard disagree with next/image remotePatterns. Falls back to the default.
    vi.stubEnv("NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME", undefined);
    vi.stubEnv("CLOUDINARY_CLOUD_NAME", "server-cloud");
    const { CLOUDINARY_CLOUD_NAME } = await importUrl();
    expect(CLOUDINARY_CLOUD_NAME).toBe("dzqy2ixl0");
  });

  it("falls back to the dzqy2ixl0 default when neither var is set", async () => {
    vi.stubEnv("NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME", undefined);
    vi.stubEnv("CLOUDINARY_CLOUD_NAME", undefined);
    const { CLOUDINARY_CLOUD_NAME } = await importUrl();
    expect(CLOUDINARY_CLOUD_NAME).toBe("dzqy2ixl0");
  });
});
