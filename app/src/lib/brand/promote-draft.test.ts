import { describe, expect, it, vi } from "vitest";
import { promoteBrandDraft, resolvePromoteScoreRows } from "./promote-draft";

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
      ai_profile_draft: validDraft(),
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

  it("IPI-835 · D — refuses promote when Brand DNA fails the IPI-834 contract", async () => {
    const { sb, updateCalls } = mockSupabase({
      id: "b1",
      ai_profile_draft: { headline: "Nike" },
      intake_status: "draft_ready",
    });
    const result = await promoteBrandDraft(sb, "b1");
    expect(result).toEqual({ ok: false, error: "Brand DNA is incomplete or invalid" });
    expect(updateCalls).toHaveLength(0);
  });

  it("IPI-835 · D — refuses promote when base scores are missing", async () => {
    const draft = validDraft();
    delete (draft as { scores?: unknown }).scores;
    const { sb, updateCalls } = mockSupabase({
      id: "b1",
      ai_profile_draft: draft,
      intake_status: "draft_ready",
    });
    // Contract also fails without scores — either message is a refuse.
    const result = await promoteBrandDraft(sb, "b1");
    expect(result.ok).toBe(false);
    expect(updateCalls).toHaveLength(0);
  });

  it("resolvePromoteScoreRows falls back from contract scores when _draft_scores is absent", () => {
    const rows = resolvePromoteScoreRows(validDraft());
    expect(rows).not.toBeNull();
    expect(rows?.map((r) => r.score_type).sort()).toEqual(
      ["audience", "commerce_readiness", "consistency", "visual"].sort(),
    );
  });
});

function validDraft() {
  return {
    schemaVersion: 2,
    name: "Nike",
    sourceUrl: "https://nike.example",
    tagline: {
      value: "Just Do It",
      evidence: [{ sourceUrl: "https://nike.example", quote: "Just Do It" }],
    },
    category: {
      value: "Athletic",
      evidence: [{ sourceUrl: "https://nike.example", quote: "Athletic" }],
    },
    targetAudience: {
      value: "Athletes",
      evidence: [{ sourceUrl: "https://nike.example", quote: "Athletes" }],
    },
    visualIdentity: { colors: ["#111"], mood: "Bold" },
    scores: { visual: 80, audience: 80, consistency: 80, commerce_readiness: 70 },
  };
}
