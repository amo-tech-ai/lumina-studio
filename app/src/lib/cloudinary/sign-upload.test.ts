import { afterEach, describe, expect, it, vi } from "vitest";
import { v2 as cloudinary } from "cloudinary";

const VALID_BRAND_ID = "11111111-1111-1111-1111-111111111111";
const SECRET = "test-api-secret";

afterEach(() => {
  vi.unstubAllEnvs();
});

async function importSignUpload() {
  vi.stubEnv("CLOUDINARY_API_SECRET", SECRET);
  return import("./sign-upload");
}

describe("sanitizeWidgetParamsToSign", () => {
  it("matches Cloudinary api_sign_request for realistic widget paramsToSign", async () => {
    const { sanitizeWidgetParamsToSign, signCloudinaryParams } = await importSignUpload();

    const widgetParams = {
      timestamp: 1_784_000_000,
      upload_preset: "ipix-signed-upload",
      folder: `ipix/brands/${VALID_BRAND_ID}/products`,
      context: `brand_id=${VALID_BRAND_ID}`,
      resource_type: "image",
      source: "uw",
    };

    const sanitized = sanitizeWidgetParamsToSign(widgetParams, VALID_BRAND_ID);
    const routeSig = signCloudinaryParams(sanitized, SECRET);
    const cloudinarySig = cloudinary.utils.api_sign_request(sanitized, SECRET);

    expect(routeSig).toBe(cloudinarySig);
    expect(sanitized).not.toHaveProperty("resource_type");
    expect(sanitized.folder).toBe(`ipix/brands/${VALID_BRAND_ID}/products`);
    expect(sanitized.context).toBe(`brand_id=${VALID_BRAND_ID}`);
  });

  it("excludes resource_type from signed params (type-specific upload URL)", async () => {
    const { sanitizeWidgetParamsToSign } = await importSignUpload();
    const sanitized = sanitizeWidgetParamsToSign(
      {
        timestamp: 1_784_000_000,
        upload_preset: "ipix-signed-upload",
        context: { brand_id: VALID_BRAND_ID },
        folder: `ipix/brands/${VALID_BRAND_ID}/products`,
        resource_type: "image",
        source: "uw",
      },
      VALID_BRAND_ID,
    );
    expect(sanitized).not.toHaveProperty("resource_type");
    expect(Object.keys(sanitized).sort()).toEqual([
      "context",
      "folder",
      "source",
      "timestamp",
      "upload_preset",
    ]);
  });

  it("strips evil overrides and signs the sanitized params the widget will use", async () => {
    const { sanitizeWidgetParamsToSign, signCloudinaryParams, buildUploadParamsToSign } =
      await importSignUpload();

    const widgetParams = {
      timestamp: 1_784_000_000,
      upload_preset: "ipix-signed-upload",
      context: { brand_id: VALID_BRAND_ID },
      folder: "evil/override/path",
      public_id: "evil-id",
      overwrite: "true",
      resource_type: "image",
    };

    const sanitized = sanitizeWidgetParamsToSign(widgetParams, VALID_BRAND_ID);
    expect(sanitized).not.toHaveProperty("public_id");
    expect(sanitized).not.toHaveProperty("overwrite");
    expect(sanitized.folder).toBe(`ipix/brands/${VALID_BRAND_ID}/products`);
    expect(sanitized.context).toBe(`brand_id=${VALID_BRAND_ID}`);

    const widgetSig = signCloudinaryParams(sanitized, SECRET);
    const canonicalSig = signCloudinaryParams(
      buildUploadParamsToSign({
        brandId: VALID_BRAND_ID,
        resourceType: "image",
        timestamp: 1_784_000_000,
        folder: `ipix/brands/${VALID_BRAND_ID}/products`,
      }),
      SECRET,
    );

    // Proves server-rebuilt canonical params ≠ widget upload params (prior bug).
    expect(widgetSig).not.toBe(canonicalSig);
    expect(cloudinary.utils.api_sign_request(sanitized, SECRET)).toBe(widgetSig);
  });
});
