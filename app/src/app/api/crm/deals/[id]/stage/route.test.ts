import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const DEAL_ID = "11111111-1111-4111-8111-111111111111";

const mockGetUser = vi.fn();
const mockGetCurrentOrgId = vi.fn();
const mockMoveDealStage = vi.fn();
const mockCreateSupabaseServerClient = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: () => mockCreateSupabaseServerClient(),
}));

vi.mock("@/lib/crm/queries", () => ({
  getCurrentOrgId: (...args: unknown[]) => mockGetCurrentOrgId(...args),
}));

vi.mock("@/lib/crm/move-deal-stage", async () => {
  const actual = await vi.importActual<typeof import("@/lib/crm/move-deal-stage")>("@/lib/crm/move-deal-stage");
  return {
    ...actual,
    moveDealStage: (...args: unknown[]) => mockMoveDealStage(...args),
  };
});

beforeEach(() => {
  vi.resetModules();
  mockCreateSupabaseServerClient.mockResolvedValue({
    auth: { getUser: mockGetUser },
  });
  mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
  mockGetCurrentOrgId.mockResolvedValue("org-1");
  mockMoveDealStage.mockResolvedValue({
    ok: true,
    dealId: DEAL_ID,
    stage: "negotiation",
    updatedAt: "2026-07-20T12:00:00.000Z",
  });
});

afterEach(() => {
  vi.clearAllMocks();
});

const routeContext = { params: Promise.resolve({ id: DEAL_ID }) };

async function importRoute() {
  return import("./route");
}

function makePatch(body: unknown, id = DEAL_ID) {
  return new NextRequest(`http://localhost/api/crm/deals/${id}/stage`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

describe("PATCH /api/crm/deals/[id]/stage", () => {
  it("returns 400 for an invalid deal id — never calls moveDealStage", async () => {
    const { PATCH } = await importRoute();
    const res = await PATCH(makePatch({ stage: "negotiation" }, "not-a-uuid"), {
      params: Promise.resolve({ id: "not-a-uuid" }),
    });
    expect(res.status).toBe(400);
    expect(mockMoveDealStage).not.toHaveBeenCalled();
  });

  it("returns 400 for invalid JSON body", async () => {
    const { PATCH } = await importRoute();
    const req = new NextRequest(`http://localhost/api/crm/deals/${DEAL_ID}/stage`, {
      method: "PATCH",
      body: "not-json",
    });
    const res = await PATCH(req, routeContext);
    expect(res.status).toBe(400);
    expect((await res.json()).error.code).toBe("VALIDATION_ERROR");
  });

  it("rejects stage=won at validation — never reaches moveDealStage (defense-in-depth for IPI-367)", async () => {
    const { PATCH } = await importRoute();
    const res = await PATCH(makePatch({ stage: "won" }), routeContext);
    expect(res.status).toBe(400);
    expect((await res.json()).error.code).toBe("VALIDATION_ERROR");
    expect(mockMoveDealStage).not.toHaveBeenCalled();
  });

  it("rejects stage=lost at validation — never reaches moveDealStage", async () => {
    const { PATCH } = await importRoute();
    const res = await PATCH(makePatch({ stage: "lost" }), routeContext);
    expect(res.status).toBe(400);
    expect(mockMoveDealStage).not.toHaveBeenCalled();
  });

  it("returns 401 when unauthenticated", async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null } });
    const { PATCH } = await importRoute();
    const res = await PATCH(makePatch({ stage: "negotiation" }), routeContext);
    expect(res.status).toBe(401);
    expect(mockMoveDealStage).not.toHaveBeenCalled();
  });

  it("returns 403 when the operator has no org membership", async () => {
    mockGetCurrentOrgId.mockResolvedValueOnce(null);
    const { PATCH } = await importRoute();
    const res = await PATCH(makePatch({ stage: "negotiation" }), routeContext);
    expect(res.status).toBe(403);
    expect(mockMoveDealStage).not.toHaveBeenCalled();
  });

  it("scopes the write by the resolved org id and returns the confirmed stage on success", async () => {
    const { PATCH } = await importRoute();
    const res = await PATCH(makePatch({ stage: "negotiation" }), routeContext);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      ok: true,
      dealId: DEAL_ID,
      stage: "negotiation",
      updatedAt: "2026-07-20T12:00:00.000Z",
    });
    expect(mockMoveDealStage).toHaveBeenCalledWith(
      {
        dealId: DEAL_ID,
        orgId: "org-1",
        stage: "negotiation",
        expectedStage: undefined,
        expectedUpdatedAt: undefined,
      },
      expect.anything(),
    );
  });

  it("forwards expectedStage and expectedUpdatedAt for compare-and-set", async () => {
    const { PATCH } = await importRoute();
    const res = await PATCH(
      makePatch({
        stage: "qualified",
        expectedStage: "lead",
        expectedUpdatedAt: "2026-07-01T00:00:00.000Z",
      }),
      routeContext,
    );
    expect(res.status).toBe(200);
    expect(mockMoveDealStage).toHaveBeenCalledWith(
      {
        dealId: DEAL_ID,
        orgId: "org-1",
        stage: "qualified",
        expectedStage: "lead",
        expectedUpdatedAt: "2026-07-01T00:00:00.000Z",
      },
      expect.anything(),
    );
  });

  it("propagates a 409 CAS conflict from moveDealStage", async () => {
    mockMoveDealStage.mockResolvedValueOnce({
      ok: false,
      status: 409,
      code: "STALE_BOOKING",
      message: "This deal was updated elsewhere. Refresh and try again.",
    });
    const { PATCH } = await importRoute();
    const res = await PATCH(makePatch({ stage: "qualified", expectedStage: "lead" }), routeContext);
    expect(res.status).toBe(409);
    expect((await res.json()).error.code).toBe("STALE_BOOKING");
  });

  it("propagates a service failure as its mapped status/code", async () => {
    mockMoveDealStage.mockResolvedValueOnce({
      ok: false,
      status: 500,
      code: "INTERNAL_ERROR",
      message: "no rows updated",
    });
    const { PATCH } = await importRoute();
    const res = await PATCH(makePatch({ stage: "qualified" }), routeContext);
    expect(res.status).toBe(500);
    expect((await res.json()).error.message).toBe("no rows updated");
  });
});
