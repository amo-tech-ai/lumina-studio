import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const DEAL_ID = "11111111-1111-4111-8111-111111111111";

const mockGetUser = vi.fn();
const mockGetCurrentOrgId = vi.fn();
const mockConvertDeal = vi.fn();
const mockCreateSupabaseServerClient = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: () => mockCreateSupabaseServerClient(),
}));

vi.mock("@/lib/crm/queries", () => ({
  getCurrentOrgId: (...args: unknown[]) => mockGetCurrentOrgId(...args),
}));

vi.mock("@/lib/crm/convert-deal", async () => {
  const actual = await vi.importActual<typeof import("@/lib/crm/convert-deal")>("@/lib/crm/convert-deal");
  return {
    ...actual,
    convertDeal: (...args: unknown[]) => mockConvertDeal(...args),
  };
});

beforeEach(() => {
  vi.resetModules();
  mockCreateSupabaseServerClient.mockResolvedValue({
    auth: { getUser: mockGetUser },
  });
  mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
  mockGetCurrentOrgId.mockResolvedValue("org-1");
  mockConvertDeal.mockResolvedValue({ ok: true, dealId: DEAL_ID, stage: "won", brandId: "brand-1" });
});

afterEach(() => {
  vi.clearAllMocks();
});

const routeContext = { params: Promise.resolve({ id: DEAL_ID }) };

async function importRoute() {
  return import("./route");
}

function makePost(body: unknown, id = DEAL_ID) {
  return new NextRequest(`http://localhost/api/crm/deals/${id}/convert`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

describe("POST /api/crm/deals/[id]/convert", () => {
  it("returns 400 for an invalid deal id — never calls convertDeal", async () => {
    const { POST } = await importRoute();
    const res = await POST(makePost({ decision: "won" }, "not-a-uuid"), {
      params: Promise.resolve({ id: "not-a-uuid" }),
    });
    expect(res.status).toBe(400);
    expect(mockConvertDeal).not.toHaveBeenCalled();
  });

  it("returns 400 for invalid JSON body", async () => {
    const { POST } = await importRoute();
    const req = new NextRequest(`http://localhost/api/crm/deals/${DEAL_ID}/convert`, {
      method: "POST",
      body: "not-json",
    });
    const res = await POST(req, routeContext);
    expect(res.status).toBe(400);
    expect((await res.json()).error.code).toBe("VALIDATION_ERROR");
  });

  it.each(["proposal", "WON", "", null, 42])(
    "rejects decision=%p — never calls convertDeal",
    async (decision) => {
      const { POST } = await importRoute();
      const res = await POST(makePost({ decision }), routeContext);
      expect(res.status).toBe(400);
      expect(mockConvertDeal).not.toHaveBeenCalled();
    },
  );

  it("returns 401 when unauthenticated", async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null } });
    const { POST } = await importRoute();
    const res = await POST(makePost({ decision: "won" }), routeContext);
    expect(res.status).toBe(401);
    expect(mockConvertDeal).not.toHaveBeenCalled();
  });

  it("returns 403 when the operator has no org membership", async () => {
    mockGetCurrentOrgId.mockResolvedValueOnce(null);
    const { POST } = await importRoute();
    const res = await POST(makePost({ decision: "won" }), routeContext);
    expect(res.status).toBe(403);
    expect(mockConvertDeal).not.toHaveBeenCalled();
  });

  it("won: creates a brand — returns the brandId from convertDeal, never fabricated", async () => {
    mockConvertDeal.mockResolvedValueOnce({ ok: true, dealId: DEAL_ID, stage: "won", brandId: "new-brand-1" });
    const { POST } = await importRoute();
    const res = await POST(makePost({ decision: "won" }), routeContext);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true, dealId: DEAL_ID, stage: "won", brandId: "new-brand-1" });
    expect(mockConvertDeal).toHaveBeenCalledWith({ dealId: DEAL_ID, decision: "won" }, expect.anything());
  });

  it("won: links an existing brand — brandId is the existing one, not a new one", async () => {
    mockConvertDeal.mockResolvedValueOnce({ ok: true, dealId: DEAL_ID, stage: "won", brandId: "existing-brand-9" });
    const { POST } = await importRoute();
    const res = await POST(makePost({ decision: "won" }), routeContext);
    expect((await res.json()).brandId).toBe("existing-brand-9");
  });

  it("lost: never touches brands — brandId is null", async () => {
    mockConvertDeal.mockResolvedValueOnce({ ok: true, dealId: DEAL_ID, stage: "lost", brandId: null });
    const { POST } = await importRoute();
    const res = await POST(makePost({ decision: "lost" }), routeContext);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true, dealId: DEAL_ID, stage: "lost", brandId: null });
  });

  it("propagates a service failure as its mapped status/code — no optimistic success", async () => {
    mockConvertDeal.mockResolvedValueOnce({
      ok: false,
      status: 409,
      code: "INVALID_TRANSITION",
      message: "This deal has already been marked won or lost.",
    });
    const { POST } = await importRoute();
    const res = await POST(makePost({ decision: "won" }), routeContext);
    expect(res.status).toBe(409);
    expect((await res.json()).error.message).toBe("This deal has already been marked won or lost.");
  });
});
