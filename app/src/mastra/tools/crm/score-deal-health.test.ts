import { beforeEach, describe, expect, it, vi } from "vitest";

const getCrmUserClient = vi.fn();

vi.mock("./_shared", async () => {
  const actual = await vi.importActual<typeof import("./_shared")>("./_shared");
  return {
    ...actual,
    getCrmUserClient: (...args: unknown[]) => getCrmUserClient(...args),
  };
});

import { scoreDealHealthTool } from "./score-deal-health";

const DEAL_ID = "11111111-1111-4111-8111-111111111111";

function chainable(result: { data: unknown; error: unknown }) {
  const builder: Record<string, unknown> = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn(async () => result),
    then(resolve: (v: unknown) => unknown, reject?: (e: unknown) => unknown) {
      return Promise.resolve(result).then(resolve, reject);
    },
  };
  return builder;
}

describe("scoreDealHealthTool", () => {
  beforeEach(() => {
    getCrmUserClient.mockReset();
  });

  it("returns a tool error when org context is missing", async () => {
    getCrmUserClient.mockResolvedValueOnce({ client: null, error: "No organization membership for this operator" });
    const result = await scoreDealHealthTool.execute!({ dealId: DEAL_ID, focus: "all" }, {} as never);
    expect(result).toEqual({ ok: false, error: "No organization membership for this operator" });
  });

  it("scores an org-scoped deal and coerces numeric value", async () => {
    const dealBuilder = chainable({
      data: {
        id: DEAL_ID,
        company_id: "c1",
        stage: "negotiation",
        updated_at: "2026-07-19T12:00:00.000Z",
        expected_close_date: null,
        owner: null,
        value: "12500.50",
      },
      error: null,
    });
    const actBuilder = chainable({ data: [], error: null });
    const from = vi.fn((table: string) => (table === "crm_deals" ? dealBuilder : actBuilder));
    getCrmUserClient.mockResolvedValueOnce({
      client: { from },
      orgId: "org-1",
      userId: "u1",
    });

    const result = await scoreDealHealthTool.execute!({ dealId: DEAL_ID, focus: "all" }, {} as never);
    expect(result.ok).toBe(true);
    expect(result.score).toEqual(expect.any(Number));
    expect(result.scoreVersion).toEqual(expect.any(String));
    expect(from).toHaveBeenCalledWith("crm_deals");
    expect(from).toHaveBeenCalledWith("crm_activities");
  });

  it("returns not-found when the deal is outside the org", async () => {
    const dealBuilder = chainable({ data: null, error: null });
    getCrmUserClient.mockResolvedValueOnce({
      client: { from: vi.fn(() => dealBuilder) },
      orgId: "org-1",
      userId: "u1",
    });
    const result = await scoreDealHealthTool.execute!({ dealId: DEAL_ID, focus: "at_risk" }, {} as never);
    expect(result).toEqual({ ok: false, error: "Deal not found in your organization" });
  });
});
