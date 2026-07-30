import { afterEach, describe, expect, it, vi } from "vitest";
import { v2 as cloudinary } from "cloudinary";

const VALID_BRAND_ID = "11111111-1111-1111-1111-111111111111";
const VALID_ORG_ID = "22222222-2222-2222-2222-222222222222";
const SECRET = "test-api-secret";
const TEST_ENV = "dev";

afterEach(() => {
  vi.unstubAllEnvs();
});

async function importSignUpload() {
  vi.stubEnv("CLOUDINARY_API_SECRET", SECRET);
  vi.stubEnv("VERCEL_ENV", TEST_ENV);
  return import("./sign-upload");
}

function taxFolder(orgId: string, brandId: string) {
  return `ipix/${TEST_ENV}/${orgId}/${brandId}/products`;
}

function taxContext(orgId: string, brandId: string) {
  return `env=${TEST_ENV}|org_id=${orgId}|brand_id=${brandId}|work_type=products`;
}

describe("sanitizeWidgetParamsToSign", () => {
  it("uses server-resolved orgId and taxonomy folder/context", async () => {
    const { sanitizeWidgetParamsToSign } = await importSignUpload();
    const sanitized = sanitizeWidgetParamsToSign(
      {
        timestamp: 1_784_000_000,
        upload_preset: "ipix-signed-upload",
        context: { brand_id: VALID_BRAND_ID, org_id: "forged-org-id" },
      },
      VALID_BRAND_ID,
      { orgId: VALID_ORG_ID },
    );
    expect(sanitized.folder).toBe(taxFolder(VALID_ORG_ID, VALID_BRAND_ID));
    expect(sanitized.context).toBe(taxContext(VALID_ORG_ID, VALID_BRAND_ID));
    expect(sanitized.context).not.toContain("forged-org-id");
  });

  it("throws when orgId is not a UUID (no null/unknown path segments)", async () => {
    const { sanitizeWidgetParamsToSign } = await importSignUpload();
    expect(() =>
      sanitizeWidgetParamsToSign(
        {
          timestamp: 1_784_000_000,
          upload_preset: "ipix-signed-upload",
          context: { brand_id: VALID_BRAND_ID },
        },
        VALID_BRAND_ID,
        { orgId: "unknown" },
      ),
    ).toThrow(/orgId must be a UUID/);
  });

  it("matches Cloudinary api_sign_request for realistic widget paramsToSign", async () => {
    const { sanitizeWidgetParamsToSign, signCloudinaryParams } = await importSignUpload();

    const widgetParams = {
      timestamp: 1_784_000_000,
      upload_preset: "ipix-signed-upload",
      folder: taxFolder(VALID_ORG_ID, VALID_BRAND_ID),
      context: `brand_id=${VALID_BRAND_ID}`,
      resource_type: "image",
      source: "uw",
    };

    const sanitized = sanitizeWidgetParamsToSign(widgetParams, VALID_BRAND_ID, {
      orgId: VALID_ORG_ID,
    });
    const routeSig = signCloudinaryParams(sanitized, SECRET);
    const cloudinarySig = cloudinary.utils.api_sign_request(sanitized, SECRET);

    expect(routeSig).toBe(cloudinarySig);
    expect(sanitized).not.toHaveProperty("resource_type");
    expect(sanitized.folder).toBe(taxFolder(VALID_ORG_ID, VALID_BRAND_ID));
    expect(sanitized.context).toBe(taxContext(VALID_ORG_ID, VALID_BRAND_ID));
  });

  it("excludes resource_type from signed params (type-specific upload URL)", async () => {
    const { sanitizeWidgetParamsToSign } = await importSignUpload();
    const sanitized = sanitizeWidgetParamsToSign(
      {
        timestamp: 1_784_000_000,
        upload_preset: "ipix-signed-upload",
        context: { brand_id: VALID_BRAND_ID },
        folder: taxFolder(VALID_ORG_ID, VALID_BRAND_ID),
        resource_type: "image",
        source: "uw",
      },
      VALID_BRAND_ID,
      { orgId: VALID_ORG_ID },
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
    const { sanitizeWidgetParamsToSign, signCloudinaryParams } = await importSignUpload();

    const widgetParams = {
      timestamp: 1_784_000_000,
      upload_preset: "ipix-signed-upload",
      context: { brand_id: VALID_BRAND_ID },
      folder: "evil/override/path",
      public_id: "evil-id",
      overwrite: "true",
      resource_type: "image",
    };

    const sanitized = sanitizeWidgetParamsToSign(widgetParams, VALID_BRAND_ID, {
      orgId: VALID_ORG_ID,
    });
    expect(sanitized).not.toHaveProperty("public_id");
    expect(sanitized).not.toHaveProperty("overwrite");
    expect(sanitized.folder).toBe(taxFolder(VALID_ORG_ID, VALID_BRAND_ID));
    expect(sanitized.context).toBe(taxContext(VALID_ORG_ID, VALID_BRAND_ID));

    const widgetSig = signCloudinaryParams(sanitized, SECRET);
    expect(cloudinary.utils.api_sign_request(sanitized, SECRET)).toBe(widgetSig);
  });
});

describe("buildUploadParamsToSign", () => {
  it("builds params with taxonomy-driven folder and context", async () => {
    const { buildUploadParamsToSign } = await importSignUpload();

    const params = buildUploadParamsToSign({
      brandId: VALID_BRAND_ID,
      resourceType: "image",
      timestamp: 1_784_000_000,
      orgId: VALID_ORG_ID,
    });

    expect(params.asset_folder).toBe(taxFolder(VALID_ORG_ID, VALID_BRAND_ID));
    expect(params.context).toBe(taxContext(VALID_ORG_ID, VALID_BRAND_ID));
    expect(params.type).toBe("authenticated");
    expect(params.allowed_formats).toBe("jpg,png,webp,mp4,mov");
    expect(params.unique_filename).toBe("true");
    expect(params.use_filename).toBe("true");
    expect(params.upload_preset).toBe("ipix-signed-upload");
  });

  it("includes workType and workId in folder and context when provided", async () => {
    const { buildUploadParamsToSign } = await importSignUpload();

    const params = buildUploadParamsToSign({
      brandId: VALID_BRAND_ID,
      resourceType: "image",
      timestamp: 1_784_000_000,
      orgId: VALID_ORG_ID,
      workType: "shoots",
      workId: "33333333-3333-3333-3333-333333333333",
    });

    expect(params.asset_folder).toBe(
      `ipix/${TEST_ENV}/${VALID_ORG_ID}/${VALID_BRAND_ID}/shoots/33333333-3333-3333-3333-333333333333`,
    );
    expect(params.context).toContain("work_type=shoots");
    expect(params.context).toContain("work_id=33333333-3333-3333-3333-333333333333");
  });

  it("respects explicit folder override", async () => {
    const { buildUploadParamsToSign } = await importSignUpload();

    const params = buildUploadParamsToSign({
      brandId: VALID_BRAND_ID,
      resourceType: "image",
      timestamp: 1_784_000_000,
      orgId: VALID_ORG_ID,
      folder: "custom/override/path",
    });

    expect(params.asset_folder).toBe("custom/override/path");
    expect(params.public_id_prefix).toBe("custom/override/path");
    expect(params).not.toHaveProperty("folder");
    expect(params.context).toBe(taxContext(VALID_ORG_ID, VALID_BRAND_ID));
  });

  it("includes eager transforms for image uploads", async () => {
    const { buildUploadParamsToSign } = await importSignUpload();

    const params = buildUploadParamsToSign({
      brandId: VALID_BRAND_ID,
      resourceType: "image",
      timestamp: 1_784_000_000,
      orgId: VALID_ORG_ID,
    });

    expect(params.eager).toContain("c_limit,w_600");
    expect(params.eager).toContain("c_limit,w_1200");
    expect(params.eager).toContain("c_limit,w_1600");
  });
});

describe("validateNotificationUrl", () => {
  it("rejects non-https URLs", async () => {
    const { validateNotificationUrl } = await importSignUpload();
    expect(validateNotificationUrl("http://approved.example.com/hook")).toMatch(/https/);
  });

  it("rejects malformed URLs", async () => {
    const { validateNotificationUrl } = await importSignUpload();
    expect(validateNotificationUrl("not-a-url")).toMatch(/valid URL/);
  });

  it("rejects embedded credentials", async () => {
    const { validateNotificationUrl } = await importSignUpload();
    expect(
      validateNotificationUrl("https://user:pass@approved.example.com/hook"),
    ).toMatch(/credentials/);
  });

  it("rejects localhost", async () => {
    const { validateNotificationUrl } = await importSignUpload();
    expect(validateNotificationUrl("https://localhost/hook")).toMatch(/not allowed/);
  });

  it("rejects loopback and private IPv4 ranges", async () => {
    const { validateNotificationUrl } = await importSignUpload();
    expect(validateNotificationUrl("https://127.0.0.1/hook")).toMatch(/not allowed/);
    expect(validateNotificationUrl("https://10.0.0.5/hook")).toMatch(/not allowed/);
    expect(validateNotificationUrl("https://172.16.0.5/hook")).toMatch(/not allowed/);
    expect(validateNotificationUrl("https://192.168.1.1/hook")).toMatch(/not allowed/);
  });

  it("rejects bracketed IPv6 loopback, link-local, and unique-local hosts", async () => {
    const { validateNotificationUrl } = await importSignUpload();
    expect(validateNotificationUrl("https://[::1]/hook")).toMatch(/not allowed/);
    expect(validateNotificationUrl("https://[fe80::1]/hook")).toMatch(/not allowed/);
    expect(validateNotificationUrl("https://[fc00::1]/hook")).toMatch(/not allowed/);
    expect(validateNotificationUrl("https://[fd12:3456:789a::1]/hook")).toMatch(/not allowed/);
  });

  it("rejects the cloud metadata link-local address", async () => {
    const { validateNotificationUrl } = await importSignUpload();
    expect(validateNotificationUrl("https://169.254.169.254/latest/meta-data")).toMatch(/not allowed/);
  });

  it("rejects a host not on the allowlist even when allowlist is configured", async () => {
    vi.stubEnv("CLOUDINARY_NOTIFICATION_ALLOWED_HOSTS", "approved.example.com");
    const { validateNotificationUrl } = await importSignUpload();
    expect(validateNotificationUrl("https://evil.example.com/hook")).toMatch(/allowlist/);
  });

  it("rejects every host when the allowlist is unset (fail closed)", async () => {
    const { validateNotificationUrl } = await importSignUpload();
    expect(validateNotificationUrl("https://approved.example.com/hook")).toMatch(/allowlist/);
  });

  it("accepts an https host that is on the configured allowlist", async () => {
    vi.stubEnv("CLOUDINARY_NOTIFICATION_ALLOWED_HOSTS", "approved.example.com,other.example.com");
    const { validateNotificationUrl } = await importSignUpload();
    expect(validateNotificationUrl("https://approved.example.com/hook")).toBeNull();
  });
});
