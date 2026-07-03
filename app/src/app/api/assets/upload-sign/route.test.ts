import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const VALID_BRAND_ID = "11111111-1111-1111-1111-111111111111";
const VALID_SHOOT_ID = "22222222-2222-2222-2222-222222222222";
const VALID_CAMPAIGN_ID = "33333333-3333-3333-3333-333333333333";

const VALID_BODY = {
  brandId: VALID_BRAND_ID,
  resourceType: "image",
  filename: "hero-shot.jpg",
};

function makeRequest(body: unknown): Request {
  return new Request("http://localhost/api/assets/upload-sign", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

const mockWithOperatorAuth = vi.fn();
const mockMaybeSingle = vi.fn();
const mockCreateSupabaseServerClient = vi.fn();

vi.mock("@/lib/operator-gate", () => ({
  withOperatorAuth: (...args: unknown[]) => mockWithOperatorAuth(...args),
  OperatorAuthError: class OperatorAuthError extends Error {
    constructor(m: string) {
      super(m);
      this.name = "OperatorAuthError";
    }
  },
}));

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: () => mockCreateSupabaseServerClient(),
}));

function supabaseClientStub() {
  const eq2 = vi.fn(() => ({ maybeSingle: mockMaybeSingle }));
  const eq1 = vi.fn(() => ({ eq: eq2 }));
  const select = vi.fn(() => ({ eq: eq1 }));
  const from = vi.fn(() => ({ select }));
  return { from };
}

beforeEach(() => {
  vi.resetModules();
  vi.stubEnv("CLOUDINARY_CLOUD_NAME", "dzqy2ixl0");
  vi.stubEnv("CLOUDINARY_API_KEY", "test-api-key");
  vi.stubEnv("CLOUDINARY_API_SECRET", "test-api-secret");
  mockWithOperatorAuth.mockResolvedValue({ id: "44444444-4444-4444-4444-444444444444", name: "QA" });
  mockMaybeSingle.mockResolvedValue({ data: { id: VALID_BRAND_ID }, error: null });
  mockCreateSupabaseServerClient.mockResolvedValue(supabaseClientStub());
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.clearAllMocks();
  vi.resetModules();
});

async function importRoute() {
  return import("./route");
}

describe("POST /api/assets/upload-sign", () => {
  it("returns 401 when withOperatorAuth throws OperatorAuthError", async () => {
    const { OperatorAuthError } = await import("@/lib/operator-gate");
    mockWithOperatorAuth.mockRejectedValueOnce(new OperatorAuthError("Unauthorized"));
    const { POST } = await importRoute();
    const res = await POST(makeRequest(VALID_BODY));
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: "Unauthorized" });
  });

  it("returns 500 when Cloudinary env vars are missing", async () => {
    vi.stubEnv("CLOUDINARY_API_SECRET", "");
    const { POST } = await importRoute();
    const res = await POST(makeRequest(VALID_BODY));
    expect(res.status).toBe(500);
  });

  it("returns 400 for invalid JSON body", async () => {
    const { POST } = await importRoute();
    const req = new Request("http://localhost/api/assets/upload-sign", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "not-json",
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("returns 400 for missing/invalid brandId", async () => {
    const { POST } = await importRoute();
    const res = await POST(makeRequest({ ...VALID_BODY, brandId: "not-a-uuid" }));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toMatch(/brandId/i);
  });

  it("returns 400 for invalid resourceType", async () => {
    const { POST } = await importRoute();
    const res = await POST(makeRequest({ ...VALID_BODY, resourceType: "audio" }));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toMatch(/resourceType/i);
  });

  it("returns 400 for missing filename", async () => {
    const { POST } = await importRoute();
    const res = await POST(makeRequest({ ...VALID_BODY, filename: "" }));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toMatch(/filename/i);
  });

  it("returns 403 when brand is not owned by caller", async () => {
    mockMaybeSingle.mockResolvedValueOnce({ data: null, error: null });
    const { POST } = await importRoute();
    const res = await POST(makeRequest(VALID_BODY));
    expect(res.status).toBe(403);
  });

  it("returns 500 when the brand ownership query errors", async () => {
    mockMaybeSingle.mockResolvedValueOnce({ data: null, error: { message: "boom" } });
    const { POST } = await importRoute();
    const res = await POST(makeRequest(VALID_BODY));
    expect(res.status).toBe(500);
  });

  it("skips the ownership check for the dev-unauthenticated fallback identity", async () => {
    mockWithOperatorAuth.mockResolvedValueOnce({ id: "dev-unauthenticated", name: "Dev (auth disabled)" });
    const { POST } = await importRoute();
    const res = await POST(makeRequest(VALID_BODY));
    expect(res.status).toBe(200);
    expect(mockCreateSupabaseServerClient).not.toHaveBeenCalled();
  });

  it("returns a signed payload with type=authenticated and no eager key, secret never leaks", async () => {
    const { POST } = await importRoute();
    const res = await POST(makeRequest(VALID_BODY));
    expect(res.status).toBe(200);
    const data = await res.json();

    expect(data.cloudName).toBe("dzqy2ixl0");
    expect(data.apiKey).toBe("test-api-key");
    expect(typeof data.signature).toBe("string");
    expect(data.signature.length).toBeGreaterThan(0);
    expect(data.uploadUrl).toBe("https://api.cloudinary.com/v1_1/dzqy2ixl0/image/upload");
    expect(data.expiresAt).toBe(data.timestamp + 300);

    expect(data.params.type).toBe("authenticated");
    expect(data.params).not.toHaveProperty("eager");
    expect(data.params.context).toBe(`brand_id=${VALID_BRAND_ID}`);

    const serialized = JSON.stringify(data);
    expect(serialized).not.toContain("test-api-secret");
  });

  it("derives the default brand folder when no shoot/campaign context is given", async () => {
    const { POST } = await importRoute();
    const res = await POST(makeRequest(VALID_BODY));
    const data = await res.json();
    expect(data.assetFolder).toBe(`ipix/brands/${VALID_BRAND_ID}/products`);
    expect(data.params.asset_folder).toBe(data.assetFolder);
  });

  it("derives the shoot folder when context.shootId is a valid UUID", async () => {
    const { POST } = await importRoute();
    const res = await POST(
      makeRequest({ ...VALID_BODY, context: { shootId: VALID_SHOOT_ID } }),
    );
    const data = await res.json();
    expect(data.assetFolder).toBe(`ipix/shoots/${VALID_SHOOT_ID}/raw`);
  });

  it("derives the campaign folder when context.campaignId is a valid UUID", async () => {
    const { POST } = await importRoute();
    const res = await POST(
      makeRequest({ ...VALID_BODY, context: { campaignId: VALID_CAMPAIGN_ID } }),
    );
    const data = await res.json();
    expect(data.assetFolder).toBe(`ipix/campaigns/${VALID_CAMPAIGN_ID}`);
  });

  it("falls back to the default brand folder when context ids are not valid UUIDs", async () => {
    const { POST } = await importRoute();
    const res = await POST(
      makeRequest({ ...VALID_BODY, context: { shootId: "not-a-uuid" } }),
    );
    const data = await res.json();
    expect(data.assetFolder).toBe(`ipix/brands/${VALID_BRAND_ID}/products`);
  });
});
