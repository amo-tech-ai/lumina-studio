// IPI-924 · AGENT-RAG-001 — GET /api/brands/[id]/similar
// Route keeps the service_role-only search_brands RPC off the client: auth gate,
// tenant check via isBrandAccessible (operator RLS), then org-scoped RPC via admin.
import { beforeEach, describe, expect, it, vi } from "vitest";

const { withOperatorAuth, rpc, from, isBrandAccessible } = vi.hoisted(() => ({
  withOperatorAuth: vi.fn(),
  rpc: vi.fn(async () => ({ data: [], error: null })),
  from: vi.fn(),
  isBrandAccessible: vi.fn(async () => ({
    ok: true,
    orgId: "7c41c1f4-1c1e-4d8f-bf27-4c0b0f5df1a1",
  })),
}));

vi.mock("@/lib/operator-gate", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/lib/operator-gate")>();
  return { ...actual, withOperatorAuth };
});

vi.mock("@/lib/supabase/operator-client", () => ({
  createOperatorSupabaseClient: vi.fn(async () => ({})),
}));

vi.mock("@/lib/assets/brand-access", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/lib/assets/brand-access")>();
  return { ...actual, isBrandAccessible };
});

vi.mock("@/app/api/_lib/supabase-admin", () => ({
  createSupabaseAdminClient: () => ({ from, rpc }),
}));

import { GET } from "./route";

const BRAND_ID = "3f0aa0e2-6c54-4b3e-9c40-8ac8f2ca03ab";
const OTHER_BRAND_ID = "4b3b1a3e-6c54-4b3e-9c40-8ac8f2ca0555";
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
  rpc.mockClear().mockResolvedValue({ data: [], error: null } as never);
  isBrandAccessible.mockClear().mockResolvedValue({ ok: true, orgId: ORG_ID } as never);
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

  it("404s on cross-tenant access (isBrandAccessible returns !ok, RPC never fires)", async () => {
    withOperatorAuth.mockResolvedValue({ id: "u1", name: "Op" });
    isBrandAccessible.mockResolvedValueOnce({
      ok: false,
      status: 404,
      message: "Brand not accessible to caller",
    } as never);
    mockBrandRow({ embedding: "[0.1]", org_id: "foreign-org" });

    const res = await GET(
      makeRequest(`/api/brands/${OTHER_BRAND_ID}/similar`),
      { params: Promise.resolve({ id: OTHER_BRAND_ID }) },
    );
    expect(res.status).toBe(404);
    expect(rpc).not.toHaveBeenCalled();
  });

  it("returns empty with reason=no_embedding when the brand has no embedding", async () => {
    withOperatorAuth.mockResolvedValue({ id: "u1", name: "Op" });
    mockBrandRow({ embedding: null, org_id: ORG_ID });
    const res = await GET(makeRequest(), ctx);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ data: [], reason: "no_embedding" });
    expect(rpc).not.toHaveBeenCalled();
  });

  it("calls search_brands with org-scoped args on same-tenant request", async () => {
    withOperatorAuth.mockResolvedValue({ id: "u1", name: "Op" });
    mockBrandRow({ embedding: "[0.1,0.2]", org_id: ORG_ID });
    rpc.mockResolvedValueOnce({
      data: [{ brand_id: "b2", brand_name: "Acme Denim", similarity: 0.91, shared_nodes: [] }],
      error: null,
    } as never);

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
    expect(isBrandAccessible).toHaveBeenCalled();
  });

  it("fractional limit falls back to DEFAULT_LIMIT (never p_limit=0)", async () => {
    withOperatorAuth.mockResolvedValue({ id: "u1", name: "Op" });
    mockBrandRow({ embedding: "[0.1,0.2]", org_id: ORG_ID });
    rpc.mockResolvedValueOnce({ data: [], error: null } as never);

    const res = await GET(makeRequest(`/api/brands/${BRAND_ID}/similar?limit=0.5`), ctx);
    expect(res.status).toBe(200);
    expect(rpc).toHaveBeenCalledWith(
      "search_brands",
      expect.objectContaining({ p_limit: 6 }),
    );
  });

  it("500s when the RPC errors", async () => {
    withOperatorAuth.mockResolvedValue({ id: "u1", name: "Op" });
    mockBrandRow({ embedding: "[0.1]", org_id: ORG_ID });
    rpc.mockResolvedValueOnce({ data: null, error: { message: "boom" } } as never);
    const res = await GET(makeRequest(), ctx);
    expect(res.status).toBe(500);
  });
});
