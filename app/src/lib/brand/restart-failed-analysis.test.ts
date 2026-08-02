import { beforeEach, describe, expect, it, vi } from "vitest";

const mockTryAcquire = vi.fn();
const mockRestore = vi.fn();
const mockRelease = vi.fn();
const mockInvokeCrawl = vi.fn();
const mockInvokeBi = vi.fn();
const mockWaitCrawl = vi.fn();
const mockAdminFrom = vi.fn();

vi.mock("@/lib/brand/analysis-lock", () => ({
  tryAcquireAnalysisLock: (...args: unknown[]) => mockTryAcquire(...args),
  restoreAnalysisStatusIfOwned: (...args: unknown[]) => mockRestore(...args),
  releaseAnalysisLockIfOwned: (...args: unknown[]) => mockRelease(...args),
}));

vi.mock("@/lib/onboarding", () => ({
  invokeStartBrandCrawl: (...args: unknown[]) => mockInvokeCrawl(...args),
  invokeBrandIntelligence: (...args: unknown[]) => mockInvokeBi(...args),
  waitForCrawlCompletion: (...args: unknown[]) => mockWaitCrawl(...args),
}));

vi.mock("@/app/api/_lib/supabase-admin", () => ({
  createSupabaseAdminClient: () => ({ from: (...args: unknown[]) => mockAdminFrom(...args) }),
}));

import {
  restartFailedBrandAnalysis,
  restartHttpStatus,
} from "./restart-failed-analysis";

const BRAND_ID = "00000000-0000-4000-8000-000000000901";
const ORG_ID = "00000000-0000-4000-8000-000000000902";
const ACTOR = "00000000-0000-4000-8000-000000000903";
const URL = "https://aureliajewelry.com";

type BrandRow = {
  id: string;
  name: string;
  brand_url: string | null;
  org_id: string | null;
  user_id: string | null;
  intake_status: string | null;
};

type CrawlRow = { id: string; job_status: string; source_url: string };

function makeSupabase(opts: {
  brand?: BrandRow | null;
  brandError?: { code: string } | null;
  canEdit?: boolean;
  roleError?: { message: string; code?: string } | null;
  afterIntake?: string;
  attemptLogError?: { code: string } | null;
  onBrandUpdate?: () => void;
}) {
  const brand =
    opts.brand === undefined
      ? {
          id: BRAND_ID,
          name: "Aurelia",
          brand_url: URL,
          org_id: ORG_ID,
          user_id: "owner",
          intake_status: "failed",
        }
      : opts.brand;

  const inserts: unknown[] = [];
  const brandUpdates: unknown[] = [];
  let brandSelectCount = 0;

  const rpc = vi.fn(async (name: string) => {
    if (name === "is_org_editor_or_above") {
      if (opts.roleError) return { data: null, error: opts.roleError };
      return { data: opts.canEdit ?? true, error: null };
    }
    throw new Error(`unexpected rpc ${name}`);
  });

  const from = (table: string) => {
    if (table === "brands") {
      return {
        select: () => ({
          eq: () => ({
            maybeSingle: async () => {
              if (opts.brandError) return { data: null, error: opts.brandError };
              brandSelectCount += 1;
              if (!brand) return { data: null, error: null };
              // 1st read = authz/stage; later reads = post-BI intake
              if (brandSelectCount === 1) {
                return { data: brand, error: null };
              }
              return {
                data: {
                  ...brand,
                  intake_status: opts.afterIntake ?? brand.intake_status,
                },
                error: null,
              };
            },
          }),
        }),
        update: (row: unknown) => ({
          eq: async () => {
            brandUpdates.push(row);
            opts.onBrandUpdate?.();
            return { data: null, error: null };
          },
        }),
      };
    }
    if (table === "ai_agent_logs") {
      return {
        insert: async (row: unknown) => {
          if (opts.attemptLogError) {
            return { data: null, error: opts.attemptLogError };
          }
          inserts.push(row);
          return { data: null, error: null };
        },
      };
    }
    throw new Error(`unexpected table ${table}`);
  };

  return { from, rpc, _inserts: inserts, _brandUpdates: brandUpdates };
}

