import { describe, expect, it, vi } from "vitest";

import {
  countPendingApprovalBrands,
  fetchCommandCenterKpis,
  resolveFeaturedApproval,
} from "./queries";

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

const USER_ID = "00000000-0000-4000-8000-000000000001";
const KPI_BRAND_ID = "00000000-0000-4000-8000-000000000002";
const KPI_OTHER_BRAND_ID = "00000000-0000-4000-8000-000000000003";
const KPI_RUN_ID = "run_abc123";

const BRANDS_SELECT = "id, name, brand_url, intake_status, created_at";
const DRAFT_READY_SELECT = "id, name";
const HERO_SCORES_SELECT = "score_type, score";
const LIVE_SCORES_SELECT = "score_type, score, details, source, score_version";
const SHOOTS_SELECT = "id, name, status, dna_score, updated_at";
const SHOOT_COUNT_SELECT = "id";
const DRAFTS_SELECT = "id, brand_id, draft_profile, draft_scores, status, updated_at";

type QueryResult = { data?: unknown; count?: number; error?: { message: string } | null };

/** Chainable Supabase stub keyed by `table|select` — resolves the configured result. */
function makeQueryStub(results: Record<string, QueryResult>) {
  const selects: string[] = [];

  function chain(result: QueryResult) {
    const builder: Record<string, unknown> = {};
    for (const method of ["eq", "in", "order", "limit"]) {
      builder[method] = vi.fn(() => builder);
    }
    builder.then = (
      onFulfilled: (value: QueryResult) => unknown,
      onRejected?: (reason: unknown) => unknown,
    ) => Promise.resolve({ error: null, ...result }).then(onFulfilled, onRejected);
    return builder;
  }

  const supabase = {
    from: vi.fn((table: string) => ({
      select: vi.fn((columns: string) => {
        const key = `${table}|${columns}`;
        selects.push(key);
        const result = results[key];
        if (!result) throw new Error(`unexpected query ${key}`);
        return chain(result);
      }),
    })),
  } as never;

  return { supabase, selects };
}

const BASE_SCORES = [
  { score_type: "visual", score: 80 },
  { score_type: "audience", score: 70 },
  { score_type: "consistency", score: 60 },
  { score_type: "commerce_readiness", score: 50 },
];

function kpiResults(overrides: Record<string, QueryResult> = {}) {
  return {
    [`brands|${BRANDS_SELECT}`]: {
      data: [
        {
          id: KPI_BRAND_ID,
          name: "Aurelia",
          brand_url: "https://aurelia.example",
          intake_status: "ready",
          created_at: "2026-07-01T00:00:00.000Z",
        },
        {
          id: KPI_OTHER_BRAND_ID,
          name: "Nordwell",
          brand_url: null,
          intake_status: "draft_ready",
          created_at: "2026-06-01T00:00:00.000Z",
        },
      ],
    },
    [`brand_scores|${HERO_SCORES_SELECT}`]: { data: BASE_SCORES },
    [`shoot_portfolio_view|${SHOOTS_SELECT}`]: {
      data: [
        {
          id: "shoot-1",
          name: "SS26 Lookbook",
          status: "planned",
          dna_score: 88,
          updated_at: "2026-07-02T00:00:00.000Z",
        },
        { id: null, name: "Broken", status: "planned", dna_score: null, updated_at: null },
      ],
    },
    [`shoot_portfolio_view|${SHOOT_COUNT_SELECT}`]: { count: 4 },
    [`brand_intake_drafts|${DRAFTS_SELECT}`]: { data: [] },
    [`brands|${DRAFT_READY_SELECT}`]: { data: [{ id: KPI_OTHER_BRAND_ID, name: "Nordwell" }] },
    ...overrides,
  };
}

