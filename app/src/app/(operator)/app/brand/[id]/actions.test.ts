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

/**
 * Mock brands table: lock acquire writes token; restore requires
 * .eq(analysis_lock_token).neq(intake_status, draft_ready).
 */
function makeSupabase(brand: BrandRow, restoreMode: RestoreMode = "success") {
  const updates: Record<string, unknown>[] = [];
  let updateCallCount = 0;
  let heldToken: string | null = null;
  const brandsTable = {
    select: () => ({
      eq: () => ({
        maybeSingle: async () => ({ data: brand, error: null }),
      }),
    }),
    update: (patch: Record<string, unknown>) => {
      updateCallCount += 1;
      updates.push(patch);
      const isLockAcquire = patch.intake_status === "analysis_running" && "analysis_lock_token" in patch;
      const isTokenClearOnly =
        patch.analysis_lock_token === null && patch.intake_status === undefined;

      if (isLockAcquire) {
        heldToken = patch.analysis_lock_token as string;
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

      if (isTokenClearOnly) {
        return {
          eq: (_col: string, val: string) => ({
            eq: (_col2: string, token: string) => {
              if (token === heldToken) heldToken = null;
              return Promise.resolve({ data: null, error: null });
            },
          }),
        };
      }

      // restoreBrandStatus: .eq(id).eq(analysis_lock_token).neq(draft_ready)
      return {
        eq: () => ({
          eq: (_col: string, token: string) => ({
            neq: () => ({
              select: () => ({
                maybeSingle: async () => {
                  if (restoreMode === "throw") throw new Error("network blip");
                  if (restoreMode === "db-error") {
                    return { data: null, error: { code: "23505", message: "db error" } };
                  }
                  if (restoreMode === "no-match") return { data: null, error: null };
                  if (token !== heldToken) return { data: null, error: null };
                  heldToken = null;
                  return { data: { id: brand.id }, error: null };
                },
              }),
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
    getHeldToken: () => heldToken,
    setHeldToken: (t: string | null) => {
      heldToken = t;
    },
  };
}

/** Stateful brand row for concurrency / webhook-race scenarios. */
function makeTokenAwareBrandsTable(opts: {
  brand: BrandRow;
  getStatus: () => string;
  setStatus: (s: string) => void;
  getToken: () => string | null;
  setToken: (t: string | null) => void;
}) {
  const { brand, getStatus, setStatus, getToken, setToken } = opts;
  return {
    select: () => ({
      eq: () => ({ maybeSingle: async () => ({ data: brand, error: null }) }),
    }),
    update: (patch: Record<string, unknown>) => {
      const isLockAcquire = patch.intake_status === "analysis_running" && "analysis_lock_token" in patch;
      if (isLockAcquire) {
        return {
          eq: () => ({
            not: () => ({
              select: () => ({
                maybeSingle: async () => {
                  setStatus("analysis_running");
                  setToken(patch.analysis_lock_token as string);
                  return { data: { id: brand.id }, error: null };
                },
              }),
            }),
          }),
        };
      }
      const isTokenClearOnly =
        patch.analysis_lock_token === null && patch.intake_status === undefined;
      if (isTokenClearOnly) {
        return {
          eq: () => ({
            eq: (_c: string, token: string) => {
              if (token === getToken()) setToken(null);
              return Promise.resolve({ data: null, error: null });
            },
          }),
        };
      }
      return {
        eq: () => ({
          eq: (_c: string, token: string) => ({
            neq: () => ({
              select: () => ({
                maybeSingle: async () => {
                  if (getStatus() === "draft_ready") return { data: null, error: null };
                  if (token !== getToken()) return { data: null, error: null };
                  setStatus(patch.intake_status as string);
                  setToken(null);
                  return { data: { id: brand.id }, error: null };
                },
              }),
            }),
          }),
        }),
      };
    },
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
    // analysis_locked_at is intentionally NOT in the update payload — the
    // brands_stamp_analysis_locked_at DB trigger stamps it from Postgres
    // now(), not the app-server clock (review fix, PR #548).
    expect(mockSupabase.updates[0]).toEqual(
      expect.objectContaining({
        intake_status: "analysis_running",
        analysis_lock_token: expect.any(String),
      }),
    );
    expect(mockSupabase.updates[0]).not.toHaveProperty("analysis_locked_at");
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
      "[analysis-lock] failed to restore brand status",
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
      "[analysis-lock] status restoration threw",
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
    expect(consoleErrorSpy).not.toHaveBeenCalled();
    consoleErrorSpy.mockRestore();
  });

  it("restores the brand even when firecrawl-webhook already flipped intake_status to 'failed' first (Sentry-flagged regression)", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } }, error: null });

    let currentStatus = "analysis_running";
    let currentToken: string | null = null;
    const brandsTable = makeTokenAwareBrandsTable({
      brand: BRAND,
      getStatus: () => currentStatus,
      setStatus: (s) => {
        currentStatus = s;
      },
      getToken: () => currentToken,
      setToken: (t) => {
        currentToken = t;
      },
    });
    mockSupabase = {
      auth: { getUser: mockGetUser },
      from: (table: string) => {
        if (table !== "brands") throw new Error(`unexpected table: ${table}`);
        return brandsTable;
      },
      updates: [],
      getHeldToken: () => currentToken,
      setHeldToken: (t) => {
        currentToken = t;
      },
    };

    mockInvokeStartBrandCrawl.mockResolvedValue({ crawlId: "crawl-1" });
    mockWaitForCrawlCompletion.mockImplementation(async () => {
      currentStatus = "failed";
      return "failed";
    });

    const { reanalyzeBrand } = await importActions();
    const result = await reanalyzeBrand(BRAND.id);

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/couldn't crawl/i);
    expect(currentStatus).toBe(BRAND.intake_status);
    expect(currentToken).toBeNull();
  });

  it("restores the brand even when firecrawl-webhook already flipped intake_status to 'crawl_complete' (live-verified — IPI-744 QA run 2026-07-20)", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } }, error: null });

    let currentStatus = "analysis_running";
    let currentToken: string | null = null;
    const brandsTable = makeTokenAwareBrandsTable({
      brand: BRAND,
      getStatus: () => currentStatus,
      setStatus: (s) => {
        currentStatus = s;
      },
      getToken: () => currentToken,
      setToken: (t) => {
        currentToken = t;
      },
    });
    mockSupabase = {
      auth: { getUser: mockGetUser },
      from: (table: string) => {
        if (table !== "brands") throw new Error(`unexpected table: ${table}`);
        return brandsTable;
      },
      updates: [],
      getHeldToken: () => currentToken,
      setHeldToken: (t) => {
        currentToken = t;
      },
    };

    mockInvokeStartBrandCrawl.mockResolvedValue({ crawlId: "crawl-1" });
    mockWaitForCrawlCompletion.mockImplementation(async () => {
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
    expect(currentStatus).toBe(BRAND.intake_status);
  });

  it("does not overwrite a late-arriving draft_ready state when invokeBrandIntelligence's response is lost", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } }, error: null });

    let currentStatus = "analysis_running";
    let currentToken: string | null = null;
    const brandsTable = makeTokenAwareBrandsTable({
      brand: BRAND,
      getStatus: () => currentStatus,
      setStatus: (s) => {
        currentStatus = s;
      },
      getToken: () => currentToken,
      setToken: (t) => {
        currentToken = t;
      },
    });
    mockSupabase = {
      auth: { getUser: mockGetUser },
      from: (table: string) => {
        if (table !== "brands") throw new Error(`unexpected table: ${table}`);
        return brandsTable;
      },
      updates: [],
      getHeldToken: () => currentToken,
      setHeldToken: (t) => {
        currentToken = t;
      },
    };

    mockInvokeStartBrandCrawl.mockResolvedValue({ crawlId: "crawl-1" });
    mockWaitForCrawlCompletion.mockResolvedValue("complete");
    mockInvokeBrandIntelligence.mockImplementation(async () => {
      currentStatus = "draft_ready";
      throw new Error("network error reading response");
    });

    const { reanalyzeBrand } = await importActions();
    const result = await reanalyzeBrand(BRAND.id);

    expect(result).toEqual({ ok: false, error: "network error reading response" });
    expect(currentStatus).toBe("draft_ready");
  });
});