function stubAdminCrawls(crawls: CrawlRow[]) {
  mockAdminFrom.mockImplementation((table: string) => {
    if (table !== "brand_crawls") throw new Error(`unexpected admin table ${table}`);
    return {
      select: () => ({
        eq: () => ({
          order: async () => ({ data: crawls, error: null }),
        }),
      }),
    };
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  mockTryAcquire.mockResolvedValue({
    ok: true,
    runToken: "token-1",
    priorStatus: "failed",
  });
  mockRestore.mockResolvedValue(true);
  mockRelease.mockResolvedValue(undefined);
  mockInvokeCrawl.mockResolvedValue({ crawlId: "crawl-new", reused: false });
  mockInvokeBi.mockResolvedValue({ brandId: BRAND_ID });
  mockWaitCrawl.mockResolvedValue("complete");
  stubAdminCrawls([]);
});

describe("restartFailedBrandAnalysis — authz", () => {
  it("rejects viewer before any provider call", async () => {
    const sb = makeSupabase({ canEdit: false });
    const result = await restartFailedBrandAnalysis({
      supabase: sb as never,
      actorId: ACTOR,
      brandId: BRAND_ID,
    });
    expect(result).toMatchObject({ ok: false, code: "unauthorized" });
    expect(mockInvokeCrawl).not.toHaveBeenCalled();
    expect(mockInvokeBi).not.toHaveBeenCalled();
  });

  it("rejects personal-brand non-owner before provider call", async () => {
    const sb = makeSupabase({
      brand: {
        id: BRAND_ID,
        name: "Personal",
        brand_url: URL,
        org_id: null,
        user_id: "someone-else",
        intake_status: "failed",
      },
    });
    const result = await restartFailedBrandAnalysis({
      supabase: sb as never,
      actorId: ACTOR,
      brandId: BRAND_ID,
    });
    expect(result).toMatchObject({ ok: false, code: "unauthorized" });
    expect(mockInvokeCrawl).not.toHaveBeenCalled();
  });

  it("allows personal-brand owner and still discovers crawls via admin", async () => {
    stubAdminCrawls([{ id: "c1", job_status: "failed", source_url: URL }]);
    const sb = makeSupabase({
      brand: {
        id: BRAND_ID,
        name: "Personal",
        brand_url: URL,
        org_id: null,
        user_id: ACTOR,
        intake_status: "failed",
      },
      afterIntake: "draft_ready",
    });
    const result = await restartFailedBrandAnalysis({
      supabase: sb as never,
      actorId: ACTOR,
      brandId: BRAND_ID,
    });
    expect(result.ok).toBe(true);
    expect(mockAdminFrom).toHaveBeenCalledWith("brand_crawls");
    expect(mockInvokeCrawl).toHaveBeenCalled();
    expect(mockWaitCrawl).toHaveBeenCalled();
    expect(mockInvokeBi).toHaveBeenCalled();
  });
});

describe("restartFailedBrandAnalysis — state + URL", () => {
  it("rejects invalid URL", async () => {
    const sb = makeSupabase({
      brand: {
        id: BRAND_ID,
        name: "Aurelia",
        brand_url: "not-a-url",
        org_id: ORG_ID,
        user_id: ACTOR,
        intake_status: "failed",
      },
    });
    const result = await restartFailedBrandAnalysis({
      supabase: sb as never,
      actorId: ACTOR,
      brandId: BRAND_ID,
    });
    expect(result).toMatchObject({ ok: false, code: "invalid_url" });
    expect(mockInvokeCrawl).not.toHaveBeenCalled();
  });

  it("rejects private hosts before lock/provider", async () => {
    const sb = makeSupabase({
      brand: {
        id: BRAND_ID,
        name: "Aurelia",
        brand_url: "http://localhost:3000/",
        org_id: ORG_ID,
        user_id: ACTOR,
        intake_status: "failed",
      },
    });
    const result = await restartFailedBrandAnalysis({
      supabase: sb as never,
      actorId: ACTOR,
      brandId: BRAND_ID,
    });
    expect(result).toMatchObject({ ok: false, code: "invalid_url" });
    expect(mockTryAcquire).not.toHaveBeenCalled();
  });

  it("rejects non-failed intake", async () => {
    const sb = makeSupabase({
      brand: {
        id: BRAND_ID,
        name: "Aurelia",
        brand_url: URL,
        org_id: ORG_ID,
        user_id: ACTOR,
        intake_status: "ready",
      },
    });
    const result = await restartFailedBrandAnalysis({
      supabase: sb as never,
      actorId: ACTOR,
      brandId: BRAND_ID,
    });
    expect(result).toMatchObject({ ok: false, code: "invalid_state" });
    expect(mockTryAcquire).not.toHaveBeenCalled();
  });

  it("maps lock contention to already_running", async () => {
    mockTryAcquire.mockResolvedValue({
      ok: false,
      error: "Analysis already in progress",
    });
    stubAdminCrawls([{ id: "c1", job_status: "failed", source_url: URL }]);
    const sb = makeSupabase({});
    const result = await restartFailedBrandAnalysis({
      supabase: sb as never,
      actorId: ACTOR,
      brandId: BRAND_ID,
    });
    expect(result).toMatchObject({ ok: false, code: "already_running" });
  });

  it("maps lock DB failure to provider_unavailable", async () => {
    mockTryAcquire.mockResolvedValue({
      ok: false,
      error: "Could not start analysis",
    });
    stubAdminCrawls([{ id: "c1", job_status: "failed", source_url: URL }]);
    const sb = makeSupabase({});
    const result = await restartFailedBrandAnalysis({
      supabase: sb as never,
      actorId: ACTOR,
      brandId: BRAND_ID,
    });
    expect(result).toMatchObject({ ok: false, code: "provider_unavailable" });
  });

  it("restores lock when attempt logging fails before provider", async () => {
    stubAdminCrawls([{ id: "c1", job_status: "failed", source_url: URL }]);
    const sb = makeSupabase({ attemptLogError: { code: "42501" } });
    const result = await restartFailedBrandAnalysis({
      supabase: sb as never,
      actorId: ACTOR,
      brandId: BRAND_ID,
    });
    expect(result).toMatchObject({ ok: false, code: "provider_unavailable" });
    expect(mockRestore).toHaveBeenCalledWith(
      expect.anything(),
      BRAND_ID,
      "failed",
      "token-1",
    );
    expect(mockInvokeCrawl).not.toHaveBeenCalled();
  });

  it("path/query variants reuse origin crawl (no duplicate Firecrawl)", async () => {
    stubAdminCrawls([
      {
        id: "c-origin",
        job_status: "complete",
        source_url: "https://aureliajewelry.com/shop?utm=secret",
      },
    ]);
    const sb = makeSupabase({
      brand: {
        id: BRAND_ID,
        name: "Aurelia",
        brand_url: "https://aureliajewelry.com/about",
        org_id: ORG_ID,
        user_id: ACTOR,
        intake_status: "failed",
      },
      afterIntake: "draft_ready",
    });
    const result = await restartFailedBrandAnalysis({
      supabase: sb as never,
      actorId: ACTOR,
      brandId: BRAND_ID,
      websiteUrl: "https://aureliajewelry.com/collections?token=abc",
    });
    expect(result).toMatchObject({
      ok: true,
      mode: "bi_restarted",
      crawlId: "c-origin",
    });
    expect(mockInvokeCrawl).not.toHaveBeenCalled();
    // Same origin → keep stored path; do not write origin-only brand_url.
    expect(sb._brandUpdates).toEqual([]);
  });

  it("persists caller URL with path before releasing lock when host changes", async () => {
    stubAdminCrawls([]);
    const callOrder: string[] = [];
    const sb = makeSupabase({
      brand: {
        id: BRAND_ID,
        name: "Aurelia",
        brand_url: "https://old.example/about",
        org_id: ORG_ID,
        user_id: ACTOR,
        intake_status: "failed",
      },
      afterIntake: "draft_ready",
      onBrandUpdate: () => {
        callOrder.push("persist");
      },
    });
    mockRelease.mockImplementation(async () => {
      callOrder.push("release");
    });

    const result = await restartFailedBrandAnalysis({
      supabase: sb as never,
      actorId: ACTOR,
      brandId: BRAND_ID,
      websiteUrl: "https://new.example/shop?ref=1#top",
    });
    expect(result).toMatchObject({ ok: true, mode: "crawl_restarted" });
    expect(sb._brandUpdates).toEqual([
      { brand_url: "https://new.example/shop?ref=1#top" },
    ]);
    expect(callOrder).toEqual(["persist", "release"]);
  });
});

describe("restartFailedBrandAnalysis — stage paths", () => {
  it("reuses active crawl, waits, then runs BI (no new Firecrawl start)", async () => {
    stubAdminCrawls([{ id: "c-active", job_status: "running", source_url: URL }]);
    const sb = makeSupabase({ afterIntake: "draft_ready" });
    const result = await restartFailedBrandAnalysis({
      supabase: sb as never,
      actorId: ACTOR,
      brandId: BRAND_ID,
    });
    expect(result).toMatchObject({
      ok: true,
      mode: "crawl_reused",
      crawlId: "c-active",
      intakeStatus: "draft_ready",
    });
    expect(mockInvokeCrawl).not.toHaveBeenCalled();
    expect(mockWaitCrawl).toHaveBeenCalledWith(expect.anything(), "c-active");
    expect(mockInvokeBi).toHaveBeenCalledTimes(1);
    expect(sb._inserts.length).toBeGreaterThanOrEqual(2);
  });

  it("restarts crawl when latest crawl failed, waits, then BI", async () => {
    stubAdminCrawls([{ id: "c-fail", job_status: "failed", source_url: URL }]);
    const sb = makeSupabase({ afterIntake: "draft_ready" });
    const result = await restartFailedBrandAnalysis({
      supabase: sb as never,
      actorId: ACTOR,
      brandId: BRAND_ID,
    });
    expect(result).toMatchObject({
      ok: true,
      mode: "crawl_restarted",
      crawlId: "crawl-new",
    });
    expect(mockInvokeCrawl).toHaveBeenCalledTimes(1);
    const [, , url, opts] = mockInvokeCrawl.mock.calls[0];
    expect(url).toBe(URL);
    expect(opts.idempotencyKey).toMatch(/^restart-/);
    expect(mockWaitCrawl).toHaveBeenCalled();
    expect(mockInvokeBi).toHaveBeenCalled();
  });

  it("restarts BI only when crawl is complete (no crawl/wait)", async () => {
    stubAdminCrawls([{ id: "c-done", job_status: "complete", source_url: URL }]);
    const sb = makeSupabase({ afterIntake: "draft_ready" });
    const result = await restartFailedBrandAnalysis({
      supabase: sb as never,
      actorId: ACTOR,
      brandId: BRAND_ID,
    });
    expect(result).toMatchObject({
      ok: true,
      mode: "bi_restarted",
      crawlId: "c-done",
    });
    expect(mockInvokeCrawl).not.toHaveBeenCalled();
    expect(mockWaitCrawl).not.toHaveBeenCalled();
    expect(mockInvokeBi).toHaveBeenCalledTimes(1);
    expect(mockInvokeBi.mock.calls[0][3]).toEqual({
      draftMode: true,
      crawlResultId: "c-done",
    });
  });

  it("changed URL ignores prior crawl for a different host → crawl_restarted", async () => {
    stubAdminCrawls([{ id: "c-old", job_status: "complete", source_url: "https://old.com/" }]);
    const sb = makeSupabase({ afterIntake: "draft_ready" });
    const result = await restartFailedBrandAnalysis({
      supabase: sb as never,
      actorId: ACTOR,
      brandId: BRAND_ID,
      websiteUrl: "https://new-brand.com/",
    });
    expect(result).toMatchObject({ ok: true, mode: "crawl_restarted" });
    expect(mockInvokeCrawl).toHaveBeenCalled();
    expect(mockInvokeBi).toHaveBeenCalled();
  });

  it("prefers older active crawl over newer failed match", async () => {
    stubAdminCrawls([
      { id: "new-fail", job_status: "failed", source_url: URL },
      { id: "old-active", job_status: "queued", source_url: URL },
    ]);
    const sb = makeSupabase({ afterIntake: "draft_ready" });
    const result = await restartFailedBrandAnalysis({
      supabase: sb as never,
      actorId: ACTOR,
      brandId: BRAND_ID,
    });
    expect(result).toMatchObject({ ok: true, mode: "crawl_reused", crawlId: "old-active" });
    expect(mockInvokeCrawl).not.toHaveBeenCalled();
  });

  it("provider failure returns provider_unavailable and restores lock without leaking details", async () => {
    mockInvokeCrawl.mockRejectedValue(new Error("Firecrawl ECONNREFUSED secret-host"));
    stubAdminCrawls([{ id: "c-fail", job_status: "failed", source_url: URL }]);
    const sb = makeSupabase({});
    const result = await restartFailedBrandAnalysis({
      supabase: sb as never,
      actorId: ACTOR,
      brandId: BRAND_ID,
    });
    expect(result).toMatchObject({ ok: false, code: "provider_unavailable" });
    if (!result.ok) {
      expect(result.message).not.toMatch(/ECONNREFUSED|secret-host|Firecrawl/i);
    }
    expect(mockRestore).toHaveBeenCalledWith(
      expect.anything(),
      BRAND_ID,
      "failed",
      "token-1",
    );
  });

  it("crawl timeout restores lock and does not invoke BI", async () => {
    mockWaitCrawl.mockResolvedValue("timeout");
    stubAdminCrawls([{ id: "c-fail", job_status: "failed", source_url: URL }]);
    const sb = makeSupabase({});
    const result = await restartFailedBrandAnalysis({
      supabase: sb as never,
      actorId: ACTOR,
      brandId: BRAND_ID,
    });
    expect(result).toMatchObject({ ok: false, code: "provider_unavailable" });
    expect(mockInvokeBi).not.toHaveBeenCalled();
    expect(mockRestore).toHaveBeenCalled();
  });
});

describe("restartHttpStatus", () => {
  it.each([
    [{ ok: true as const, mode: "crawl_restarted" as const, intakeStatus: "draft_ready" }, 200],
    [{ ok: false as const, code: "unauthorized" as const, message: "x" }, 403],
    [{ ok: false as const, code: "not_found" as const, message: "x" }, 404],
    [{ ok: false as const, code: "invalid_url" as const, message: "x" }, 400],
    [{ ok: false as const, code: "invalid_state" as const, message: "x" }, 400],
    [{ ok: false as const, code: "already_running" as const, message: "x" }, 409],
    [{ ok: false as const, code: "provider_unavailable" as const, message: "x" }, 503],
  ])("%j → %i", (result, status) => {
    expect(restartHttpStatus(result)).toBe(status);
  });
});
