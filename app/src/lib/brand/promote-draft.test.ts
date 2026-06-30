import { describe, expect, it, vi } from "vitest";
import { promoteBrandDraft } from "./promote-draft";

function mockSupabase(brand: Record<string, unknown> | null, selectErr?: { message: string }) {
  return {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          maybeSingle: vi.fn(async () =>
            selectErr ? { data: null, error: selectErr } : { data: brand, error: null },
          ),
        })),
      })),
    })),
  } as never;
}

describe("promoteBrandDraft", () => {
  it("returns ok when draft already promoted (HITL ran before workflow resume)", async () => {
    const sb = mockSupabase({ id: "b1", ai_profile_draft: null, intake_status: "ready" });
    const result = await promoteBrandDraft(sb, "b1");
    expect(result).toEqual({ ok: true });
  });

  it("returns error when no draft and brand is not ready", async () => {
    const sb = mockSupabase({ id: "b1", ai_profile_draft: null, intake_status: "draft_ready" });
    const result = await promoteBrandDraft(sb, "b1");
    expect(result).toEqual({ ok: false, error: "No draft to apply" });
  });
});
