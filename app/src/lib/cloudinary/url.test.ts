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

  it("returns empty string for forbidden chars, invalid dimensions, or newline-contaminated IDs", async () => {
    const { cloudinaryImageUrl } = await importUrl();
    expect(cloudinaryImageUrl("", { w: 100, h: 100 })).toBe("");
    expect(cloudinaryImageUrl("   ", { w: 100, h: 100 })).toBe("");
    expect(cloudinaryImageUrl("invalid id", { w: 100, h: 100 })).toBe("");
    expect(cloudinaryImageUrl("valid-id", { w: 0, h: 100 })).toBe("");
    expect(cloudinaryImageUrl("valid-id", { w: 100, h: -1 })).toBe("");
    expect(cloudinaryImageUrl("valid-id", { w: Number.NaN, h: 100 })).toBe("");
    expect(cloudinaryImageUrl("valid-id", { w: 100, h: Number.POSITIVE_INFINITY })).toBe("");
    expect(cloudinaryImageUrl("valid\ninvalid id!", { w: 100, h: 100 })).toBe("");
  });

  it("accepts public IDs containing dots, @, ~, and non-ASCII Unicode (valid Cloudinary chars)", async () => {
    const { cloudinaryImageUrl } = await importUrl();
    expect(cloudinaryImageUrl("folder/image.jpg", { w: 100, h: 100 })).toContain("folder/image.jpg");
    expect(cloudinaryImageUrl("user@domain.jpg", { w: 100, h: 100 })).toContain("user@domain.jpg");
    expect(cloudinaryImageUrl("path~with~tilde.jpg", { w: 100, h: 100 })).toContain("path~with~tilde.jpg");
    expect(cloudinaryImageUrl("café/look", { w: 100, h: 100 })).toContain("caf%C3%A9/look");
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

  it("builds the asset-review and asset-detail eager presets", async () => {
    const { presetTransformString, CLOUDINARY_EAGER_PRESETS, CLOUDINARY_UPLOAD_PRESET } =
      await importUrl();
    expect(presetTransformString("asset-review")).toBe("c_limit,w_1200,f_auto,q_auto");
    expect(presetTransformString("asset-detail")).toBe("c_limit,w_1600,f_auto,q_auto");
    expect([...CLOUDINARY_EAGER_PRESETS]).toEqual([
      "asset-masonry",
      "asset-review",
      "asset-detail",
    ]);
    expect(CLOUDINARY_UPLOAD_PRESET).toBe("ipix-signed-upload");
  });

  it("builds an arbitrary fill crop from raw dimensions (channel-spec use case)", async () => {
    const { cropTransformString } = await importUrl();
    expect(cropTransformString({ width: 1080, height: 1350, crop: "fill" })).toBe(
      "c_fill,w_1080,h_1350,g_auto,f_auto,q_auto",
    );
  });
});

describe("ASSET_DELIVERY_PRESETS / namedTransformDeliveryString", () => {
  it("maps each delivery surface to its Cloudinary named transformation", async () => {
    const { ASSET_DELIVERY_PRESETS } = await importUrl();
    expect(ASSET_DELIVERY_PRESETS).toEqual({
      masonry: "asset-masonry",
      review: "asset-review",
      detail: "asset-detail",
    });
  });

  it("builds the canonical named-transform delivery chain with f_auto/q_auto outside", async () => {
    const { namedTransformDeliveryString } = await importUrl();
    expect(namedTransformDeliveryString("asset-masonry")).toBe("t_asset-masonry/f_auto/q_auto");
    expect(namedTransformDeliveryString("asset-review")).toBe("t_asset-review/f_auto/q_auto");
    expect(namedTransformDeliveryString("asset-detail")).toBe("t_asset-detail/f_auto/q_auto");
  });

  it("deliveryTransformString uses the named chain for delivery presets and inline for the rest", async () => {
    const { deliveryTransformString, isNamedTransformPreset } = await importUrl();
    expect(deliveryTransformString("asset-masonry")).toBe("t_asset-masonry/f_auto/q_auto");
    expect(deliveryTransformString("asset-review")).toBe("t_asset-review/f_auto/q_auto");
    expect(deliveryTransformString("asset-detail")).toBe("t_asset-detail/f_auto/q_auto");
    expect(deliveryTransformString("asset-tile")).toBe("c_thumb,w_120,h_120,g_auto,f_auto,q_auto");
    expect(deliveryTransformString("brand-cover")).toBe("c_fill,w_400,h_300,g_auto,f_auto,q_auto");
    expect(isNamedTransformPreset("asset-masonry")).toBe(true);
    expect(isNamedTransformPreset("asset-tile")).toBe(false);
  });
});

describe("withCloudinaryPreset", () => {
  it("inserts the named-transform delivery chain right after /image/upload/", async () => {
    const { withCloudinaryPreset } = await importUrl();
    const url = withCloudinaryPreset(
      "https://res.cloudinary.com/dzqy2ixl0/image/upload/v1700000000/brand/asset_01.jpg",
      "asset-masonry",
    );
    expect(url).toBe(
      "https://res.cloudinary.com/dzqy2ixl0/image/upload/t_asset-masonry/f_auto/q_auto/v1700000000/brand/asset_01.jpg",
    );
  });

  it("keeps the version segment after the transform (cache-busting preserved)", async () => {
    const { withCloudinaryPreset } = await importUrl();
    const url = withCloudinaryPreset(
      "https://res.cloudinary.com/dzqy2ixl0/image/upload/v1786337355/brand/asset_01.jpg",
      "asset-detail",
    );
    expect(url).toBe(
      "https://res.cloudinary.com/dzqy2ixl0/image/upload/t_asset-detail/f_auto/q_auto/v1786337355/brand/asset_01.jpg",
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

describe("isAuthenticatedDeliveryUrl", () => {
  it("accepts signed authenticated delivery under the configured cloud", async () => {
    const { isAuthenticatedDeliveryUrl } = await importUrl();
    expect(
      isAuthenticatedDeliveryUrl(
        "https://res.cloudinary.com/dzqy2ixl0/image/authenticated/s--abc--/c_limit,w_600/x",
      ),
    ).toBe(true);
  });

  it("rejects public upload URLs and foreign hosts", async () => {
    const { isAuthenticatedDeliveryUrl } = await importUrl();
    expect(
      isAuthenticatedDeliveryUrl("https://res.cloudinary.com/dzqy2ixl0/image/upload/v1/x"),
    ).toBe(false);
    expect(isAuthenticatedDeliveryUrl(null)).toBe(false);
  });
});

describe("CLOUDINARY_CLOUD_NAME", () => {
  it("resolveCloudinaryCloudName prefers public then server-only env", async () => {
    vi.stubEnv("NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME", undefined);
    vi.stubEnv("CLOUDINARY_CLOUD_NAME", "server-cloud");
    const { resolveCloudinaryCloudName } = await importUrl();
    expect(resolveCloudinaryCloudName()).toBe("server-cloud");
  });

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