describe("reanalyzeBrand — IPI-744 token CAS concurrency", () => {
  it("Run A restore no-ops when Run B already holds a newer analysis_lock_token", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } }, error: null });

    let currentStatus = "analysis_running";
    let currentToken: string | null = null;
    const brandsTable = makeTokenAwareBrandsTable({
      brand: BRAND,
      getStatus: () => currentStatus,
      setStatus: (s) => {
        currentStatus = s;
      },
      getToken: () => currentToken,
      setToken: (t) => {
        currentToken = t;
      },
    });
    mockSupabase = {
      auth: { getUser: mockGetUser },
      from: (table: string) => {
        if (table !== "brands") throw new Error(`unexpected table: ${table}`);
        return brandsTable;
      },
      updates: [],
      getHeldToken: () => currentToken,
      setHeldToken: (t) => {
        currentToken = t;
      },
    };

    mockInvokeStartBrandCrawl.mockResolvedValue({ crawlId: "crawl-1" });
    mockWaitForCrawlCompletion.mockImplementation(async () => {
      // Simulate Run B acquiring a new lock before Run A's restore.
      currentToken = "run-b-token";
      currentStatus = "analysis_running";
      return "failed";
    });

    const { reanalyzeBrand } = await importActions();
    const result = await reanalyzeBrand(BRAND.id);

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/couldn't crawl/i);
    expect(currentStatus).toBe("analysis_running");
    expect(currentToken).toBe("run-b-token");
  });

  it("token mismatch cannot overwrite ready or scores_complete", async () => {
    for (const laterStatus of ["ready", "scores_complete"] as const) {
      mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } }, error: null });

      let currentStatus = "analysis_running";
      let currentToken: string | null = null;
      const brandsTable = makeTokenAwareBrandsTable({
        brand: BRAND,
        getStatus: () => currentStatus,
        setStatus: (s) => {
          currentStatus = s;
        },
        getToken: () => currentToken,
        setToken: (t) => {
          currentToken = t;
        },
      });
      mockSupabase = {
        auth: { getUser: mockGetUser },
        from: (table: string) => {
          if (table !== "brands") throw new Error(`unexpected table: ${table}`);
          return brandsTable;
        },
        updates: [],
        getHeldToken: () => currentToken,
        setHeldToken: (t) => {
          currentToken = t;
        },
      };

      mockInvokeStartBrandCrawl.mockResolvedValue({ crawlId: "crawl-1" });
      mockWaitForCrawlCompletion.mockImplementation(async () => {
        currentToken = "other-run";
        currentStatus = laterStatus;
        return "failed";
      });

      vi.resetModules();
      const { reanalyzeBrand } = await import("./actions");
      const result = await reanalyzeBrand(BRAND.id);

      expect(result.ok).toBe(false);
      expect(currentStatus).toBe(laterStatus);
      expect(currentToken).toBe("other-run");
    }
  });

  it("delayed Run A cleanup cannot overwrite 'ready' after approval clears Run A's own token (promoteBrandDraft/discardBrandDraft, IPI-744)", async () => {
    // Mirrors what promote-draft.ts / discard-draft.ts now do: on approval or
    // rejection, they clear analysis_lock_token/analysis_locked_at as part of
    // the same update that moves intake_status off draft_ready. Without that,
    // a Run A whose invokeBrandIntelligence response was lost could still own
    // a stale token and, days later, have its outer-catch restore match on
    // that token + "not draft_ready" (now "ready") and clobber it back to
    // priorStatus. Simulated here as the operator approving mid-flight.
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } }, error: null });

    let currentStatus = "analysis_running";
    let currentToken: string | null = null;
    const brandsTable = makeTokenAwareBrandsTable({
      brand: BRAND,
      getStatus: () => currentStatus,
      setStatus: (s) => {
        currentStatus = s;
      },
      getToken: () => currentToken,
      setToken: (t) => {
        currentToken = t;
      },
    });
    mockSupabase = {
      auth: { getUser: mockGetUser },
      from: (table: string) => {
        if (table !== "brands") throw new Error(`unexpected table: ${table}`);
        return brandsTable;
      },
      updates: [],
      getHeldToken: () => currentToken,
      setHeldToken: (t) => {
        currentToken = t;
      },
    };

    mockInvokeStartBrandCrawl.mockResolvedValue({ crawlId: "crawl-1" });
    mockWaitForCrawlCompletion.mockResolvedValue("complete");
    mockInvokeBrandIntelligence.mockImplementation(async () => {
      // Edge fn writes draft_ready, but Run A's own client call errors —
      // then, before Run A's outer catch runs, the operator approves: this
      // is exactly what promoteBrandDraft's fixed update now does.
      currentStatus = "ready";
      currentToken = null;
      throw new Error("network error reading response");
    });

    const { reanalyzeBrand } = await importActions();
    const result = await reanalyzeBrand(BRAND.id);

    expect(result).toEqual({ ok: false, error: "network error reading response" });
    expect(currentStatus).toBe("ready"); // NOT clobbered back to priorStatus
    expect(currentToken).toBeNull();
  });
});

