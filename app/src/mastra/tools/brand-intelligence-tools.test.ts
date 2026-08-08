// IPI-130 · IPI-260 — brand-intelligence tools unit tests
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("@supabase/supabase-js", () => ({ createClient: vi.fn() }));
vi.mock("./edge", () => ({
  callEdgeFunction: vi.fn().mockResolvedValue({ runId: "run-abc123" }),
  EdgeFunctionError: class EdgeFunctionError extends Error {},
}));
const mockGetStore = vi.fn(() => "tok");
vi.mock("@/lib/request-token", () => ({
  requestToken: { getStore: (...args: unknown[]) => mockGetStore(...args) },
}));
vi.mock("@/app/api/_lib/process-draft-approval", () => ({
  PENDING_DRAFT_STATUS: "pending_approval",
  processBrandIntelligenceDraftApproval: vi.fn().mockResolvedValue({
    ok: true,
    approved: true,
    brandId: "11111111-1111-1111-1111-111111111111",
  }),
}));
vi.mock("@ai-sdk/openai-compatible", () => ({
  createOpenAICompatible: vi.fn(() => vi.fn(() => "mock-model")),
}));
vi.mock("@ai-sdk/google", () => ({
  createGoogleGenerativeAI: vi.fn(() => vi.fn(() => "mock-model")),
}));

import { createClient } from "@supabase/supabase-js";
import { callEdgeFunction } from "./edge";
import { processBrandIntelligenceDraftApproval } from "@/app/api/_lib/process-draft-approval";
import {
  approveDraftTool,
  explainPillarTool,
  getBrandProfile,
  getBrandScores,
  normalizePillar,
  startBrandAnalysis,
} from "./brand-intelligence-tools";

const BRAND_ID = "11111111-1111-1111-1111-111111111111";

beforeEach(() => {
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://test.supabase.co");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "test-anon-key");
  vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "test-key");
});

afterEach(() => {
  vi.unstubAllEnvs();
});

const MOCK_BRAND = {
  id: BRAND_ID,
  name: "Everlane",
  brand_url: "https://everlane.com",
  intake_status: "ready",
  ai_profile: { overview: "Minimalist fashion brand" },
  ai_profile_draft: null,
};

const MOCK_SCORES = [
  { score_type: "visual", score: 72, rationale: "Good palette" },
  { score_type: "audience", score: 58, rationale: "Low engagement" },
  { score_type: "consistency", score: 70, rationale: "Consistent messaging" },
  { score_type: "commerce_readiness", score: 80, rationale: "Ready to sell" },
];

const MOCK_PILLAR = {
  score_type: "visual",
  score: 72,
  details: {
    confidence: 0.82,
    evidence: ["Palette aligns with brand guidelines", "Hero imagery is consistent"],
  },
  source: "brand-intelligence",
};

const MOCK_USER_ID = "user-123";
const MOCK_ORG_MEMBER = { org_id: "org-123" };

function orgMembersMock(data: unknown = MOCK_ORG_MEMBER) {
  return {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue({ data, error: null }),
  };
}

function brandsMock(data: unknown, singleData?: unknown) {
  const single = singleData ?? data;
  return {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: single, error: null }),
    maybeSingle: vi.fn().mockResolvedValue({ data, error: null }),
  };
}

export type MockClient = {
  auth: {
    getUser: ReturnType<typeof vi.fn>;
  };
  from: ReturnType<typeof vi.fn>;
  [key: string]: unknown;
};

function makeMockClient(overrides: Partial<MockClient> = {}): MockClient {
  const client = {
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: { id: MOCK_USER_ID } }, error: null }),
    },
    from: vi.fn((table: string) => {
      if (table === "brands") {
        return brandsMock(MOCK_BRAND);
      }
      if (table === "org_members") {
        return orgMembersMock();
      }
      if (table === "brand_intake_drafts") {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({
            data: { draft_profile: { _workflow_run_id: "run-draft-1" } },
            error: null,
          }),
        };
      }
      if (table === "brand_scores") {
        const chain = {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockResolvedValue({ data: MOCK_SCORES, error: null }),
          maybeSingle: vi.fn().mockResolvedValue({ data: MOCK_PILLAR, error: null }),
        };
        return chain;
      }
      return {};
    }),
    ...overrides,
  };
  return client;
}

