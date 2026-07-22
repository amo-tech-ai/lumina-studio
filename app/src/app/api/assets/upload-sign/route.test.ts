import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const VALID_BRAND_ID = "11111111-1111-1111-1111-111111111111";
const VALID_ORG_ID = "22222222-2222-2222-2222-222222222222";
const VALID_SHOOT_WORK_ID = "33333333-3333-3333-3333-333333333333";
const VALID_CAMPAIGN_WORK_ID = "44444444-4444-4444-4444-444444444444";

const mockWithOperatorAuth = vi.fn();
const mockMaybeSingle = vi.fn();
const mockCreateOperatorSupabaseClient = vi.fn();
const mockIsBrandAccessible = vi.fn();

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

vi.mock("@/lib/assets/brand-access", () => ({
  isBrandAccessible: (...args: unknown[]) => mockIsBrandAccessible(...args),
}));

function supabaseClientStub() {
  const builder: { eq: ReturnType<typeof vi.fn>; maybeSingle: ReturnType<typeof vi.fn> } = {
    eq: vi.fn(() => builder),
    maybeSingle: mockMaybeSingle,
  };
  const select = vi.fn(() => builder);
  return { from: vi.fn(() => ({ select })) };
}

function uploadBody(overrides: Record<string, unknown> = {}) {
  return {
    brandId: VALID_BRAND_ID,
    resourceType: "image",
    filename: "photo.jpg",
    ...overrides,
  };
}

beforeEach(() => {
  vi.resetModules();
  vi.stubEnv("CLOUDINARY_CLOUD_NAME", "test-cloud");
  vi.stubEnv("CLOUDINARY_API_KEY", "test-key");
  vi.stubEnv("CLOUDINARY_API_SECRET", "test-secret");
  vi.stubEnv("VERCEL_ENV", "dev");
  mockWithOperatorAuth.mockResolvedValue({ id: "user-1", name: "QA" });
  mockCreateOperatorSupabaseClient.mockResolvedValue(supabaseClientStub());
  mockIsBrandAccessible.mockResolvedValue({ ok: true, orgId: VALID_ORG_ID });
  mockMaybeSingle.mockResolvedValue({ data: { id: VALID_CAMPAIGN_WORK_ID }, error: null });
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.clearAllMocks();
});

async function importRoute() {
  return import("./route");
}

function post(body: Record<string, unknown>) {
  return (importRoute() as unknown as Promise<{ POST: (r: Request) => Promise<Response> }>).then(
    ({ POST }) =>
      POST(
        new Request("http://localhost/api/assets/upload-sign", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }),
      ),
  );
}

describe("POST /api/assets/upload-sign — validation", () => {
  it("returns 401 when unauthenticated", async () => {
    const { OperatorAuthError } = await import("@/lib/operator-gate");
    mockWithOperatorAuth.mockRejectedValueOnce(new OperatorAuthError("Unauthorized"));
    const { POST } = await importRoute();
    const res = await POST(
      new Request("http://localhost/api/assets/upload-sign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(uploadBody()),
      }),
    );
    expect(res.status).toBe(401);
  });

  it("returns 400 for invalid brandId", async () => {
    const res = await post(uploadBody({ brandId: "not-a-uuid" }));
    expect(res.status).toBe(400);
  });

  it("returns 400 for missing filename", async () => {
    const res = await post(uploadBody({ filename: "" }));
    expect(res.status).toBe(400);
  });

  it("returns 400 for invalid resourceType", async () => {
    const res = await post(uploadBody({ resourceType: "audio" }));
    expect(res.status).toBe(400);
  });
});

describe("POST /api/assets/upload-sign — workType validation", () => {
  it("accepts every supported workType", async () => {
    const { WORK_TYPES } = await import("@/lib/cloudinary/taxonomy");
    for (const workType of WORK_TYPES) {
      const body = uploadBody({ workType });
      if (workType === "shoots" || workType === "campaigns") {
        (body as Record<string, unknown>).workId =
          workType === "shoots" ? VALID_SHOOT_WORK_ID : VALID_CAMPAIGN_WORK_ID;
      }
      const res = await post(body);
      expect(res.status).toBe(200);
    }
  });

  it("rejects unknown workType", async () => {
    const res = await post(uploadBody({ workType: "unknown" }));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain("workType");
  });

  it("rejects '../../etc' path-like workType", async () => {
    const res = await post(uploadBody({ workType: "../../etc" }));
    expect(res.status).toBe(400);
  });

  it("rejects empty workType", async () => {
    const res = await post(uploadBody({ workType: "" }));
    expect(res.status).toBe(400);
  });

  it("rejects non-string workType", async () => {
    const res = await post(uploadBody({ workType: 42 }));
    expect(res.status).toBe(400);
  });
});

