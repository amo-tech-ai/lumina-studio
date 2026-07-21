import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const VALID_BRAND_ID = "11111111-1111-1111-1111-111111111111";
const VALID_ORG_ID = "22222222-2222-2222-2222-222222222222";

const mockWithOperatorAuth = vi.fn();
const mockMaybeSingle = vi.fn();
const mockCreateOperatorSupabaseClient = vi.fn();

vi.mock("@/lib/operator-gate", () => ({
  withOperatorAuth: (...args: unknown[]) => mockWithOperatorAuth(...args),
  OperatorAuthError: class OperatorAuthError extends Error {
    constructor(m: string) {
      super(m);
      this.name = "OperatorAuthError";
    }
  },
}));

vi.mock("@/lib/supabase/operator-client", () => ({
  createOperatorSupabaseClient: () => mockCreateOperatorSupabaseClient(),
}));

function supabaseClientStub() {
  const eq1 = vi.fn(() => ({ maybeSingle: mockMaybeSingle }));
  const select = vi.fn(() => ({ eq: eq1 }));
  return { from: vi.fn(() => ({ select })) };
}

beforeEach(() => {
  vi.resetModules();
  vi.stubEnv("CLOUDINARY_API_SECRET", "test-api-secret");
  vi.stubEnv("NEXT_PUBLIC_CLOUDINARY_API_KEY", "test-api-key");
  mockWithOperatorAuth.mockResolvedValue({ id: "user-1", name: "QA" });
  mockMaybeSingle.mockResolvedValue({ data: { id: VALID_BRAND_ID, org_id: VALID_ORG_ID }, error: null });
  mockCreateOperatorSupabaseClient.mockResolvedValue(supabaseClientStub());
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.clearAllMocks();
});

async function importRoute() {
  return import("./route");
}

describe("POST /api/assets/cloudinary-sign", () => {
  it("returns 401 when unauthenticated", async () => {
    const { OperatorAuthError } = await import("@/lib/operator-gate");
    mockWithOperatorAuth.mockRejectedValueOnce(new OperatorAuthError("Unauthorized"));
    const { POST } = await importRoute();
    const res = await POST(
      new Request("http://localhost/api/assets/cloudinary-sign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paramsToSign: {} }),
      }),
    );
    expect(res.status).toBe(401);
  });

  it("returns full params for prepareUploadParams", async () => {
    const { POST } = await importRoute();
    const paramsToSign = {
      timestamp: 1_784_000_000,
      upload_preset: "ipix-signed-upload",
      type: "authenticated",
      context: `brand_id=${VALID_BRAND_ID}`,
    };
    const res = await POST(
      new Request("http://localhost/api/assets/cloudinary-sign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paramsToSign }),
      }),
    );
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(typeof data.signature).toBe("string");
    expect(data.signature.length).toBeGreaterThan(0);
    expect(typeof data.apiKey).toBe("string");
    expect(data.apiKey.length).toBeGreaterThan(0);
    expect(data.uploadSignatureTimestamp).toBe(1_784_000_000);
    expect(data.uploadPreset).toBe("ipix-signed-upload");
    expect(data.folder).toBe(`ipix/brands/${VALID_BRAND_ID}/products`);
    expect(data.context).toContain(`brand_id=${VALID_BRAND_ID}`);
    expect(JSON.stringify(data)).not.toContain("test-api-secret");
  });

  it("signs widget params when type is omitted", async () => {
    const { POST } = await importRoute();
    const res = await POST(
      new Request("http://localhost/api/assets/cloudinary-sign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paramsToSign: {
            timestamp: 1_784_000_000,
            upload_preset: "ipix-signed-upload",
            context: { brand_id: VALID_BRAND_ID },
          },
        }),
      }),
    );
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(typeof data.signature).toBe("string");
    expect(data.signature.length).toBeGreaterThan(0);
    expect(typeof data.apiKey).toBe("string");
    expect(data.apiKey.length).toBeGreaterThan(0);
    expect(data.folder).toBe(`ipix/brands/${VALID_BRAND_ID}/products`);
    expect(data.context).toContain(`brand_id=${VALID_BRAND_ID}`);
  });

  it("accepts object context from CldUploadWidget and signs sanitized widget params", async () => {
    const { POST } = await importRoute();
    const res = await POST(
      new Request("http://localhost/api/assets/cloudinary-sign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paramsToSign: {
            timestamp: 1_784_000_000,
            upload_preset: "ipix-signed-upload",
            context: { brand_id: VALID_BRAND_ID },
            folder: `ipix/brands/${VALID_BRAND_ID}/products`,
            resource_type: "image",
            public_id: "evil-id",
          },
        }),
      }),
    );
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(typeof data.signature).toBe("string");

    const { v2: cloudinary } = await import("cloudinary");
    const { sanitizeWidgetParamsToSign } = await import("@/lib/cloudinary/sign-upload");
    const sanitized = sanitizeWidgetParamsToSign(
      {
        timestamp: 1_784_000_000,
        upload_preset: "ipix-signed-upload",
        context: { brand_id: VALID_BRAND_ID },
        folder: `ipix/brands/${VALID_BRAND_ID}/products`,
        resource_type: "image",
        public_id: "evil-id",
      },
      VALID_BRAND_ID,
      { orgId: VALID_ORG_ID },
    );
    expect(data.signature).toBe(
      cloudinary.utils.api_sign_request(sanitized, "test-api-secret"),
    );
  });

  it("returns 403 when brand is not accessible", async () => {
    mockMaybeSingle.mockResolvedValueOnce({ data: null, error: null });
    const { POST } = await importRoute();
    const res = await POST(
      new Request("http://localhost/api/assets/cloudinary-sign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paramsToSign: {
            timestamp: 1,
            upload_preset: "ipix-signed-upload",
            type: "authenticated",
            context: `brand_id=${VALID_BRAND_ID}`,
          },
        }),
      }),
    );
    expect(res.status).toBe(403);
  });
});
