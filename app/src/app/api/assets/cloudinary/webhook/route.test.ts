import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const BRAND_ID = "11111111-1111-1111-1111-111111111111";
const VALID_TIMESTAMP = () => Math.floor(Date.now() / 1000);

const mockConfig = vi.fn();
const mockVerify = vi.fn();

vi.mock("cloudinary", () => ({
  v2: {
    config: (...args: unknown[]) => mockConfig(...args),
    utils: {
      verifyNotificationSignature: (...args: unknown[]) => mockVerify(...args),
    },
  },
}));

const assetsSelectMaybeSingle = vi.fn();
const assetsInsertSingle = vi.fn();
const assetsUpdateEq = vi.fn();
const cloudinaryAssetsUpsert = vi.fn();
const cloudinaryAssetsUpdateEq = vi.fn();
const aiAgentLogsInsert = vi.fn();

const mockFrom = vi.fn((table: string) => {
  if (table === "assets") {
    return {
      select: vi.fn(() => ({ eq: vi.fn(() => ({ maybeSingle: assetsSelectMaybeSingle })) })),
      insert: vi.fn(() => ({ select: vi.fn(() => ({ single: assetsInsertSingle })) })),
      update: vi.fn(() => ({ eq: assetsUpdateEq })),
    };
  }
  if (table === "cloudinary_assets") {
    return {
      upsert: cloudinaryAssetsUpsert,
      update: vi.fn(() => ({ eq: cloudinaryAssetsUpdateEq })),
    };
  }
  if (table === "ai_agent_logs") {
    return { insert: aiAgentLogsInsert };
  }
  throw new Error(`unexpected table: ${table}`);
});

const mockCreateSupabaseAdminClient = vi.fn(() => ({ from: mockFrom }));

vi.mock("@/app/api/_lib/supabase-admin", () => ({
  createSupabaseAdminClient: () => mockCreateSupabaseAdminClient(),
}));

