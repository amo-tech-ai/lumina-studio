// IPI-130 — brand-intelligence tools unit tests
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@supabase/supabase-js", () => ({ createClient: vi.fn() }));
vi.mock("./edge", () => ({
  callEdgeFunction: vi.fn().mockResolvedValue({ runId: "run-abc123" }),
  EdgeFunctionError: class EdgeFunctionError extends Error {},
}));
// Stub the ALS export from the CopilotKit route so the tool can read a token in tests
vi.mock("@/app/api/copilotkit/[[...slug]]/route", () => ({
  _requestToken: { getStore: () => "tok" },
}));
vi.mock("@ai-sdk/openai-compatible", () => ({
  createOpenAICompatible: vi.fn(() => vi.fn(() => "mock-model")),
}));
vi.mock("@ai-sdk/google", () => ({
  createGoogleGenerativeAI: vi.fn(() => vi.fn(() => "mock-model")),
}));

import { createClient } from "@supabase/supabase-js";
import { callEdgeFunction } from "./edge";
import { getBrandProfile, getBrandScores, startBrandAnalysis } from "./brand-intelligence-tools";

// satisfy the service-role guard in adminClient()
process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
process.env.SUPABASE_SERVICE_ROLE_KEY = "test-key";

const BRAND_ID = "11111111-1111-1111-1111-111111111111";

const MOCK_BRAND = {
  id: BRAND_ID,
  name: "Everlane",
  brand_url: "https://everlane.com",
  intake_status: "ready",
  ai_profile: { overview: "Minimalist fashion brand" },
  ai_profile_draft: null,
};

const MOCK_SCORES = [
  { score_type: "visual_identity", score: 72, rationale: "Good palette" },
  { score_type: "social_presence", score: 58, rationale: "Low engagement" },
];

function makeMockClient() {
  return {
    from: vi.fn((table: string) => {
      if (table === "brands") {
        return { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), single: vi.fn().mockResolvedValue({ data: MOCK_BRAND, error: null }) };
      }
      // brand_scores — awaitable chain without .single()
      const chain = { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), order: vi.fn().mockResolvedValue({ data: MOCK_SCORES, error: null }) };
      return chain;
    }),
  };
}

beforeEach(() => {
  vi.mocked(createClient).mockReturnValue(makeMockClient() as never);
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
      from: vi.fn(() => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: { ...MOCK_BRAND, intake_status: "draft_ready" }, error: null }),
      })),
    } as never);
    const result = await getBrandProfile.execute!({ brandId: BRAND_ID }, {} as never);
    expect((result as { hasDraft: boolean }).hasDraft).toBe(true);
  });
});

describe("getBrandScores", () => {
  it("returns scores with computed overallScore", async () => {
    const result = await getBrandScores.execute!({ brandId: BRAND_ID }, {} as never);
    const r = result as Awaited<ReturnType<typeof getBrandScores.execute>>;
    expect(r!.scores).toHaveLength(2);
    expect(r!.overallScore).toBe(65); // (72+58)/2 rounded
  });
});

describe("startBrandAnalysis", () => {
  it("calls start-brand-crawl edge function using token from ALS (not LLM input)", async () => {
    const result = await startBrandAnalysis.execute!({ brandId: BRAND_ID }, {} as never);
    const r = result as Awaited<ReturnType<typeof startBrandAnalysis.execute>>;
    expect(r!.runId).toBe("run-abc123");
    expect(r!.message).toContain("analysis started");
    expect(vi.mocked(callEdgeFunction)).toHaveBeenCalledWith("start-brand-crawl", { brandId: BRAND_ID }, { accessToken: "tok" });
  });
});