beforeEach(() => {
  mockGetStore.mockReturnValue("tok");
  vi.mocked(createClient).mockReturnValue(makeMockClient() as never);
  vi.mocked(processBrandIntelligenceDraftApproval).mockResolvedValue({
    ok: true,
    approved: true,
    brandId: BRAND_ID,
  });
});

describe("normalizePillar", () => {
  it("maps human labels to score_type keys", () => {
    expect(normalizePillar("Visual Identity")).toBe("visual");
    expect(normalizePillar("commerce readiness")).toBe("commerce_readiness");
    expect(normalizePillar("social_presence")).toBe("social_presence");
  });
});

describe("getBrandProfile", () => {
  it("maps brand row to profile summary + flags", async () => {
    const result = await getBrandProfile.execute!({ brandId: BRAND_ID }, {} as never);
    const r = result as Awaited<ReturnType<typeof getBrandProfile.execute>>;
    expect(r!.name).toBe("Everlane");
    expect(r!.hasProfile).toBe(true);
    expect(r!.hasDraft).toBe(false);
    expect(r!.profileSummary).toBe("Minimalist fashion brand");
  });

  it("sets hasDraft=true when intake_status=draft_ready", async () => {
    vi.mocked(createClient).mockReturnValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: { id: MOCK_USER_ID } }, error: null }),
      },
      from: vi.fn((table: string) => {
        if (table === "brands") {
          return brandsMock({ ...MOCK_BRAND, intake_status: "draft_ready" }, { ...MOCK_BRAND, intake_status: "draft_ready" });
        }
        if (table === "org_members") {
          return orgMembersMock();
        }
        return { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), single: vi.fn().mockResolvedValue({ data: null, error: null }), maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }) };
      }),
    } as never);
    const result = await getBrandProfile.execute!({ brandId: BRAND_ID }, {} as never);
    expect((result as { hasDraft: boolean }).hasDraft).toBe(true);
  });
});

describe("getBrandScores", () => {
  it("returns scores with computed overallScore", async () => {
    const result = await getBrandScores.execute!({ brandId: BRAND_ID }, {} as never);
    const r = result as Awaited<ReturnType<typeof getBrandScores.execute>>;
    expect(r!.scores).toHaveLength(4);
    expect(r!.overallScore).toBe(70);
  });

  it("returns null overallScore when base pillars are incomplete", async () => {
    vi.mocked(createClient).mockReturnValue(
      makeMockClient({
        from: vi.fn((table: string) => {
          if (table === "brands") return { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), maybeSingle: vi.fn().mockResolvedValue({ data: MOCK_BRAND, error: null }) };
          if (table === "brand_scores") {
            return {
              select: vi.fn().mockReturnThis(),
              eq: vi.fn().mockReturnThis(),
              order: vi.fn().mockResolvedValue({
                data: [
                  { score_type: "visual", score: 72, rationale: "Good palette" },
                  { score_type: "audience", score: 58, rationale: "Low engagement" },
                ],
                error: null,
              }),
              maybeSingle: vi.fn().mockResolvedValue({ data: MOCK_PILLAR, error: null }),
            };
          }
          if (table === "org_members") {
            return orgMembersMock();
          }
          return {};
        }),
      }) as never,
    );
    const result = await getBrandScores.execute!({ brandId: BRAND_ID }, {} as never);
    const r = result as Awaited<ReturnType<typeof getBrandScores.execute>>;
    expect(r!.scores).toHaveLength(2);
    expect(r!.overallScore).toBeNull();
  });

  it("returns null overallScore when no scores exist", async () => {
    vi.mocked(createClient).mockReturnValue(
      makeMockClient({
        from: vi.fn((table: string) => {
          if (table === "brands") return { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), maybeSingle: vi.fn().mockResolvedValue({ data: MOCK_BRAND, error: null }) };
          if (table === "brand_scores") {
            return {
              select: vi.fn().mockReturnThis(),
              eq: vi.fn().mockReturnThis(),
              order: vi.fn().mockResolvedValue({ data: [], error: null }),
              maybeSingle: vi.fn().mockResolvedValue({ data: MOCK_PILLAR, error: null }),
            };
          }
          if (table === "org_members") {
            return orgMembersMock();
          }
          return {};
        }),
      }) as never,
    );
    const result = await getBrandScores.execute!({ brandId: BRAND_ID }, {} as never);
    const r = result as Awaited<ReturnType<typeof getBrandScores.execute>>;
    expect(r!.scores).toHaveLength(0);
    expect(r!.overallScore).toBeNull();
  });
});

