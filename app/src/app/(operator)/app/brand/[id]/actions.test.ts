import { afterEach, describe, expect, it, vi } from "vitest";

const mockGetUser = vi.fn();
const mockInvokeStartBrandCrawl = vi.fn();
const mockWaitForCrawlCompletion = vi.fn();
const mockInvokeBrandIntelligence = vi.fn();
const mockRevalidatePath = vi.fn();

vi.mock("next/cache", () => ({
  revalidatePath: (...args: unknown[]) => mockRevalidatePath(...args),
}));

vi.mock("@/lib/onboarding", () => ({
  invokeStartBrandCrawl: (...args: unknown[]) => mockInvokeStartBrandCrawl(...args),
  waitForCrawlCompletion: (...args: unknown[]) => mockWaitForCrawlCompletion(...args),
  invokeBrandIntelligence: (...args: unknown[]) => mockInvokeBrandIntelligence(...args),
}));

vi.mock("@/lib/brand/discard-draft", () => ({ discardBrandDraft: vi.fn() }));
vi.mock("@/app/api/_lib/process-draft-approval", () => ({ processBrandIntelligenceDraftApproval: vi.fn() }));
vi.mock("@/lib/brand/promote-draft", () => ({ promoteBrandDraft: vi.fn() }));

type BrandRow = { id: string; name: string; brand_url: string | null; intake_status: string | null };

type RestoreMode = "success" | "db-error" | "throw" | "no-match";

function makeSupabase(brand: BrandRow, restoreMode: RestoreMode = "success") {
  const updates: Record<string, unknown>[] = [];
  let updateCallCount = 0;
  const brandsTable = {
    select: () => ({
      eq: () => ({
        maybeSingle: async () => ({ data: brand, error: null }),
      }),
    }),
    update: (patch: Record<string, unknown>) => {
      updateCallCount += 1;
      updates.push(patch);
      if (updateCallCount === 1) {
        // lock update: acquire analysis_running
        return {
          eq: () => ({
            not: () => ({
              select: () => ({
                maybeSingle: async () => ({ data: { id: brand.id }, error: null }),
              }),
            }),
          }),
        };
      }
      // restoreBrandStatus's conditional update: .eq("id", ...).neq("intake_status", "draft_ready")
      return {
        eq: () => ({
          neq: () => ({
            select: () => ({
              maybeSingle: async () => {
                if (restoreMode === "throw") throw new Error("network blip");
                if (restoreMode === "db-error") return { data: null, error: { code: "23505", message: "db error" } };
                if (restoreMode === "no-match") return { data: null, error: null };
                return { data: { id: brand.id }, error: null };
              },
            }),
          }),
        }),
      };
    },
  };

  return {
    auth: { getUser: mockGetUser },
    from: (table: string) => {
      if (table !== "brands") throw new Error(`unexpected table: ${table}`);
      return brandsTable;
    },
    updates,
  };
}

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: async () => mockSupabase,
}));

let mockSupabase: ReturnType<typeof makeSupabase>;

async function importActions() {
  return import("./actions");
}

const BRAND: BrandRow = {
  id: "brand-1",
  name: "Nike",
  brand_url: "https://www.nike.com",
  intake_status: "brand_created",
};

afterEach(() => {
  vi.clearAllMocks();
});

