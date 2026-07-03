import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const BRAND_ID = "11111111-1111-1111-1111-111111111111";

const mockGetBrandAssets = vi.fn();
const mockWithOperatorAuth = vi.fn();
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

vi.mock("@/lib/shoot/get-brand-assets", () => ({
  getBrandAssets: (...args: unknown[]) => mockGetBrandAssets(...args),
}));

beforeEach(() => {
  vi.resetModules();
  mockWithOperatorAuth.mockResolvedValue({ id: "user-1", name: "QA" });
  mockCreateSupabaseServerClient.mockResolvedValue({});
  mockGetBrandAssets.mockResolvedValue({ ok: true, data: [] });
});

afterEach(() => {
  vi.clearAllMocks();
});

async function importRoute() {
  return import("./route");
}

describe("GET /api/assets", () => {
  it("treats empty shoot_id query param as null", async () => {
    const { GET } = await importRoute();
    const res = await GET(
      new Request(`http://localhost/api/assets?brand_id=${BRAND_ID}&shoot_id=`),
    );

    expect(res.status).toBe(200);
    expect(mockGetBrandAssets).toHaveBeenCalledWith(expect.anything(), BRAND_ID, null);
  });

  it("returns 400 for invalid shoot_id", async () => {
    const { GET } = await importRoute();
    const res = await GET(
      new Request(`http://localhost/api/assets?brand_id=${BRAND_ID}&shoot_id=not-a-uuid`),
    );

    expect(res.status).toBe(400);
    expect(mockGetBrandAssets).not.toHaveBeenCalled();
  });
});
