import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const ASSET_ID = "abcdef0123456789abcdef0123456789";

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
  mockWithOperatorAuth.mockResolvedValue({ id: "user-1", name: "QA" });
  mockCreateOperatorSupabaseClient.mockResolvedValue(supabaseClientStub());
});

afterEach(() => {
  vi.clearAllMocks();
});

async function importRoute() {
  return import("./route");
}

describe("GET /api/assets/status", () => {
  it("returns 404 when mirror row is missing", async () => {
    mockMaybeSingle.mockResolvedValueOnce({ data: null, error: null });
    const { GET } = await importRoute();
    const res = await GET(
      new Request(`http://localhost/api/assets/status?cloudinaryAssetId=${ASSET_ID}`),
    );
    expect(res.status).toBe(404);
  });

  it("returns normalized ready status", async () => {
    mockMaybeSingle.mockResolvedValueOnce({
      data: {
        status: "ready",
        version: 123,
        public_id: "ipix/brands/x/file",
        cloudinary_asset_id: ASSET_ID,
        brand_id: "11111111-1111-1111-1111-111111111111",
      },
      error: null,
    });
    const { GET } = await importRoute();
    const res = await GET(
      new Request(`http://localhost/api/assets/status?cloudinaryAssetId=${ASSET_ID}`),
    );
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.status).toBe("ready");
    expect(data.cloudinary_asset_id).toBe(ASSET_ID);
  });
});