function makeRequest(body: unknown, headers?: Record<string, string | null>): Request {
  const h = new Headers({
    "content-type": "application/json",
    "x-cld-timestamp": String(VALID_TIMESTAMP()),
    "x-cld-signature": "sig",
  });
  if (headers) {
    for (const [k, v] of Object.entries(headers)) {
      if (v === null) h.delete(k);
      else h.set(k, v);
    }
  }
  return new Request("http://localhost/api/assets/cloudinary/webhook", {
    method: "POST",
    headers: h,
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.resetModules();
  vi.stubEnv("CLOUDINARY_CLOUD_NAME", "dzqy2ixl0");
  vi.stubEnv("CLOUDINARY_API_KEY", "test-api-key");
  vi.stubEnv("CLOUDINARY_API_SECRET", "test-api-secret");
  mockVerify.mockReturnValue(true);
  assetsSelectMaybeSingle.mockResolvedValue({ data: null, error: null });
  assetsInsertSingle.mockResolvedValue({ data: { id: "asset-1" }, error: null });
  assetsUpdateEq.mockResolvedValue({ data: null, error: null });
  cloudinaryAssetsUpsert.mockResolvedValue({ data: null, error: null });
  cloudinaryAssetsUpdateEq.mockResolvedValue({ data: null, error: null });
  aiAgentLogsInsert.mockResolvedValue({ data: null, error: null });
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.clearAllMocks();
  vi.resetModules();
});

async function importRoute() {
  return import("./route");
}

const UPLOAD_PAYLOAD = {
  notification_type: "upload",
  public_id: `ipix/brands/${BRAND_ID}/products/abc123`,
  secure_url: "https://res.cloudinary.com/dzqy2ixl0/image/upload/v1/abc123.jpg",
  resource_type: "image",
  format: "jpg",
  bytes: 1024,
  width: 800,
  height: 600,
  version: 1,
};

describe("POST /api/assets/cloudinary/webhook", () => {
  it("returns 500 when Cloudinary env vars are missing", async () => {
    vi.stubEnv("CLOUDINARY_API_SECRET", "");
    const { POST } = await importRoute();
    const res = await POST(makeRequest(UPLOAD_PAYLOAD));
    expect(res.status).toBe(500);
  });

  it("returns 401 when signature headers are missing", async () => {
    const { POST } = await importRoute();
    const res = await POST(makeRequest(UPLOAD_PAYLOAD, { "x-cld-signature": null }));
    expect(res.status).toBe(401);
    expect(mockVerify).not.toHaveBeenCalled();
  });

  it("returns 401 when the timestamp is outside the replay window", async () => {
    const { POST } = await importRoute();
    const staleTimestamp = String(VALID_TIMESTAMP() - 301);
    const res = await POST(makeRequest(UPLOAD_PAYLOAD, { "x-cld-timestamp": staleTimestamp }));
    expect(res.status).toBe(401);
    expect(mockVerify).not.toHaveBeenCalled();
  });

  it("returns 401 and writes nothing when the signature is invalid", async () => {
    mockVerify.mockReturnValue(false);
    const { POST } = await importRoute();
    const res = await POST(makeRequest(UPLOAD_PAYLOAD));
    expect(res.status).toBe(401);
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it("configures the SDK with explicit credentials before verifying", async () => {
    const { POST } = await importRoute();
    await POST(makeRequest(UPLOAD_PAYLOAD));
    expect(mockConfig).toHaveBeenCalledWith({
      cloud_name: "dzqy2ixl0",
      api_key: "test-api-key",
      api_secret: "test-api-secret",
    });
  });

  it("returns 400 for invalid JSON body", async () => {
    const { POST } = await importRoute();
    const res = await POST(makeRequest("not-json"));
    expect(res.status).toBe(400);
  });

  it("acks unknown notification types with 200 and no writes", async () => {
    const { POST } = await importRoute();
    const res = await POST(makeRequest({ ...UPLOAD_PAYLOAD, notification_type: "moderation" }));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true, ignored: "moderation" });
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it("creates a new assets row and upserts cloudinary_assets for a fresh upload, resolving brand_id from the folder", async () => {
    const { POST } = await importRoute();
    const res = await POST(makeRequest(UPLOAD_PAYLOAD));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });

    expect(assetsInsertSingle).toHaveBeenCalled();
    expect(cloudinaryAssetsUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        asset_id: "asset-1",
        public_id: UPLOAD_PAYLOAD.public_id,
        brand_id: BRAND_ID,
        status: "ready",
      }),
      { onConflict: "public_id" },
    );
    expect(aiAgentLogsInsert).toHaveBeenCalledWith(
      expect.objectContaining({ agent_name: "cloudinary-webhook", brand_id: BRAND_ID }),
    );
  });

  it("updates the existing assets row instead of inserting when cloudinary_public_id is already linked", async () => {
    assetsSelectMaybeSingle.mockResolvedValue({ data: { id: "asset-existing" }, error: null });
    const { POST } = await importRoute();
    const res = await POST(makeRequest(UPLOAD_PAYLOAD));
    expect(res.status).toBe(200);
    expect(assetsInsertSingle).not.toHaveBeenCalled();
    expect(assetsUpdateEq).toHaveBeenCalledWith("id", "asset-existing");
    expect(cloudinaryAssetsUpsert).toHaveBeenCalledWith(
      expect.objectContaining({ asset_id: "asset-existing" }),
      { onConflict: "public_id" },
    );
  });

  it("leaves brand_id null when the public_id folder doesn't match a known brand pattern", async () => {
    const { POST } = await importRoute();
    const res = await POST(
      makeRequest({ ...UPLOAD_PAYLOAD, public_id: "ipix/shoots/22222222-2222-2222-2222-222222222222/raw/abc" }),
    );
    expect(res.status).toBe(200);
    expect(cloudinaryAssetsUpsert).toHaveBeenCalledWith(
      expect.objectContaining({ brand_id: null }),
      { onConflict: "public_id" },
    );
  });

  it("marks the cloudinary_assets row archived on a delete notification", async () => {
    const { POST } = await importRoute();
    const res = await POST(
      makeRequest({ notification_type: "delete", public_id: UPLOAD_PAYLOAD.public_id }),
    );
    expect(res.status).toBe(200);
    expect(cloudinaryAssetsUpdateEq).toHaveBeenCalledWith("public_id", UPLOAD_PAYLOAD.public_id);
  });

  it("still acks 2xx when the upsert fails (never blocks the webhook ack)", async () => {
    cloudinaryAssetsUpsert.mockResolvedValue({ data: null, error: { message: "boom" } });
    const { POST } = await importRoute();
    const res = await POST(makeRequest(UPLOAD_PAYLOAD));
    expect(res.status).toBe(200);
  });
});