describe("reanalyzeBrand — IPI-744 success-path token clear is non-critical (Sentry-flagged)", () => {
  it("still reports ok:true when clearing the lock token after success throws (transient failure)", async () => {
    // Sentry flagged: the token-clear update on the success path wasn't in
    // its own try/catch, so a transient failure there fell into the outer
    // catch and reported the whole action as failed — even though
    // invokeBrandIntelligence had already succeeded and a draft was created.
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } }, error: null });

    let updateCallCount = 0;
    const brandsTable = {
      select: () => ({
        eq: () => ({ maybeSingle: async () => ({ data: BRAND, error: null }) }),
      }),
      update: (patch: Record<string, unknown>) => {
        updateCallCount += 1;
        const isLockAcquire = updateCallCount === 1;
        if (isLockAcquire) {
          return {
            eq: () => ({
              not: () => ({
                select: () => ({
                  maybeSingle: async () => ({ data: { id: BRAND.id }, error: null }),
                }),
              }),
            }),
          };
        }
        // Success-path token clear: throws (simulated transient network blip).
        return {
          eq: () => ({
            eq: () => {
              throw new Error("transient network blip");
            },
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
    mockInvokeBrandIntelligence.mockResolvedValue({ brandId: BRAND.id });

    const { reanalyzeBrand } = await importActions();
    const result = await reanalyzeBrand(BRAND.id);

    expect(result).toEqual({ ok: true, hasDraft: true });
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "[analysis-lock] failed to clear lock token after success",
      expect.objectContaining({ brandId: BRAND.id, error: "transient network blip" }),
    );
    consoleErrorSpy.mockRestore();
  });
});

