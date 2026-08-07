import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const BRAND_ID = "11111111-1111-1111-1111-111111111111";
const ORG_ID = "22222222-2222-2222-2222-222222222222";

const mockWithOperatorAuth = vi.fn();
const mockMaybeSingle = vi.fn();
const mockRpc = vi.fn();
const mockCreateOperatorSupabaseClient = vi.fn();
const mockCreateSupabaseAdminClient = vi.fn();

vi.mock("@/lib/operator-gate", () => ({
  withOperatorAuth: (...args: unknown[]) => mockWithOperatorAuth(...args),
  OperatorAuthError: class OperatorAuthError extends Error {
    constructor(message: string) {
      super(message);
      this.name = "OperatorAuthError";
    }
  },
}));

vi.mock("@/lib/supabase/operator-client", () => ({
  createOperatorSupabaseClient: (...args: unknown[]) => mockCreateOperatorSupabaseClient(...args),
}));

vi.mock("@/app/api/_lib/supabase-admin", () => ({
  createSupabaseAdminClient: () => mockCreateSupabaseAdminClient(),
}));

function operatorClientStub() {
  const maybeSingle = vi.fn(() => mockMaybeSingle());
  const eq = vi.fn(() => ({ maybeSingle }));
  const select = vi.fn(() => ({ eq }));
  return { from: vi.fn(() => ({ select })) };
}

beforeEach(() => {
  vi.resetModules();
  mockWithOperatorAuth.mockResolvedValue({ id: "user-1" });
  mockCreateOperatorSupabaseClient.mockResolvedValue(operatorClientStub());
  mockCreateSupabaseAdminClient.mockReturnValue({ rpc: mockRpc });
  mockMaybeSingle.mockResolvedValue({
    data: { id: BRAND_ID, embedding: "[0.1,0.2,0.3]", org_id: ORG_ID },
    error: null,
  });
  mockRpc.mockResolvedValue({
    data: [
      {
        brand_id: "33333333-3333-3333-3333-333333333333",
        brand_name: "Reformation",
        shared_nodes: [{ node_type: "category", label: "sustainable fashion" }],
        similarity: 0.87,
      },
    ],
    error: null,
  });
});

afterEach(() => {
  vi.clearAllMocks();
});

async function importRoute() {
  return import("./route");
}

function request() {
  return new Request(`http://localhost/api/brand/${BRAND_ID}/similar`);
}

const context = { params: Promise.resolve({ id: BRAND_ID }) };

describe("GET /api/brand/[id]/similar", () => {
  it("uses the service-role client for search_brands after an RLS-scoped brand read", async () => {
    const { GET } = await importRoute();
    const response = await GET(request(), context);

    expect(response.status).toBe(200);
    expect(mockCreateOperatorSupabaseClient).toHaveBeenCalledWith(expect.any(Request));
    expect(mockCreateSupabaseAdminClient).toHaveBeenCalled();
    expect(mockRpc).toHaveBeenCalledWith("search_brands", {
      p_embedding: "[0.1,0.2,0.3]",
      p_org_id: ORG_ID,
      p_exclude_brand_id: BRAND_ID,
      p_limit: 6,
    });

    const body = await response.json();
    expect(body.similar).toHaveLength(1);
    expect(body.similar[0].brand_name).toBe("Reformation");
  });

  it("returns the no-embeddings empty state without creating the admin client", async () => {
    mockMaybeSingle.mockResolvedValueOnce({
      data: { id: BRAND_ID, embedding: null, org_id: ORG_ID },
      error: null,
    });

    const { GET } = await importRoute();
    const response = await GET(request(), context);

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ similar: [], notice: "no-embeddings" });
    expect(mockCreateSupabaseAdminClient).not.toHaveBeenCalled();
    expect(mockRpc).not.toHaveBeenCalled();
  });

  it("returns 404 when RLS cannot read the source brand", async () => {
    mockMaybeSingle.mockResolvedValueOnce({ data: null, error: null });

    const { GET } = await importRoute();
    const response = await GET(request(), context);

    expect(response.status).toBe(404);
    expect(mockCreateSupabaseAdminClient).not.toHaveBeenCalled();
  });
});