describe("reanalyzeBrand — IPI-738 crawl-first path", () => {
  it("starts a crawl, waits for it, and passes crawlResultId to invokeBrandIntelligence", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } }, error: null });
    mockSupabase = makeSupabase(BRAND);
    mockInvokeStartBrandCrawl.mockResolvedValue({ crawlId: "crawl-1" });
    mockWaitForCrawlCompletion.mockResolvedValue("complete");
    mockInvokeBrandIntelligence.mockResolvedValue({ brandId: BRAND.id });

    const { reanalyzeBrand } = await importActions();
    const result = await reanalyzeBrand(BRAND.id);

    expect(mockInvokeStartBrandCrawl).toHaveBeenCalledWith(
      mockSupabase,
      BRAND.id,
      BRAND.brand_url,
      expect.objectContaining({ idempotencyKey: `reanalyze-${BRAND.id}` }),
    );
    expect(mockWaitForCrawlCompletion).toHaveBeenCalledWith(mockSupabase, "crawl-1");
    expect(mockInvokeBrandIntelligence).toHaveBeenCalledWith(
      mockSupabase,
      BRAND.id,
      expect.objectContaining({ websiteUrl: BRAND.brand_url }),
      expect.objectContaining({ draftMode: true, crawlResultId: "crawl-1" }),
    );
    expect(result).toEqual({ ok: true, hasDraft: true });
  });

  it("returns a specific actionable error when the crawl fails, without calling brand-intelligence", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } }, error: null });
    mockSupabase = makeSupabase(BRAND);
    mockInvokeStartBrandCrawl.mockResolvedValue({ crawlId: "crawl-1" });
    mockWaitForCrawlCompletion.mockResolvedValue("failed");

    const { reanalyzeBrand } = await importActions();
    const result = await reanalyzeBrand(BRAND.id);

    expect(mockInvokeBrandIntelligence).not.toHaveBeenCalled();
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/couldn't crawl/i);
  });

  it("returns a specific actionable error on crawl timeout, without calling brand-intelligence", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } }, error: null });
    mockSupabase = makeSupabase(BRAND);
    mockInvokeStartBrandCrawl.mockResolvedValue({ crawlId: "crawl-1" });
    mockWaitForCrawlCompletion.mockResolvedValue("timeout");

    const { reanalyzeBrand } = await importActions();
    const result = await reanalyzeBrand(BRAND.id);

    expect(mockInvokeBrandIntelligence).not.toHaveBeenCalled();
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/taking longer than expected/i);
  });

  it("falls through to invokeBrandIntelligence without crawlResultId when start-brand-crawl itself throws", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } }, error: null });
    mockSupabase = makeSupabase(BRAND);
    mockInvokeStartBrandCrawl.mockRejectedValue(new Error("Firecrawl is not configured"));
    mockInvokeBrandIntelligence.mockResolvedValue({ brandId: BRAND.id });

    const { reanalyzeBrand } = await importActions();
    const result = await reanalyzeBrand(BRAND.id);

    expect(mockWaitForCrawlCompletion).not.toHaveBeenCalled();
    expect(mockInvokeBrandIntelligence).toHaveBeenCalledWith(
      mockSupabase,
      BRAND.id,
      expect.anything(),
      expect.objectContaining({ draftMode: true, crawlResultId: undefined }),
    );
    expect(result).toEqual({ ok: true, hasDraft: true });
  });
});

