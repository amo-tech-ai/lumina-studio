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
const OTHER_BRAND_ID = "4b3b1a3e-6c54-4b3e-9c40-8ac8f2ca0555";
const OTHER_ORG_ID = "8d52d25f-2d2f-4e9g-cg38-5d1c1g6eg2b2";

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

  it("404s when the brand does not exist (brand-access gate fails)", async () => {
    withOperatorAuth.mockResolvedValue({ id: "u1", name: "Op" });
    // isBrandAccessible returns ok:false for foreign-org brands — here's the same-tenant
    // refusal path (mock reflects brand not found under RLS, which the isBrandAccessible
    // helper translates to a hard 404 before the RPC is even invoked).
    vi.doMock("@/lib/assets/brand-access", async () => ({
      isBrandAccessible: vi.fn().mockResolvedValue({ ok: false, status: 404, message: "Brand not accessible to caller" }),
    }));
    const res = await GET(makeRequest(), ctx);
    expect(res.status).toBe(404);
  });

  it("200s on same-tenant request and search_brands is invoked with the operator's org context", async () => {
    withOperatorAuth.mockResolvedValue({ id: "u1", name: "Op" });
    mockBrandRow({ embedding: "[0.1,0.2]", org_id: ORG_ID });
    rpc.mockResolvedValueOnce({
      data: [{ brand_id: "b2", brand_name: "Acme Denim", similarity: 0.91, shared_nodes: [] }],
      error: null,
    });

    const res = await GET(makeRequest(), ctx);
    expect(res.status).toBe(200);
    expect(rpc).toHaveBeenCalledWith(
      "search_brands",
      expect.objectContaining({
        p_embedding: "[0.1,0.2]",
        p_org_id: ORG_ID,
        p_exclude_brand_id: BRAND_ID,
      }),
    );
  });

  it("cross-tenant access is blocked (RLS returns no row for foreign-org brand)", async () => {
    withOperatorAuth.mockResolvedValue({ id: "u1", name: "Op" });
    // Under RLS, a brand in a different org returns no row for this caller.
    // brand-access translates that to { ok: false, status: 404 }.
    vi.doMock("@/lib/assets/brand-access", async () => ({
      isBrandAccessible: vi.fn().mockResolvedValue({ ok: false, status: 404, message: "Brand not accessible to caller" }),
    }));
    const res = await GET(
      makeRequest(`/api/brands/${OTHER_BRAND_ID}/similar`),
      { params: Promise.resolve({ id: OTHER_BRAND_ID }) },
    );
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

  it("passes a fractional limit through as the default (0.5 → 6, never 0)", async () => {
    withOperatorAuth.mockResolvedValue({ id: "u1", name: "Op" });
    mockBrandRow({ embedding: "[0.1,0.2]", org_id: ORG_ID });
    rpc.mockResolvedValueOnce({ data: [], error: null });

    const res = await GET(makeRequest(`/api/brands/${BRAND_ID}/similar?limit=0.5`), ctx);
    expect(res.status).toBe(200);
    // Fractional input must not floor to 0 — must fall back to DEFAULT_LIMIT 6.
    expect(rpc).toHaveBeenCalledWith(
      "search_brands",
      expect.objectContaining({ p_limit: 6 }),
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
