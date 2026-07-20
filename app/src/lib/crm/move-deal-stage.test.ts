import { describe, expect, it, vi } from "vitest";
import { isNonTerminalDealStage, moveDealStage, NON_TERMINAL_DEAL_STAGES } from "./move-deal-stage";

function mockSingleTable(
  row: Record<string, unknown> | null,
  error: { message: string; code?: string } | null = null,
  opts?: { existsAfterCasMiss?: boolean },
) {
  const builder = {
    update: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    single: vi.fn(async () => ({ data: row, error })),
    maybeSingle: vi.fn(async () => ({
      data: opts?.existsAfterCasMiss ? { id: "d1" } : null,
      error: null,
    })),
  };
  return { from: vi.fn(() => builder), _builder: builder } as never;
}

describe("NON_TERMINAL_DEAL_STAGES / isNonTerminalDealStage", () => {
  it("excludes won and lost", () => {
    expect(NON_TERMINAL_DEAL_STAGES).toEqual(["lead", "qualified", "proposal", "negotiation"]);
    expect(isNonTerminalDealStage("won")).toBe(false);
    expect(isNonTerminalDealStage("lost")).toBe(false);
    expect(isNonTerminalDealStage("negotiation")).toBe(true);
    expect(isNonTerminalDealStage("not-a-stage")).toBe(false);
  });
});

describe("moveDealStage", () => {
  it("scopes the update by id and org, returning the confirmed stage", async () => {
    const sb = mockSingleTable({ id: "d1", stage: "negotiation", updated_at: "2026-07-20T12:00:00.000Z" });
    const result = await moveDealStage({ dealId: "d1", orgId: "org-1", stage: "negotiation" }, sb as never);
    expect(result).toEqual({ ok: true, dealId: "d1", stage: "negotiation", updatedAt: "2026-07-20T12:00:00.000Z" });
    expect((sb as unknown as { _builder: { update: ReturnType<typeof vi.fn> } })._builder.update).toHaveBeenCalledWith({
      stage: "negotiation",
    });
    expect((sb as unknown as { _builder: { eq: ReturnType<typeof vi.fn> } })._builder.eq).toHaveBeenCalledWith(
      "id",
      "d1",
    );
    expect((sb as unknown as { _builder: { eq: ReturnType<typeof vi.fn> } })._builder.eq).toHaveBeenCalledWith(
      "org_id",
      "org-1",
    );
  });

  it("returns a typed failure instead of throwing when the query errors — never forwarding the raw PostgREST message", async () => {
    const sb = mockSingleTable(null, { message: "relation crm_deals violates row-level security policy" });
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    const result = await moveDealStage({ dealId: "missing", orgId: "org-1", stage: "lead" }, sb as never);
    expect(result).toEqual({ ok: false, status: 500, code: "INTERNAL_ERROR", message: "Failed to update deal stage." });
    expect(consoleError).toHaveBeenCalledWith(
      "[crm/move-deal-stage] update failed:",
      "relation crm_deals violates row-level security policy",
    );
    consoleError.mockRestore();
  });

  it("maps a no-row update (stale/deleted/cross-org id) to 404, not 500", async () => {
    const sb = mockSingleTable(null, { message: "JSON object requested, multiple (or no) rows returned", code: "PGRST116" });
    const result = await moveDealStage({ dealId: "missing", orgId: "org-1", stage: "lead" }, sb as never);
    expect(result).toEqual({ ok: false, status: 404, code: "NOT_FOUND", message: "Deal not found." });
  });

  it("returns 409 when compare-and-set filters match zero rows but the deal still exists", async () => {
    const sb = mockSingleTable(
      null,
      {
        message: "JSON object requested, multiple (or no) rows returned",
        code: "PGRST116",
      },
      { existsAfterCasMiss: true },
    );
    const result = await moveDealStage(
      {
        dealId: "d1",
        orgId: "org-1",
        stage: "qualified",
        expectedStage: "lead",
        expectedUpdatedAt: "2026-07-01T00:00:00.000Z",
      },
      sb as never,
    );
    expect(result).toEqual({
      ok: false,
      status: 409,
      code: "STALE_BOOKING",
      message: "This deal was updated elsewhere. Refresh and try again.",
    });
    const eq = (sb as unknown as { _builder: { eq: ReturnType<typeof vi.fn> } })._builder.eq;
    expect(eq).toHaveBeenCalledWith("stage", "lead");
    expect(eq).toHaveBeenCalledWith("updated_at", "2026-07-01T00:00:00.000Z");
  });

  it("returns 404 (not 409) when CAS misses because the deal was deleted", async () => {
    const sb = mockSingleTable(
      null,
      {
        message: "JSON object requested, multiple (or no) rows returned",
        code: "PGRST116",
      },
      { existsAfterCasMiss: false },
    );
    const result = await moveDealStage(
      {
        dealId: "gone",
        orgId: "org-1",
        stage: "qualified",
        expectedStage: "lead",
        expectedUpdatedAt: "2026-07-01T00:00:00.000Z",
      },
      sb as never,
    );
    expect(result).toEqual({ ok: false, status: 404, code: "NOT_FOUND", message: "Deal not found." });
  });
});