describe("POST /api/assets/upload-sign — workId validation", () => {
  it("accepts valid UUID workId for shoots", async () => {
    const res = await post(
      uploadBody({ workType: "shoots", workId: VALID_SHOOT_WORK_ID }),
    );
    expect(res.status).toBe(200);
  });

  it("accepts valid UUID workId for campaigns", async () => {
    const res = await post(
      uploadBody({ workType: "campaigns", workId: VALID_CAMPAIGN_WORK_ID }),
    );
    expect(res.status).toBe(200);
  });

  it("rejects workId containing '|'", async () => {
    const res = await post(
      uploadBody({ workType: "shoots", workId: "evil|injected" }),
    );
    expect(res.status).toBe(400);
  });

  it("rejects workId containing '='", async () => {
    const res = await post(
      uploadBody({ workType: "shoots", workId: "evil=injected" }),
    );
    expect(res.status).toBe(400);
  });

  it("rejects non-UUID workId", async () => {
    const res = await post(uploadBody({ workType: "shoots", workId: "not-a-uuid" }));
    expect(res.status).toBe(400);
  });
});

describe("POST /api/assets/upload-sign — pair consistency", () => {
  it("requires workId for shoots", async () => {
    const res = await post(uploadBody({ workType: "shoots" }));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain("workId is required");
  });

  it("requires workId for campaigns", async () => {
    const res = await post(uploadBody({ workType: "campaigns" }));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain("workId is required");
  });

  it("rejects workId for products workType", async () => {
    const res = await post(
      uploadBody({ workType: "products", workId: VALID_SHOOT_WORK_ID }),
    );
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain("workId is not allowed");
  });

  it("rejects workId when workType is omitted", async () => {
    const res = await post(uploadBody({ workId: VALID_SHOOT_WORK_ID }));
    expect(res.status).toBe(400);
  });
});

describe("POST /api/assets/upload-sign — ownership", () => {
  it("rejects campaign owned by another brand", async () => {
    mockMaybeSingle.mockResolvedValueOnce({ data: null, error: null });
    const res = await post(
      uploadBody({ workType: "campaigns", workId: VALID_CAMPAIGN_WORK_ID }),
    );
    expect(res.status).toBe(403);
  });

  it("rejects context campaignId owned by another brand", async () => {
    mockMaybeSingle
      .mockResolvedValueOnce({ data: { id: VALID_CAMPAIGN_WORK_ID } }) // campaign workId query (if any)
      .mockResolvedValueOnce({ data: null, error: null }); // context campaignId query
    const res = await post(
      uploadBody({
        workType: "campaigns",
        workId: VALID_CAMPAIGN_WORK_ID,
        context: { campaignId: "55555555-5555-5555-5555-555555555555" },
      }),
    );
    expect(res.status).toBe(403);
  });

  it("accepts shoot belonging to the requested brand", async () => {
    mockMaybeSingle.mockResolvedValueOnce({ data: { id: VALID_SHOOT_WORK_ID }, error: null });
    const res = await post(uploadBody({ workType: "shoots", workId: VALID_SHOOT_WORK_ID }));
    expect(res.status).toBe(200);
  });

  it("rejects shoot owned by another brand", async () => {
    mockMaybeSingle.mockResolvedValueOnce({ data: null, error: null });
    const res = await post(uploadBody({ workType: "shoots", workId: VALID_SHOOT_WORK_ID }));
    expect(res.status).toBe(403);
    const data = await res.json();
    expect(data.error).toContain("Shoot does not belong");
  });

  it("rejects missing shoot", async () => {
    mockMaybeSingle.mockResolvedValueOnce({ data: null, error: null });
    const res = await post(uploadBody({ workType: "shoots", workId: VALID_SHOOT_WORK_ID }));
    expect(res.status).toBe(403);
  });

  it("returns 500 on shoot ownership query failure", async () => {
    mockMaybeSingle.mockResolvedValueOnce({ data: null, error: { message: "db down" } });
    const res = await post(uploadBody({ workType: "shoots", workId: VALID_SHOOT_WORK_ID }));
    expect(res.status).toBe(500);
    const data = await res.json();
    expect(data.error).toBe("Internal error");
  });

  it("rejects context shootId owned by another brand", async () => {
    mockMaybeSingle
      .mockResolvedValueOnce({ data: { id: VALID_SHOOT_WORK_ID } }) // shoot workId query
      .mockResolvedValueOnce({ data: null, error: null }); // context shootId query
    const res = await post(
      uploadBody({
        workType: "shoots",
        workId: VALID_SHOOT_WORK_ID,
        context: { shootId: "66666666-6666-6666-6666-666666666666" },
      }),
    );
    expect(res.status).toBe(403);
  });

  it("campaign validation still works after shoot ownership fix", async () => {
    mockMaybeSingle.mockResolvedValueOnce({ data: { id: VALID_CAMPAIGN_WORK_ID }, error: null });
    const res = await post(uploadBody({ workType: "campaigns", workId: VALID_CAMPAIGN_WORK_ID }));
    expect(res.status).toBe(200);
  });
});