describe("fetchCommandCenterKpis", () => {
  it("builds the dashboard payload from the newest brand", async () => {
    const { supabase } = makeQueryStub(kpiResults());

    await expect(fetchCommandCenterKpis(supabase, USER_ID)).resolves.toEqual({
      heroBrand: {
        id: KPI_BRAND_ID,
        name: "Aurelia",
        brandUrl: "https://aurelia.example",
        intakeStatus: "ready",
        dnaScore: 65,
      },
      brandCount: 2,
      shootCount: 4,
      pendingApprovalCount: 1,
      featuredApproval: null,
      recentShoots: [
        {
          id: "shoot-1",
          name: "SS26 Lookbook",
          status: "planned",
          dnaScore: 88,
          updatedAt: "2026-07-02T00:00:00.000Z",
        },
      ],
      realtimeStatus: "live",
      fetchError: null,
    });
  });

  it("skips the score and shoot reads when the user has no brands", async () => {
    const { supabase, selects } = makeQueryStub(
      kpiResults({ [`brands|${BRANDS_SELECT}`]: { data: [] } }),
    );

    await expect(fetchCommandCenterKpis(supabase, USER_ID)).resolves.toMatchObject({
      heroBrand: null,
      brandCount: 0,
      shootCount: 0,
      recentShoots: [],
      realtimeStatus: "live",
      fetchError: null,
    });
    expect(selects).not.toContain(`shoot_portfolio_view|${SHOOTS_SELECT}`);
    expect(selects).not.toContain(`brand_scores|${HERO_SCORES_SELECT}`);
  });

  it("returns a stale payload carrying the brands error message", async () => {
    const { supabase } = makeQueryStub(
      kpiResults({
        [`brands|${BRANDS_SELECT}`]: { data: null, error: { message: "permission denied" } },
      }),
    );

    await expect(fetchCommandCenterKpis(supabase, USER_ID)).resolves.toEqual({
      heroBrand: null,
      brandCount: 0,
      shootCount: 0,
      pendingApprovalCount: 0,
      featuredApproval: null,
      recentShoots: [],
      realtimeStatus: "stale",
      fetchError: "permission denied",
    });
  });

  it.each([
    ["hero scores", `brand_scores|${HERO_SCORES_SELECT}`, "scores failed"],
    ["recent shoots", `shoot_portfolio_view|${SHOOTS_SELECT}`, "shoots failed"],
    ["shoot count", `shoot_portfolio_view|${SHOOT_COUNT_SELECT}`, "count failed"],
    ["pending drafts", `brand_intake_drafts|${DRAFTS_SELECT}`, "drafts failed"],
    ["draft-ready brands", `brands|${DRAFT_READY_SELECT}`, "draft_ready failed"],
  ])("surfaces a %s failure as a stale payload", async (_label, key, message) => {
    const { supabase } = makeQueryStub(kpiResults({ [key]: { data: null, error: { message } } }));

    await expect(fetchCommandCenterKpis(supabase, USER_ID)).resolves.toMatchObject({
      realtimeStatus: "stale",
      fetchError: message,
    });
  });

  it("catches an unexpected throw and reports its message", async () => {
    const supabase = {
      from: () => {
        throw new Error("connection reset");
      },
    } as never;

    await expect(fetchCommandCenterKpis(supabase, USER_ID)).resolves.toMatchObject({
      realtimeStatus: "stale",
      fetchError: "connection reset",
    });
  });

  it("zeroes the DNA score when a base score is missing", async () => {
    const { supabase } = makeQueryStub(
      kpiResults({
        [`brand_scores|${HERO_SCORES_SELECT}`]: { data: [{ score_type: "visual", score: 90 }] },
      }),
    );

    const result = await fetchCommandCenterKpis(supabase, USER_ID);

    expect(result.heroBrand?.dnaScore).toBe(0);
  });

  it("features the newest pending draft and counts it as pending", async () => {
    const { supabase } = makeQueryStub(
      kpiResults({
        [`brand_intake_drafts|${DRAFTS_SELECT}`]: {
          data: [
            {
              id: "draft-1",
              brand_id: KPI_BRAND_ID,
              draft_profile: { _workflow_run_id: KPI_RUN_ID, name: "Aurelia Draft" },
              draft_scores: BASE_SCORES,
              status: "pending_approval",
              updated_at: "2026-07-03T00:00:00.000Z",
            },
          ],
        },
        [`brand_scores|${LIVE_SCORES_SELECT}`]: { data: BASE_SCORES },
      }),
    );

    const result = await fetchCommandCenterKpis(supabase, USER_ID);

    expect(result.featuredApproval).toMatchObject({
      brandId: KPI_BRAND_ID,
      brandName: "Aurelia",
      runId: KPI_RUN_ID,
      draft: { name: "Aurelia Draft" },
    });
    expect(result.pendingApprovalCount).toBe(2);
  });
});

describe("resolveFeaturedApproval — live scores and score normalization", () => {
  const draft = {
    brand_id: KPI_BRAND_ID,
    draft_profile: { _workflow_run_id: KPI_RUN_ID },
    draft_scores: BASE_SCORES,
  };

  function liveScoresStub(result: QueryResult) {
    return makeQueryStub({ [`brand_scores|${LIVE_SCORES_SELECT}`]: result }).supabase;
  }

  it("returns null without a draft", async () => {
    await expect(
      resolveFeaturedApproval(liveScoresStub({ data: [] }), undefined, new Map()),
    ).resolves.toBeNull();
  });

  it("returns null when the live scores read fails", async () => {
    await expect(
      resolveFeaturedApproval(
        liveScoresStub({ data: null, error: { message: "rls denied" } }),
        draft,
        new Map(),
      ),
    ).resolves.toBeNull();
  });

  it("drops the legacy dna_readiness row and falls back to a generic brand name", async () => {
    const result = await resolveFeaturedApproval(
      liveScoresStub({ data: [...BASE_SCORES, { score_type: "dna_readiness", score: 12 }] }),
      draft,
      new Map(),
    );

    expect(result?.brandName).toBe("Brand");
    expect(result?.liveScores.map((s) => s.score_type)).toEqual([
      "visual",
      "audience",
      "consistency",
      "commerce_readiness",
    ]);
  });

  it("drops malformed draft score rows", async () => {
    const result = await resolveFeaturedApproval(
      liveScoresStub({ data: BASE_SCORES }),
      {
        ...draft,
        draft_scores: [
          { score_type: "visual", score: 55 },
          { score_type: "audience", score: "high" },
          null,
          "nope",
        ],
      },
      new Map([[KPI_BRAND_ID, "Aurelia"]]),
    );

    expect(result?.draftScores).toEqual([{ score_type: "visual", score: 55 }]);
  });
});
