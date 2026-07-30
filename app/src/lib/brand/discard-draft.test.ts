import { describe, expect, it, vi } from "vitest";
import { discardBrandDraft } from "./discard-draft";

function mockSupabase(brand: Record<string, unknown> | null, selectErr?: { message: string }) {
  const updateCalls: Record<string, unknown>[] = [];
  return {
    sb: {
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            maybeSingle: vi.fn(async () =>
              selectErr ? { data: null, error: selectErr } : { data: brand, error: null },
            ),
          })),
        })),
        update: vi.fn((patch: Record<string, unknown>) => {
          updateCalls.push(patch);
          return {
            eq: () => ({
              eq: () => ({
                select: () => ({
                  maybeSingle: async () => ({ data: { id: "b1" }, error: null }),
                }),
              }),
            }),
          };
        }),
      })),
    } as never,
    updateCalls,
  };
}

describe("discardBrandDraft", () => {
  it("returns an error when the brand is not found", async () => {
    const { sb } = mockSupabase(null);
    const result = await discardBrandDraft(sb, "b1");
    expect(result).toEqual({ ok: false, error: "Brand not found" });
  });

  it("restores to brand_created when there was no prior scores_complete profile", async () => {
    const { sb, updateCalls } = mockSupabase({
      id: "b1",
      ai_profile: null,
      intake_status: "draft_ready",
    });
    const result = await discardBrandDraft(sb, "b1");

    expect(result).toEqual({ ok: true });
    expect(updateCalls[0]).toMatchObject({ intake_status: "brand_created" });
  });

  it("IPI-744 — clears analysis_lock_token/analysis_locked_at on rejection, so a delayed reanalyzeBrand restore can't later overwrite the restored status", async () => {
    const { sb, updateCalls } = mockSupabase({
      id: "b1",
      ai_profile: { _lifecycle: "scores_complete" },
      intake_status: "draft_ready",
    });
    const result = await discardBrandDraft(sb, "b1");

    expect(result).toEqual({ ok: true });
    expect(updateCalls).toHaveLength(1);
    expect(updateCalls[0]).toMatchObject({
      intake_status: "ready",
      analysis_lock_token: null,
      analysis_locked_at: null,
    });
  });
});
