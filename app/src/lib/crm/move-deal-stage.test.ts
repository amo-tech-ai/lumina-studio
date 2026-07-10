import { describe, expect, it, vi } from "vitest";
import { isNonTerminalDealStage, moveDealStage, NON_TERMINAL_DEAL_STAGES } from "./move-deal-stage";

function mockSingleTable(
  row: Record<string, unknown> | null,
  error: { message: string; code?: string } | null = null,
) {
  const builder = {
    update: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    single: vi.fn(async () => ({ data: row, error })),
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
    const sb = mockSingleTable({ id: "d1", stage: "negotiation" });
    const result = await moveDealStage({ dealId: "d1", orgId: "org-1", stage: "negotiation" }, sb as never);
    expect(result).toEqual({ ok: true, dealId: "d1", stage: "negotiation" });
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

  it("returns a typed failure instead of throwing when the query errors", async () => {
    const sb = mockSingleTable(null, { message: "boom" });
    const result = await moveDealStage({ dealId: "missing", orgId: "org-1", stage: "lead" }, sb as never);
    expect(result).toEqual({ ok: false, status: 500, code: "INTERNAL_ERROR", message: "boom" });
  });

  it("maps a no-row update (stale/deleted/cross-org id) to 404, not 500", async () => {
    const sb = mockSingleTable(null, { message: "JSON object requested, multiple (or no) rows returned", code: "PGRST116" });
    const result = await moveDealStage({ dealId: "missing", orgId: "org-1", stage: "lead" }, sb as never);
    expect(result).toEqual({ ok: false, status: 404, code: "NOT_FOUND", message: "Deal not found." });
  });
});
