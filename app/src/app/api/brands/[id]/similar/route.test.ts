// IPI-924 · AGENT-RAG-001 — GET /api/brands/[id]/similar
// Route keeps the service_role-only search_brands RPC off the client: auth gate,
// brand lookup for embedding/org_id, then the org-scoped RPC via the admin client.
import { beforeEach, describe, expect, it, vi } from "vitest";

const { withOperatorAuth, rpc, from, rpcCalls } = vi.hoisted(() => {
  const rpcCalls: Array<Record<string, unknown>> = [];
  return {
    withOperatorAuth: vi.fn(),
    rpc: vi.fn(async (fn: string, params: Record<string, unknown>) => {
      rpcCalls.push({ fn, ...params });
      return { data: [], error: null };
    }),
    from: vi.fn(),
    rpcCalls,
  };
});

vi.mock("@/lib/operator-gate", async () => {
  const actual = await vi.importActual<typeof import("@/lib/operator-gate")>(
    "@/lib/operator-gate",
  );
  return { ...actual, withOperatorAuth };
});

vi.mock("@/app/api/_lib/supabase-admin", () => ({
  createSupabaseAdminClient: () => ({ from, rpc }),
}));

import { GET } from "./route";

const BRAND_ID = "3f0aa0e2-6c54-4b3e-9c40-8ac8f2ca03ab";
const ORG_ID = "7c41c1f4-1c1e-4d8f-bf27-4c0b0f5df1a1";

function makeRequest(path = `/api/brands/${BRAND_ID}/similar`) {
  return new Request(`http://localhost:3002${path}`);
}

function mockBrandRow(row: { embedding: string | null; org_id: string | null } | null) {
  from.mockReturnValue({
    select: () => ({
      eq: () => ({
        maybeSingle: async () => ({ data: row, error: null }),
      }),
    }),
  });
}

const ctx = { params: Promise.resolve({ id: BRAND_ID }) };

beforeEach(() => {
  withOperatorAuth.mockReset();
  from.mockReset();
  rpc.mockClear();
  rpcCalls.length = 0;
});

describe("GET /api/brands/[id]/similar", () => {
  it("400s on a non-UUID brand id", async () => {
    const res = await GET(makeRequest(`/api/brands/nope/similar`), {
      params: Promise.resolve({ id: "nope" }),
    });
    expect(res.status).toBe(400);
  });

  it("401s when operator auth rejects", async () => {
    const { OperatorAuthError } = await import("@/lib/operator-gate");
    withOperatorAuth.mockRejectedValueOnce(new OperatorAuthError("Unauthorized"));
    const res = await GET(makeRequest(), ctx);
    expect(res.status).toBe(401);
  });

  it("404s when the brand does not exist", async () => {
    withOperatorAuth.mockResolvedValue({ id: "u1", name: "Op" });
    mockBrandRow(null);
    const res = await GET(makeRequest(), ctx);
    expect(res.status).toBe(404);
  });

  it("returns empty with reason=no_embedding when the brand has no embedding", async () => {
    withOperatorAuth.mockResolvedValue({ id: "u1", name: "Op" });
    mockBrandRow({ embedding: null, org_id: ORG_ID });
    const res = await GET(makeRequest(), ctx);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ data: [], reason: "no_embedding" });
    expect(rpc).not.toHaveBeenCalled();
  });

  it("calls search_brands org-scoped and returns matches", async () => {
    withOperatorAuth.mockResolvedValue({ id: "u1", name: "Op" });
    mockBrandRow({ embedding: "[0.1,0.2]", org_id: ORG_ID });
    rpc.mockResolvedValueOnce({
      data: [{ brand_id: "b2", brand_name: "Acme Denim", similarity: 0.91, shared_nodes: [] }],
      error: null,
    });

    const res = await GET(makeRequest(), ctx);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data[0].brand_name).toBe("Acme Denim");
    expect(rpc).toHaveBeenCalledWith(
      "search_brands",
      expect.objectContaining({
        p_embedding: "[0.1,0.2]",
        p_org_id: ORG_ID,
        p_exclude_brand_id: BRAND_ID,
      }),
    );
  });

  it("500s when the RPC errors", async () => {
    withOperatorAuth.mockResolvedValue({ id: "u1", name: "Op" });
    mockBrandRow({ embedding: "[0.1]", org_id: ORG_ID });
    rpc.mockResolvedValueOnce({ data: null, error: { message: "boom" } });
    const res = await GET(makeRequest(), ctx);
    expect(res.status).toBe(500);
  });
});
