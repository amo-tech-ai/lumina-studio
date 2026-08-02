import { beforeEach, describe, expect, it, vi } from "vitest";

const mockTryAcquire = vi.fn();
const mockRestore = vi.fn();
const mockRelease = vi.fn();
const mockInvokeCrawl = vi.fn();
const mockInvokeBi = vi.fn();

vi.mock("@/lib/brand/analysis-lock", () => ({
  tryAcquireAnalysisLock: (...args: unknown[]) => mockTryAcquire(...args),
  restoreAnalysisStatusIfOwned: (...args: unknown[]) => mockRestore(...args),
  releaseAnalysisLockIfOwned: (...args: unknown[]) => mockRelease(...args),
}));

vi.mock("@/lib/onboarding", () => ({
  invokeStartBrandCrawl: (...args: unknown[]) => mockInvokeCrawl(...args),
  invokeBrandIntelligence: (...args: unknown[]) => mockInvokeBi(...args),
}));

import {
  restartFailedBrandAnalysis,
  restartHttpStatus,
} from "./restart-failed-analysis";

const BRAND_ID = "00000000-0000-4000-8000-000000000901";
const ORG_ID = "00000000-0000-4000-8000-000000000902";
const ACTOR = "00000000-0000-4000-8000-000000000903";
const URL = "https://aureliajewelry.com/";

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
  crawls?: CrawlRow[];
  canEdit?: boolean;
  roleError?: { message: string } | null;
  resumeOk?: boolean;
  afterIntake?: string;
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
  const updates: unknown[] = [];

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
              return { data: brand, error: null };
            },
          }),
        }),
        update: (payload: unknown) => {
          updates.push(payload);
          const chain = {
            eq: () => chain,
            select: () => ({
              maybeSingle: async () => {
                if (opts.resumeOk === false) return { data: null, error: null };
                const intake =
                  typeof payload === "object" &&
                  payload &&
                  "intake_status" in payload
                    ? String((payload as { intake_status: string }).intake_status)
                    : (opts.afterIntake ?? "crawl_running");
                return { data: { intake_status: intake }, error: null };
              },
            }),
          };
          return chain;
        },
      };
    }
    if (table === "brand_crawls") {
      return {
        select: () => ({
          eq: () => ({
            order: () => ({
              limit: async () => ({ data: opts.crawls ?? [], error: null }),
            }),
          }),
        }),
      };
    }
    if (table === "ai_agent_logs") {
      return {
        insert: (row: unknown) => {
          inserts.push(row);
          return {
            select: () => ({
              maybeSingle: async () => ({ data: { id: "log-1" }, error: null }),
            }),
          };
        },
        update: () => ({
          eq: async () => ({ data: null, error: null }),
        }),
      };
    }
    throw new Error(`unexpected table ${table}`);
  };

  return { from, rpc, _inserts: inserts, _updates: updates };
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
    expect(sb._inserts).toHaveLength(0);
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

  it("allows personal-brand owner", async () => {
    const sb = makeSupabase({
      brand: {
        id: BRAND_ID,
        name: "Personal",
        brand_url: URL,
        org_id: null,
        user_id: ACTOR,
        intake_status: "failed",
      },
      crawls: [{ id: "c1", job_status: "failed", source_url: URL }],
    });
    const result = await restartFailedBrandAnalysis({
      supabase: sb as never,
      actorId: ACTOR,
      brandId: BRAND_ID,
    });
    expect(result.ok).toBe(true);
    expect(mockInvokeCrawl).toHaveBeenCalled();
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

  it("maps lock held to already_running", async () => {
    mockTryAcquire.mockResolvedValue({
      ok: false,
      error: "Analysis already in progress",
    });
    const sb = makeSupabase({
      crawls: [{ id: "c1", job_status: "failed", source_url: URL }],
    });
    const result = await restartFailedBrandAnalysis({
      supabase: sb as never,
      actorId: ACTOR,
      brandId: BRAND_ID,
    });
    expect(result).toMatchObject({ ok: false, code: "already_running" });
  });
});

describe("restartFailedBrandAnalysis — stage paths", () => {
  it("reuses active crawl without invoking Firecrawl", async () => {
    const sb = makeSupabase({
      crawls: [{ id: "c-active", job_status: "running", source_url: URL }],
    });
    const result = await restartFailedBrandAnalysis({
      supabase: sb as never,
      actorId: ACTOR,
      brandId: BRAND_ID,
    });
    expect(result).toEqual({
      ok: true,
      mode: "crawl_reused",
      intakeStatus: "crawl_running",
      crawlId: "c-active",
    });
    expect(mockInvokeCrawl).not.toHaveBeenCalled();
    expect(mockInvokeBi).not.toHaveBeenCalled();
    expect(sb._inserts.length).toBeGreaterThan(0);
  });

  it("restarts crawl when latest crawl failed", async () => {
    const sb = makeSupabase({
      crawls: [{ id: "c-fail", job_status: "failed", source_url: URL }],
    });
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
    expect(opts.idempotencyKey).toContain(BRAND_ID);
    expect(mockInvokeBi).not.toHaveBeenCalled();
    expect(sb._inserts[0]).toMatchObject({
      agent_name: "restart-failed-analysis",
      user_id: ACTOR,
    });
  });

  it("restarts BI only when crawl is complete", async () => {
    const sb = makeSupabase({
      crawls: [{ id: "c-done", job_status: "complete", source_url: URL }],
      afterIntake: "draft_ready",
    });
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
    expect(mockInvokeBi).toHaveBeenCalledTimes(1);
    const biOpts = mockInvokeBi.mock.calls[0][3];
    expect(biOpts).toEqual({ draftMode: true, crawlResultId: "c-done" });
  });

  it("changed URL ignores prior crawl for a different host → crawl_restarted", async () => {
    const sb = makeSupabase({
      crawls: [{ id: "c-old", job_status: "complete", source_url: "https://old.com/" }],
    });
    const result = await restartFailedBrandAnalysis({
      supabase: sb as never,
      actorId: ACTOR,
      brandId: BRAND_ID,
      websiteUrl: "https://new-brand.com/",
    });
    expect(result).toMatchObject({ ok: true, mode: "crawl_restarted" });
    expect(mockInvokeCrawl).toHaveBeenCalled();
    expect(mockInvokeBi).not.toHaveBeenCalled();
  });

  it("provider failure returns provider_unavailable and restores lock", async () => {
    mockInvokeCrawl.mockRejectedValue(new Error("Firecrawl ECONNREFUSED secret-host"));
    const sb = makeSupabase({
      crawls: [{ id: "c-fail", job_status: "failed", source_url: URL }],
    });
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
});

describe("restartHttpStatus", () => {
  it.each([
    [{ ok: true as const, mode: "crawl_restarted" as const, intakeStatus: "crawl_running" }, 200],
    [{ ok: false as const, code: "unauthorized" as const, message: "x" }, 403],
    [{ ok: false as const, code: "not_found" as const, message: "x" }, 404],
    [{ ok: false as const, code: "invalid_url" as const, message: "x" }, 400],
    [{ ok: false as const, code: "already_running" as const, message: "x" }, 409],
    [{ ok: false as const, code: "provider_unavailable" as const, message: "x" }, 503],
  ])("%j → %i", (result, status) => {
    expect(restartHttpStatus(result)).toBe(status);
  });
});