describe("reanalyzeBrand — IPI-744 restoreBrandStatus never masks the original error", () => {
  it("restores successfully and returns the crawl-failure error unchanged", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } }, error: null });
    mockSupabase = makeSupabase(BRAND, "success");
    mockInvokeStartBrandCrawl.mockResolvedValue({ crawlId: "crawl-1" });
    mockWaitForCrawlCompletion.mockResolvedValue("failed");

    const { reanalyzeBrand } = await importActions();
    const result = await reanalyzeBrand(BRAND.id);

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/couldn't crawl/i);
  });

  it("logs and swallows a { error } result from the restore update, without masking the original error", async () => {
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } }, error: null });
    mockSupabase = makeSupabase(BRAND, "db-error");
    mockInvokeStartBrandCrawl.mockResolvedValue({ crawlId: "crawl-1" });
    mockWaitForCrawlCompletion.mockResolvedValue("failed");

    const { reanalyzeBrand } = await importActions();
    const result = await reanalyzeBrand(BRAND.id);

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/couldn't crawl/i);
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "[reanalyze] failed to restore brand status",
      expect.objectContaining({ brandId: BRAND.id, code: "23505" }),
    );
    consoleErrorSpy.mockRestore();
  });

  it("catches a thrown restore error without rejecting the action or masking the original error", async () => {
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } }, error: null });
    mockSupabase = makeSupabase(BRAND, "throw");
    mockInvokeStartBrandCrawl.mockResolvedValue({ crawlId: "crawl-1" });
    mockWaitForCrawlCompletion.mockResolvedValue("timeout");

    const { reanalyzeBrand } = await importActions();
    const result = await reanalyzeBrand(BRAND.id);

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/taking longer than expected/i);
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "[reanalyze] status restoration threw",
      expect.objectContaining({ brandId: BRAND.id, error: "network blip" }),
    );
    consoleErrorSpy.mockRestore();
  });

  it("preserves the outer-catch error (e.g. brand-intelligence failure) even when the restore also fails", async () => {
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } }, error: null });
    mockSupabase = makeSupabase(BRAND, "throw");
    mockInvokeStartBrandCrawl.mockResolvedValue({ crawlId: "crawl-1" });
    mockWaitForCrawlCompletion.mockResolvedValue("complete");
    mockInvokeBrandIntelligence.mockRejectedValue(new Error("brand-intelligence unavailable"));

    const { reanalyzeBrand } = await importActions();
    const result = await reanalyzeBrand(BRAND.id);

    expect(result).toEqual({ ok: false, error: "brand-intelligence unavailable" });
    consoleErrorSpy.mockRestore();
  });

  it("treats zero affected rows (e.g. status is already draft_ready) as a non-error no-op, preserving the original error", async () => {
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } }, error: null });
    mockSupabase = makeSupabase(BRAND, "no-match");
    mockInvokeStartBrandCrawl.mockResolvedValue({ crawlId: "crawl-1" });
    mockWaitForCrawlCompletion.mockResolvedValue("failed");

    const { reanalyzeBrand } = await importActions();
    const result = await reanalyzeBrand(BRAND.id);

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/couldn't crawl/i);
    // Zero matched rows is an expected outcome (status is already draft_ready), not
    // a failure — it must not be logged as one.
    expect(consoleErrorSpy).not.toHaveBeenCalled();
    consoleErrorSpy.mockRestore();
  });

  it("restores the brand even when firecrawl-webhook already flipped intake_status to 'failed' first (Sentry-flagged regression)", async () => {
    // firecrawl-webhook's crawl.failed handler (service-role client, independent
    // of this Server Action) sets brands.intake_status = "failed" directly, and
    // typically lands well before waitForCrawlCompletion's poll notices — this is
    // the COMMON case for a real crawl failure, not an edge case. Restore must
    // still succeed here; a guard requiring intake_status to still be
    // "analysis_running" would silently no-op on exactly this path.
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } }, error: null });

    let currentStatus = "analysis_running";
    const brandsTable = {
      select: () => ({
        eq: () => ({ maybeSingle: async () => ({ data: BRAND, error: null }) }),
      }),
      update: (patch: Record<string, unknown>) => {
        const isLockAcquire = patch.intake_status === "analysis_running";
        if (isLockAcquire) {
          return {
            eq: () => ({
              not: () => ({
                select: () => ({
                  maybeSingle: async () => {
                    currentStatus = "analysis_running";
                    return { data: { id: BRAND.id }, error: null };
                  },
                }),
              }),
            }),
          };
        }
        // restoreBrandStatus's conditional update — must succeed unless the
        // current status is draft_ready.
        return {
          eq: () => ({
            neq: () => ({
              select: () => ({
                maybeSingle: async () => {
                  if (currentStatus === "draft_ready") return { data: null, error: null };
                  currentStatus = patch.intake_status as string;
                  return { data: { id: BRAND.id }, error: null };
                },
              }),
            }),
          }),
        };
      },
    };
    mockSupabase = {
      auth: { getUser: mockGetUser },
      from: (table: string) => {
        if (table !== "brands") throw new Error(`unexpected table: ${table}`);
        return brandsTable;
      },
      updates: [],
    };

    mockInvokeStartBrandCrawl.mockResolvedValue({ crawlId: "crawl-1" });
    mockWaitForCrawlCompletion.mockImplementation(async () => {
      // The webhook lands before this resolves — by the time waitForCrawlCompletion
      // returns "failed", brands.intake_status is already "failed" too.
      currentStatus = "failed";
      return "failed";
    });

    const { reanalyzeBrand } = await importActions();
    const result = await reanalyzeBrand(BRAND.id);

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/couldn't crawl/i);
    expect(currentStatus).toBe(BRAND.intake_status); // restored to priorStatus, not stuck at "failed"
  });

  it("restores the brand even when firecrawl-webhook already flipped intake_status to 'crawl_complete' (live-verified — IPI-744 QA run 2026-07-20)", async () => {
    // firecrawl-webhook's crawl.completed handler independently sets
    // brands.intake_status = "crawl_complete" (handler.ts:432), same as the
    // crawl.failed handler sets "failed". A live pre-merge test against a
    // real Firecrawl crawl (broken domain) reproduced exactly this: the crawl
    // "completed" with 0 pages, the webhook set intake_status="crawl_complete",
    // brand-intelligence then rejected the empty content, and the outer-catch
    // restore had to succeed despite intake_status no longer being
    // "analysis_running". Confirmed live; this test locks the behavior in.
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } }, error: null });

    let currentStatus = "analysis_running";
    const brandsTable = {
      select: () => ({
        eq: () => ({ maybeSingle: async () => ({ data: BRAND, error: null }) }),
      }),
      update: (patch: Record<string, unknown>) => {
        const isLockAcquire = patch.intake_status === "analysis_running";
        if (isLockAcquire) {
          return {
            eq: () => ({
              not: () => ({
                select: () => ({
                  maybeSingle: async () => {
                    currentStatus = "analysis_running";
                    return { data: { id: BRAND.id }, error: null };
                  },
                }),
              }),
            }),
          };
        }
        return {
          eq: () => ({
            neq: () => ({
              select: () => ({
                maybeSingle: async () => {
                  if (currentStatus === "draft_ready") return { data: null, error: null };
                  currentStatus = patch.intake_status as string;
                  return { data: { id: BRAND.id }, error: null };
                },
              }),
            }),
          }),
        };
      },
    };
    mockSupabase = {
      auth: { getUser: mockGetUser },
      from: (table: string) => {
        if (table !== "brands") throw new Error(`unexpected table: ${table}`);
        return brandsTable;
      },
      updates: [],
    };

    mockInvokeStartBrandCrawl.mockResolvedValue({ crawlId: "crawl-1" });
    mockWaitForCrawlCompletion.mockImplementation(async () => {
      // The webhook lands before this resolves — job_status is "complete" but
      // the crawl found 0 pages, and the webhook already wrote crawl_complete.
      currentStatus = "crawl_complete";
      return "complete";
    });
    mockInvokeBrandIntelligence.mockRejectedValue(
      new Error("Brand analysis requires Firecrawl page content. Run a brand crawl first."),
    );

    const { reanalyzeBrand } = await importActions();
    const result = await reanalyzeBrand(BRAND.id);

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/requires Firecrawl page content/i);
    expect(currentStatus).toBe(BRAND.intake_status); // restored to priorStatus, not stuck at "crawl_complete"
  });

  it("does not overwrite a late-arriving draft_ready state when invokeBrandIntelligence's response is lost", async () => {
    // Simulates: brand-intelligence's edge function writes draft_ready
    // server-side, but the client-visible call still throws (e.g. the
    // response is lost) — landing in the outer catch, which must not clobber
    // the real draft_ready result back to priorStatus.
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } }, error: null });

    let currentStatus = "analysis_running";
    const brandsTable = {
      select: () => ({
        eq: () => ({ maybeSingle: async () => ({ data: BRAND, error: null }) }),
      }),
      update: (patch: Record<string, unknown>) => {
        const isLockAcquire = patch.intake_status === "analysis_running";
        if (isLockAcquire) {
          return {
            eq: () => ({
              not: () => ({
                select: () => ({
                  maybeSingle: async () => {
                    currentStatus = "analysis_running";
                    return { data: { id: BRAND.id }, error: null };
                  },
                }),
              }),
            }),
          };
        }
        // restoreBrandStatus's conditional update — only "wins" unless the row
        // is already draft_ready at the moment it runs.
        return {
          eq: () => ({
            neq: () => ({
              select: () => ({
                maybeSingle: async () => {
                  if (currentStatus === "draft_ready") return { data: null, error: null };
                  currentStatus = patch.intake_status as string;
                  return { data: { id: BRAND.id }, error: null };
                },
              }),
            }),
          }),
        };
      },
    };
    mockSupabase = {
      auth: { getUser: mockGetUser },
      from: (table: string) => {
        if (table !== "brands") throw new Error(`unexpected table: ${table}`);
        return brandsTable;
      },
      updates: [],
    };

    mockInvokeStartBrandCrawl.mockResolvedValue({ crawlId: "crawl-1" });
    mockWaitForCrawlCompletion.mockResolvedValue("complete");
    mockInvokeBrandIntelligence.mockImplementation(async () => {
      // The edge function's write already landed server-side...
      currentStatus = "draft_ready";
      // ...but the client-visible call still fails.
      throw new Error("network error reading response");
    });

    const { reanalyzeBrand } = await importActions();
    const result = await reanalyzeBrand(BRAND.id);

    expect(result).toEqual({ ok: false, error: "network error reading response" });
    expect(currentStatus).toBe("draft_ready"); // restore did NOT clobber it back to priorStatus
  });
});
