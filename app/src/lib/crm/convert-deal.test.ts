import { describe, expect, it, vi } from "vitest";
import { convertDeal } from "./convert-deal";
import type { Database } from "@/types/supabase";

// Type-level regression: crm_convert_deal returns NULL brand_id for lost deals
type ConvertDealResult =
  Database["public"]["Functions"]["crm_convert_deal"]["Returns"][number];
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _lostDealBrandId: ConvertDealResult["brand_id"] = null;

function mockRpc(row: Record<string, unknown> | null, error: { message: string } | null = null) {
  const builder = { single: vi.fn(async () => ({ data: row, error })) };
  return { rpc: vi.fn(() => builder), _builder: builder } as never;
}

describe("convertDeal", () => {
  it("won: returns the confirmed stage and the new/linked brandId", async () => {
    const sb = mockRpc({ deal_id: "d1", stage: "won", brand_id: "b1" });
    const result = await convertDeal({ dealId: "d1", decision: "won" }, sb as never);
    expect(result).toEqual({ ok: true, dealId: "d1", stage: "won", brandId: "b1" });
    expect((sb as unknown as { rpc: ReturnType<typeof vi.fn> }).rpc).toHaveBeenCalledWith("crm_convert_deal", {
      p_deal_id: "d1",
      p_decision: "won",
    });
  });

  it("lost: brandId is null", async () => {
    const sb = mockRpc({ deal_id: "d1", stage: "lost", brand_id: null });
    const result = await convertDeal({ dealId: "d1", decision: "lost" }, sb as never);
    expect(result).toEqual({ ok: true, dealId: "d1", stage: "lost", brandId: null });
  });

  it("maps 'deal not found' to 404", async () => {
    const sb = mockRpc(null, { message: "crm_convert_deal: deal not found" });
    const result = await convertDeal({ dealId: "missing", decision: "won" }, sb as never);
    expect(result).toEqual({ ok: false, status: 404, code: "NOT_FOUND", message: "Deal not found." });
  });

  // Regression for the exact bug a PR review caught: the hardening migration
  // (20260712100000) changed the authorization exception text from
  // "is not a member of this deal's organization" to "caller must be an org
  // editor or owner" when is_org_member was tightened to
  // is_org_editor_or_above — this client mapping has to track that text, or
  // a viewer's rejected conversion silently becomes a 500 instead of a 403.
  it("maps the org-editor-or-above authorization exception to 403, not 500", async () => {
    const sb = mockRpc(null, { message: "crm_convert_deal: caller must be an org editor or owner" });
    const result = await convertDeal({ dealId: "d1", decision: "won" }, sb as never);
    expect(result).toEqual({
      ok: false,
      status: 403,
      code: "FORBIDDEN",
      message: "You do not have access to this deal.",
    });
  });

  it("maps the cross-org company exception to 403, not 500, and logs it server-side", async () => {
    const message = "crm_convert_deal: company c1 not found in org org-1";
    const sb = mockRpc(null, { message });
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    const result = await convertDeal({ dealId: "d1", decision: "won" }, sb as never);
    expect(result).toEqual({
      ok: false,
      status: 403,
      code: "FORBIDDEN",
      message: "You do not have access to this deal.",
    });
    // A cross-org company_id is a data-integrity anomaly, not a routine
    // permission denial — it must leave a server-side breadcrumb, unlike
    // the ordinary editor-or-above 403 below.
    expect(consoleError).toHaveBeenCalledWith("[crm/convert-deal] rejected cross-org company:", message);
    consoleError.mockRestore();
  });

  it("maps 'already terminal' to 409", async () => {
    const sb = mockRpc(null, { message: "crm_convert_deal: deal d1 is already terminal (won)" });
    const result = await convertDeal({ dealId: "d1", decision: "lost" }, sb as never);
    expect(result).toEqual({
      ok: false,
      status: 409,
      code: "INVALID_TRANSITION",
      message: "This deal has already been marked won or lost.",
    });
  });

  it("maps an unrecognized error to 500 without forwarding the raw Postgres message", async () => {
    const sb = mockRpc(null, { message: "relation crm_deals violates row-level security policy" });
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    const result = await convertDeal({ dealId: "d1", decision: "won" }, sb as never);
    expect(result).toEqual({
      ok: false,
      status: 500,
      code: "INTERNAL_ERROR",
      message: "Failed to convert the deal.",
    });
    expect(consoleError).toHaveBeenCalledWith(
      "[crm/convert-deal] rpc failed:",
      "relation crm_deals violates row-level security policy",
    );
    consoleError.mockRestore();
  });

  it("maps a missing row (no error, no data) to 500", async () => {
    const sb = mockRpc(null, null);
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    const result = await convertDeal({ dealId: "d1", decision: "won" }, sb as never);
    expect(result).toEqual({
      ok: false,
      status: 500,
      code: "INTERNAL_ERROR",
      message: "Failed to convert the deal.",
    });
    consoleError.mockRestore();
  });
});