describe("explainPillarTool", () => {
  it("returns EvidenceBlock-shaped output for a pillar", async () => {
    const result = await explainPillarTool.execute!(
      { brandId: BRAND_ID, pillar: "visual" },
      {} as never,
    );
    const r = result as Awaited<ReturnType<typeof explainPillarTool.execute>>;
    expect(r!.title).toBe("Visual");
    expect(r!.score).toBe(72);
    expect(r!.confidence).toBe(82);
    expect(r!.potential).toBeGreaterThan(r!.score);
    expect(r!.why).toContain("Palette aligns");
    expect(r!.evidence).toHaveLength(2);
    expect(r!.suggestions?.length).toBeGreaterThan(0);
  });

  it("throws when pillar score is missing", async () => {
    vi.mocked(createClient).mockReturnValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: { id: MOCK_USER_ID } }, error: null }),
      },
      from: vi.fn((table: string) => {
        if (table === "brand_scores") {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
          };
        }
        if (table === "brands") {
          return brandsMock(MOCK_BRAND);
        }
        if (table === "org_members") {
          return orgMembersMock();
        }
        return makeMockClient().from(table);
      }),
    } as never);

    await expect(
      explainPillarTool.execute!({ brandId: BRAND_ID, pillar: "visual" }, {} as never),
    ).rejects.toThrow(/No score found/);
  });
});

describe("approveDraftTool", () => {
  it("calls shared draft approval with workflow run id from pending draft", async () => {
    vi.mocked(createClient).mockImplementation(((url: string, key: string) => {
      if (key === "test-anon-key") {
        return {
          auth: {
            getUser: vi.fn().mockResolvedValue({
              data: { user: { id: "user-1" } },
              error: null,
            }),
          },
        };
      }
      return makeMockClient();
    }) as never);

    const result = await approveDraftTool.execute!(
      { brandId: BRAND_ID, approved: true },
      {} as never,
    );
    const r = result as Awaited<ReturnType<typeof approveDraftTool.execute>>;
    expect(r!.ok).toBe(true);
    expect(r!.approved).toBe(true);
  expect(vi.mocked(processBrandIntelligenceDraftApproval)).toHaveBeenCalledWith({
    runId: "run-draft-1",
    approved: true,
    operatorId: "user-1",
    expectedBrandId: BRAND_ID,
  });
  });

  it("throws when access token is missing", async () => {
    mockGetStore.mockReturnValueOnce(undefined as never);

    await expect(
      approveDraftTool.execute!({ brandId: BRAND_ID, approved: true }, {} as never),
    ).rejects.toThrow(/Access token not available/);
  });

  it("throws when no pending draft exists", async () => {
    vi.mocked(createClient).mockImplementation(((url: string, key: string) => {
      if (key === "test-anon-key") {
        return {
          auth: {
            getUser: vi.fn().mockResolvedValue({
              data: { user: { id: "user-1" } },
              error: null,
            }),
          },
        };
      }
      return {
        from: vi.fn((table: string) => {
          if (table === "brand_intake_drafts") {
            return {
              select: vi.fn().mockReturnThis(),
              eq: vi.fn().mockReturnThis(),
              maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
            };
          }
          return makeMockClient().from(table);
        }),
      };
    }) as never);

    await expect(
      approveDraftTool.execute!({ brandId: BRAND_ID, approved: false }, {} as never),
    ).rejects.toThrow(/No pending draft/);
  });
});

