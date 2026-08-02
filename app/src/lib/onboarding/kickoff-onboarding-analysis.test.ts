import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  isAnalysisReviewable,
  kickoffOnboardingCrawl,
} from "./kickoff-onboarding-analysis";

const mockInvokeStartBrandCrawl = vi.fn();
const mockInvokeBrandIntelligence = vi.fn();

vi.mock("@/lib/onboarding", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/onboarding")>();
  return {
    ...actual,
    invokeStartBrandCrawl: (...args: unknown[]) => mockInvokeStartBrandCrawl(...args),
    invokeBrandIntelligence: (...args: unknown[]) => mockInvokeBrandIntelligence(...args),
  };
});

function supabaseWithIntake(intake_status: string | null) {
  return {
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: vi.fn().mockResolvedValue({
            data: intake_status == null ? null : { intake_status },
            error: null,
          }),
        }),
      }),
    }),
  };
}

describe("isAnalysisReviewable", () => {
  it("accepts scores_complete, draft_ready, ready", () => {
    expect(isAnalysisReviewable("scores_complete")).toBe(true);
    expect(isAnalysisReviewable("draft_ready")).toBe(true);
    expect(isAnalysisReviewable("ready")).toBe(true);
    expect(isAnalysisReviewable("crawl_running")).toBe(false);
    expect(isAnalysisReviewable("failed")).toBe(false);
  });
});

describe("kickoffOnboardingCrawl", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockInvokeStartBrandCrawl.mockResolvedValue({
      crawlId: "crawl-1",
      reused: false,
      firecrawlJobId: "fc-1",
    });
  });

  it("returns already_done without calling crawl when scores are ready", async () => {
    const result = await kickoffOnboardingCrawl(
      supabaseWithIntake("scores_complete") as never,
      "brand-1",
      "https://example.com",
    );
    expect(result).toEqual({ kind: "already_done", intakeStatus: "scores_complete" });
    expect(mockInvokeStartBrandCrawl).not.toHaveBeenCalled();
  });

  it("returns listen_only during analysis_running", async () => {
    const result = await kickoffOnboardingCrawl(
      supabaseWithIntake("analysis_running") as never,
      "brand-1",
      "https://example.com",
    );
    expect(result).toEqual({ kind: "listen_only", intakeStatus: "analysis_running" });
    expect(mockInvokeStartBrandCrawl).not.toHaveBeenCalled();
  });

  it("starts crawl with stable onboarding idempotency key", async () => {
    const supabase = supabaseWithIntake("brand_created");
    const result = await kickoffOnboardingCrawl(
      supabase as never,
      "brand-1",
      "https://example.com",
    );
    expect(result.kind).toBe("crawl_started");
    if (result.kind === "crawl_started") {
      expect(result.startBiNow).toBe(false);
      expect(result.crawlId).toBe("crawl-1");
    }
    expect(mockInvokeStartBrandCrawl).toHaveBeenCalledWith(
      supabase,
      "brand-1",
      "https://example.com",
      { idempotencyKey: "onboarding-brand-1" },
    );
  });

  it("asks for BI immediately when intake is already crawl_complete", async () => {
    const result = await kickoffOnboardingCrawl(
      supabaseWithIntake("crawl_complete") as never,
      "brand-1",
      "https://example.com",
    );
    expect(result.kind).toBe("crawl_started");
    if (result.kind === "crawl_started") {
      expect(result.startBiNow).toBe(true);
    }
  });

  it("falls through to BI when crawl start throws", async () => {
    mockInvokeStartBrandCrawl.mockRejectedValue(new Error("firecrawl down"));
    const result = await kickoffOnboardingCrawl(
      supabaseWithIntake("brand_created") as never,
      "brand-1",
      "https://example.com",
    );
    expect(result).toEqual({
      kind: "crawl_failed",
      error: "firecrawl down",
      startBiNow: true,
    });
  });

  it("reuses in-flight crawl without starting a second job (edge reused flag)", async () => {
    mockInvokeStartBrandCrawl.mockResolvedValue({
      crawlId: "crawl-existing",
      reused: true,
      firecrawlJobId: "fc-existing",
    });
    const result = await kickoffOnboardingCrawl(
      supabaseWithIntake("crawl_running") as never,
      "brand-1",
      "https://example.com",
    );
    expect(result).toEqual({
      kind: "crawl_started",
      crawlId: "crawl-existing",
      reused: true,
      startBiNow: false,
    });
    expect(mockInvokeStartBrandCrawl).toHaveBeenCalledTimes(1);
  });
});
