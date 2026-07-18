import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const VALID_BRAND_ID = "11111111-1111-1111-1111-111111111111";

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
  mockWithOperatorAuth.mockResolvedValue({ id: "user-1", name: "QA" });
  mockMaybeSingle.mockResolvedValue({ data: { id: VALID_BRAND_ID }, error: null });
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

  it("signs widget params using the widget timestamp", async () => {
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
    expect(JSON.stringify(data)).not.toContain("test-api-secret");
  });

  it("accepts object context from CldUploadWidget and rebuilds canonical params", async () => {
    const { POST } = await importRoute();
    const res = await POST(
      new Request("http://localhost/api/assets/cloudinary-sign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paramsToSign: {
            timestamp: 1_784_000_000,
            upload_preset: "ipix-signed-upload",
            type: "authenticated",
            context: { brand_id: VALID_BRAND_ID },
            folder: "evil/override/path",
            public_id: "evil-id",
          },
        }),
      }),
    );
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(typeof data.signature).toBe("string");
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