describe("tenant isolation (cross-org denial)", () => {
  const FOREIGN_BRAND_ID = "22222222-2222-2222-2222-222222222222";

   function makeForeignClient() {
     return {
       auth: {
         getUser: vi.fn().mockResolvedValue({ data: { user: { id: MOCK_USER_ID } }, error: null }),
       },
       from: vi.fn((table: string) => {
         if (table === "brands") {
           return brandsMock(null);
         }
         if (table === "org_members") {
           return orgMembersMock();
         }
          if (table === "brand_scores") {
            return {
              select: vi.fn().mockReturnThis(),
              eq: vi.fn().mockReturnThis(),
              order: vi.fn().mockResolvedValue({ data: [], error: null }),
              maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
            };
          }
         return {};
       }),
     } as never;
   }

  beforeEach(() => {
    mockGetStore.mockReturnValue("tok");
    vi.mocked(createClient).mockReturnValue(makeForeignClient());
  });

  it("getBrandProfile rejects when brand is outside the operator org", async () => {
    await expect(
      getBrandProfile.execute!({ brandId: FOREIGN_BRAND_ID }, {} as never),
    ).rejects.toThrow(/Brand not found in operator organization/);
  });

  it("getBrandScores returns empty scores when brand is outside the operator org", async () => {
    const brandScoresEq = vi.fn().mockReturnThis();
    vi.mocked(createClient).mockReturnValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: { id: MOCK_USER_ID } }, error: null }),
      },
      from: vi.fn((table: string) => {
        if (table === "brands") {
          return brandsMock(null);
        }
        if (table === "org_members") {
          return orgMembersMock();
        }
        if (table === "brand_scores") {
          return {
            select: vi.fn().mockReturnThis(),
            eq: brandScoresEq,
            order: vi.fn().mockResolvedValue({ data: [], error: null }),
            maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
          };
        }
        return {};
      }),
    } as never);
    const result = await getBrandScores.execute!({ brandId: FOREIGN_BRAND_ID }, {} as never);
    const r = result as Awaited<ReturnType<typeof getBrandScores.execute>>;
    expect(brandScoresEq).toHaveBeenCalledWith("brand_id", FOREIGN_BRAND_ID);
    expect(r!.scores).toHaveLength(0);
    expect(r!.overallScore).toBeNull();
  });

  it("explainPillarTool rejects when brand is outside the operator org", async () => {
    await expect(
      explainPillarTool.execute!(
        { brandId: FOREIGN_BRAND_ID, pillar: "visual" },
        {} as never,
      ),
    ).rejects.toThrow(/No score found/);
  });

  it("getBrandProfile allows brand in a non-first org membership", async () => {
    const SECONDARY_ORG_MEMBER = { org_id: "org-456" };
    const SECONDARY_ORG_BRAND = { ...MOCK_BRAND, org_id: "org-456" };
    vi.mocked(createClient).mockReturnValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: { id: MOCK_USER_ID } }, error: null }),
      },
      from: vi.fn((table: string) => {
        if (table === "brands") {
          return brandsMock(SECONDARY_ORG_BRAND, SECONDARY_ORG_BRAND);
        }
        if (table === "org_members") {
          return orgMembersMock(SECONDARY_ORG_MEMBER);
        }
        if (table === "brand_intake_drafts") {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
          };
        }
        return {};
      }),
    } as never);
    const result = await getBrandProfile.execute!({ brandId: BRAND_ID }, {} as never);
    const r = result as Awaited<ReturnType<typeof getBrandProfile.execute>>;
    expect(r!.name).toBe("Everlane");
  });
});

describe("startBrandAnalysis", () => {
  it("calls start-brand-crawl edge function using token from ALS (not LLM input)", async () => {
    const result = await startBrandAnalysis.execute!({ brandId: BRAND_ID }, {} as never);
    const r = result as Awaited<ReturnType<typeof startBrandAnalysis.execute>>;
    expect(r!.runId).toBe("run-abc123");
    expect(r!.message).toContain("analysis started");
    expect(vi.mocked(callEdgeFunction)).toHaveBeenCalledWith(
      "start-brand-crawl",
      { brandId: BRAND_ID },
      { accessToken: "tok" },
    );
  });
});

describe("brandIntelligenceTools registry", () => {
  it("exports explainPillar and approveDraft for brand-intelligence agent", async () => {
    const { brandIntelligenceTools } = await import("./brand-intelligence-tools");
    expect(brandIntelligenceTools).toHaveProperty("explainPillar");
    expect(brandIntelligenceTools).toHaveProperty("approveDraft");
    expect(Object.keys(brandIntelligenceTools)).toEqual([
      "getBrandProfile",
      "getBrandScores",
      "explainPillar",
      "approveDraft",
      "startBrandAnalysis",
    ]);
  });
});