describe("POST /api/assets/upload-sign — folder override rejection", () => {
  it("ignores client-supplied folder and computes from taxonomy", async () => {
    const res = await post(
      uploadBody({ folder: "evil/override/path" } as Record<string, unknown>),
    );
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.assetFolder).not.toBe("evil/override/path");
    expect(data.assetFolder).toContain("ipix");
    expect(data.params).not.toHaveProperty("folder");
  });

  it("uses server-derived orgId from brand record", async () => {
    mockIsBrandAccessible.mockResolvedValueOnce({ ok: true, orgId: VALID_ORG_ID });
    const res = await post(uploadBody());
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.assetFolder).toContain(VALID_ORG_ID);
    expect(data.params.asset_folder).toContain(VALID_ORG_ID);
  });

  it("rejects non-UUID orgId from brand access", async () => {
    mockIsBrandAccessible.mockResolvedValueOnce({ ok: true, orgId: "not-a-uuid" });
    const res = await post(uploadBody());
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toMatch(/org_id/i);
  });

  it("rejects client-supplied orgId (ignored in favor of server-derived)", async () => {
    const res = await post(
      uploadBody({ orgId: "99999999-9999-9999-9999-999999999999" } as Record<string, unknown>),
    );
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.assetFolder).not.toContain("99999999");
    expect(data.assetFolder).toContain(VALID_ORG_ID);
  });
});

describe("POST /api/assets/upload-sign — notificationUrl", () => {
  it("rejects a non-allowlisted https notificationUrl", async () => {
    const res = await post(uploadBody({ notificationUrl: "https://evil.example.com/hook" }));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain("allowlist");
  });

  it("rejects a localhost notificationUrl", async () => {
    const res = await post(uploadBody({ notificationUrl: "https://localhost/hook" }));
    expect(res.status).toBe(400);
  });

  it("rejects a non-https notificationUrl", async () => {
    const res = await post(uploadBody({ notificationUrl: "http://approved.example.com/hook" }));
    expect(res.status).toBe(400);
  });

  it("accepts an allowlisted https notificationUrl", async () => {
    vi.stubEnv("CLOUDINARY_NOTIFICATION_ALLOWED_HOSTS", "approved.example.com");
    const res = await post(uploadBody({ notificationUrl: "https://approved.example.com/hook" }));
    expect(res.status).toBe(200);
  });
});

describe("POST /api/assets/upload-sign — backward compatibility", () => {
  it("accepts request with no work context", async () => {
    const res = await post(uploadBody());
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.params.asset_folder).toBe(`ipix/dev/${VALID_ORG_ID}/${VALID_BRAND_ID}/products`);
    expect(data.params.type).toBe("authenticated");
    expect(data.params.upload_preset).toBe("ipix-signed-upload");
  });

  it("signs params that match Cloudinary api_sign_request", async () => {
    const { v2: cloudinary } = await import("cloudinary");
    const res = await post(uploadBody());
    expect(res.status).toBe(200);
    const data = await res.json();
    const canonical = cloudinary.utils.api_sign_request(data.params, "test-secret");
    expect(data.signature).toBe(canonical);
  });
});
