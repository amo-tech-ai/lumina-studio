import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { countPendingApprovalBrands, resolveFeaturedApproval } from "./queries";

describe("countPendingApprovalBrands", () => {
  it("counts unique brand ids across pending drafts and draft_ready brands", () => {
    const count = countPendingApprovalBrands(
      [
        { brand_id: "a" },
        { brand_id: "b" },
        { brand_id: "a" },
      ],
      [{ id: "b" }, { id: "c" }],
    );
    expect(count).toBe(3);
  });

  it("returns zero when both sources are empty", () => {
    expect(countPendingApprovalBrands([], [])).toBe(0);
  });
});

const MOCK_LIVE_SCORES = [
  { score_type: "brand_identity", score: 72, details: null, source: "gemini", score_version: 1 },
  { score_type: "social_presence", score: 58, details: null, source: "gemini", score_version: 1 },
];

function makeMockSupabase(overrides: Record<string, unknown> = {}) {
  const mock = {
    from: vi.fn((table: string) => {
      if (table === "brand_scores") {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
        } as never;
      }
      return {};
    }),
    ...overrides,
  } as never;
  return mock;
}

function mockScoreQuery(mockSupabase: ReturnType<typeof makeMockSupabase>) {
  const chain = mockSupabase.from("brand_scores") as { select: ReturnType<typeof vi.fn>; eq: ReturnType<typeof vi.fn> };
  chain.eq.mockResolvedValue({ data: MOCK_LIVE_SCORES, error: null });
  return mockSupabase;
}

describe("resolveFeaturedApproval — draft profile reader", () => {
  const BRAND_ID = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
  const RUN_ID = "run-123";
  const brandNameById = new Map([[BRAND_ID, "Test Brand"]]);

  function newShapeDraft() {
    return {
      brand_id: BRAND_ID,
      draft_profile: { name: "Test Brand", tagline: "Editorial", _workflow_run_id: RUN_ID },
      draft_scores: [{ score_type: "visual_identity", score: 85, rationale: "Solid" }],
      status: "pending_approval",
    };
  }

  function oldShapeDraft() {
    return {
      brand_id: BRAND_ID,
      draft_profile: {
        _workflow_run_id: RUN_ID,
        profile: { name: "Test Brand", tagline: "Editorial" },
        scores: [{ score_type: "visual_identity", score: 85, rationale: "Solid" }],
      },
      draft_scores: [],
      status: "pending_approval",
    };
  }

  it("reads profile fields from new flat shape", async () => {
    const result = await resolveFeaturedApproval(
      mockScoreQuery(makeMockSupabase()),
      newShapeDraft() as never,
      brandNameById,
    );
    expect(result).not.toBeNull();
    expect(result!.draft.name).toBe("Test Brand");
    expect(result!.draft.tagline).toBe("Editorial");
  });

  it("reads profile from old wrapper shape (backward compat)", async () => {
    const result = await resolveFeaturedApproval(
      mockScoreQuery(makeMockSupabase()),
      oldShapeDraft() as never,
      brandNameById,
    );
    expect(result).not.toBeNull();
    expect(result!.draft.name).toBe("Test Brand");
    expect(result!.draft.tagline).toBe("Editorial");
  });

  it("reads draft_scores from dedicated column (new shape)", async () => {
    const result = await resolveFeaturedApproval(
      mockScoreQuery(makeMockSupabase()),
      newShapeDraft() as never,
      brandNameById,
    );
    expect(result).not.toBeNull();
    expect(result!.draftScores).toHaveLength(1);
    expect(result!.draftScores[0].score_type).toBe("visual_identity");
  });

  it("reads draft_scores from wrapper for old shape", async () => {
    const result = await resolveFeaturedApproval(
      mockScoreQuery(makeMockSupabase()),
      oldShapeDraft() as never,
      brandNameById,
    );
    expect(result).not.toBeNull();
    expect(result!.draftScores).toHaveLength(1);
    expect(result!.draftScores[0].score_type).toBe("visual_identity");
  });

  it("returns null when draft has no brand_id", async () => {
    const result = await resolveFeaturedApproval(
      mockScoreQuery(makeMockSupabase()),
      { draft_profile: { _workflow_run_id: RUN_ID } } as never,
      brandNameById,
    );
    expect(result).toBeNull();
  });

  it("returns null when draft has no _workflow_run_id", async () => {
    const result = await resolveFeaturedApproval(
      mockScoreQuery(makeMockSupabase()),
      { brand_id: BRAND_ID, draft_profile: { name: "Test" } } as never,
      brandNameById,
    );
    expect(result).toBeNull();
  });
});