describe("reanalyzeBrand — IPI-745 stuck-analysis recovery (wiring-level)", () => {
  // A brand already analysis_running is rejected outright here, with no RPC
  // involved at all — a separate pg_cron sweep (expire_stale_brand_analysis)
  // resets truly-abandoned rows on a schedule, so a stuck brand's next
  // reanalyzeBrand call naturally hits the normal fresh-acquire path once
  // the sweep has run. This replaced an earlier synchronous RPC-takeover
  // wiring here (dropped): that RPC's null-tolerant predicate could take
  // over a brand mid-analysis via a writer that never set a lock token.
  function makeLockedSupabase() {
    const brand = {
      id: BRAND.id,
      name: BRAND.name,
      brand_url: BRAND.brand_url,
      intake_status: "analysis_running",
    };
    const updateCalls: unknown[] = [];
    return {
      auth: { getUser: mockGetUser },
      from: (table: string) => {
        if (table !== "brands") throw new Error(`unexpected table: ${table}`);
        return {
          select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: brand, error: null }) }) }),
          update: (patch: unknown) => {
            updateCalls.push(patch);
            return { eq: () => ({ eq: async () => ({ data: null, error: null }) }) };
          },
        };
      },
      updateCalls,
    };
  }

  it("returns 'already in progress' for a brand already analysis_running, without calling invokeBrandIntelligence or attempting any brand UPDATE", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } }, error: null });
    const supabase = makeLockedSupabase();
    mockSupabase = supabase as never;

    const { reanalyzeBrand } = await importActions();
    const result = await reanalyzeBrand(BRAND.id);

    expect(result).toEqual({ ok: false, error: "Analysis already in progress" });
    expect(mockInvokeBrandIntelligence).not.toHaveBeenCalled();
    expect(supabase.updateCalls).toHaveLength(0);
  });
});
