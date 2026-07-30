import { describe, expect, it, vi } from "vitest";
import { promoteBrandDraft } from "./promote-draft";

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
        upsert: vi.fn(async () => ({ error: null })),
      })),
    } as never,
    updateCalls,
  };
}

describe("promoteBrandDraft", () => {
  it("returns ok when draft already promoted (HITL ran before workflow resume)", async () => {
    const { sb } = mockSupabase({ id: "b1", ai_profile_draft: null, intake_status: "ready" });
    const result = await promoteBrandDraft(sb, "b1");
    expect(result).toEqual({ ok: true });
  });

  it("returns error when no draft and brand is not ready", async () => {
    const { sb } = mockSupabase({ id: "b1", ai_profile_draft: null, intake_status: "draft_ready" });
    const result = await promoteBrandDraft(sb, "b1");
    expect(result).toEqual({ ok: false, error: "No draft to apply" });
  });

  it("IPI-744 — clears analysis_lock_token/analysis_locked_at on approval, so a delayed reanalyzeBrand restore can't later overwrite 'ready'", async () => {
    const { sb, updateCalls } = mockSupabase({
      id: "b1",
      ai_profile_draft: { headline: "Nike" },
      intake_status: "draft_ready",
    });
    const result = await promoteBrandDraft(sb, "b1");

    expect(result).toEqual({ ok: true });
    expect(updateCalls).toHaveLength(1);
    expect(updateCalls[0]).toMatchObject({
      intake_status: "ready",
      analysis_lock_token: null,
      analysis_locked_at: null,
    });
  });
});
