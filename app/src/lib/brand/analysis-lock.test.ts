import { describe, expect, it, vi } from "vitest";
import {
  releaseAnalysisLockIfOwned,
  restoreAnalysisStatusIfOwned,
  tryAcquireAnalysisLock,
} from "./analysis-lock";

type BrandRow = {
  id: string;
  intake_status: string | null;
};

const BRAND_ID = "brand-1";

function freshBrand(status: string): BrandRow {
  return { id: BRAND_ID, intake_status: status };
}

/** Minimal mock covering only the acquire (`.update().eq().not()...`) chain. */
function makeAcquireSupabase(brand: BrandRow, opts: { lockErrors?: boolean } = {}) {
  return {
    from: (table: string) => {
      if (table !== "brands") throw new Error(`unexpected table: ${table}`);
      return {
        select: () => ({
          eq: () => ({ maybeSingle: async () => ({ data: brand, error: null }) }),
        }),
        update: () => ({
          eq: () => ({
            not: () => ({
              select: () => ({
                maybeSingle: async () => {
                  if (opts.lockErrors) return { data: null, error: { code: "23505" } };
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

describe("tryAcquireAnalysisLock — fresh acquire", () => {
  it("acquires the lock and returns priorStatus + a runToken", async () => {
    const supabase = makeAcquireSupabase(freshBrand("ready"));
    const result = await tryAcquireAnalysisLock(supabase as never, BRAND_ID);
    expect(result).toEqual({ ok: true, runToken: expect.any(String), priorStatus: "ready" });
  });

  it("defaults priorStatus to 'ready' when intake_status is null", async () => {
    const supabase = makeAcquireSupabase(freshBrand(null as unknown as string));
    const result = await tryAcquireAnalysisLock(supabase as never, BRAND_ID);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.priorStatus).toBe("ready");
  });

  it("rejects crawl_running without attempting acquire", async () => {
    const supabase = makeAcquireSupabase(freshBrand("crawl_running"));
    const result = await tryAcquireAnalysisLock(supabase as never, BRAND_ID);
    expect(result).toEqual({ ok: false, error: "Analysis already in progress" });
  });

  it("rejects analysis_running without attempting acquire (IPI-745's pg_cron sweep recovers a truly-stuck row instead)", async () => {
    const supabase = makeAcquireSupabase(freshBrand("analysis_running"));
    const result = await tryAcquireAnalysisLock(supabase as never, BRAND_ID);
    expect(result).toEqual({ ok: false, error: "Analysis already in progress" });
  });

  it("rejects draft_ready without attempting acquire", async () => {
    const supabase = makeAcquireSupabase(freshBrand("draft_ready"));
    const result = await tryAcquireAnalysisLock(supabase as never, BRAND_ID);
    expect(result).toEqual({ ok: false, error: "Analysis already in progress" });
  });

  it("returns an error when the initial read fails", async () => {
    const supabase = {
      from: () => ({
        select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: null, error: { code: "500" } }) }) }),
      }),
    };
    const result = await tryAcquireAnalysisLock(supabase as never, BRAND_ID);
    expect(result).toEqual({ ok: false, error: "Could not start analysis" });
  });

  it("returns 'Brand not found' when no row matches", async () => {
    const supabase = {
      from: () => ({
        select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: null, error: null }) }) }),
      }),
    };
    const result = await tryAcquireAnalysisLock(supabase as never, BRAND_ID);
    expect(result).toEqual({ ok: false, error: "Brand not found" });
  });

  it("returns an error when the acquire update itself errors", async () => {
    const supabase = makeAcquireSupabase(freshBrand("ready"), { lockErrors: true });
    const result = await tryAcquireAnalysisLock(supabase as never, BRAND_ID);
    expect(result).toEqual({ ok: false, error: "Could not start analysis" });
  });

  it("returns 'already in progress' when a concurrent acquire won the race (no row matched)", async () => {
    const supabase = {
      from: () => ({
        select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: freshBrand("ready"), error: null }) }) }),
        update: () => ({
          eq: () => ({ not: () => ({ select: () => ({ maybeSingle: async () => ({ data: null, error: null }) }) }) }),
        }),
      }),
    };
    const result = await tryAcquireAnalysisLock(supabase as never, BRAND_ID);
    expect(result).toEqual({ ok: false, error: "Analysis already in progress" });
  });
});

describe("restoreAnalysisStatusIfOwned", () => {
  function makeRestoreSupabase(mode: "success" | "db-error" | "throw" | "no-match") {
    return {
      from: () => ({
        update: () => ({
          eq: () => ({
            eq: () => ({
              neq: () => ({
                select: () => ({
                  maybeSingle: async () => {
                    if (mode === "throw") throw new Error("network blip");
                    if (mode === "db-error") return { data: null, error: { code: "23505" } };
                    if (mode === "no-match") return { data: null, error: null };
                    return { data: { id: BRAND_ID }, error: null };
                  },
                }),
              }),
            }),
          }),
        }),
      }),
    };
  }

  it("returns true on success", async () => {
    const supabase = makeRestoreSupabase("success");
    const result = await restoreAnalysisStatusIfOwned(supabase as never, BRAND_ID, "ready", "tok");
    expect(result).toBe(true);
  });

  it("returns false and logs on a { error } result", async () => {
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const supabase = makeRestoreSupabase("db-error");
    const result = await restoreAnalysisStatusIfOwned(supabase as never, BRAND_ID, "ready", "tok");
    expect(result).toBe(false);
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "[analysis-lock] failed to restore brand status",
      expect.objectContaining({ brandId: BRAND_ID, code: "23505" }),
    );
    consoleErrorSpy.mockRestore();
  });

  it("returns false without throwing when the update itself throws", async () => {
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const supabase = makeRestoreSupabase("throw");
    const result = await restoreAnalysisStatusIfOwned(supabase as never, BRAND_ID, "ready", "tok");
    expect(result).toBe(false);
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "[analysis-lock] status restoration threw",
      expect.objectContaining({ brandId: BRAND_ID, error: "network blip" }),
    );
    consoleErrorSpy.mockRestore();
  });

  it("treats zero matched rows (token stolen or already draft_ready) as a safe no-op", async () => {
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const supabase = makeRestoreSupabase("no-match");
    const result = await restoreAnalysisStatusIfOwned(supabase as never, BRAND_ID, "ready", "tok");
    expect(result).toBe(false);
    expect(consoleErrorSpy).not.toHaveBeenCalled();
    consoleErrorSpy.mockRestore();
  });

  it("never restores a lock currently owned by a different request's token", async () => {
    // Stateful: the row is actually held by "run-b-token". Our caller passes
    // its own stale "run-a-token" — the CAS .eq("analysis_lock_token", ...)
    // must fail to match, and the row must not change.
    const currentOwnerToken = "run-b-token";
    let rowTouched = false;
    const supabase = {
      from: () => ({
        update: () => ({
          eq: () => ({
            eq: (_col: string, token: string) => ({
              neq: () => ({
                select: () => ({
                  maybeSingle: async () => {
                    if (token !== currentOwnerToken) return { data: null, error: null };
                    rowTouched = true;
                    return { data: { id: BRAND_ID }, error: null };
                  },
                }),
              }),
            }),
          }),
        }),
      }),
    };
    const result = await restoreAnalysisStatusIfOwned(supabase as never, BRAND_ID, "ready", "run-a-token");
    expect(result).toBe(false);
    expect(rowTouched).toBe(false);
  });
});

describe("releaseAnalysisLockIfOwned", () => {
  it("clears the lock columns for the owning token", async () => {
    const eqSpy = vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ data: null, error: null }),
    });
    const updateSpy = vi.fn().mockReturnValue({ eq: eqSpy });
    const supabase = { from: () => ({ update: updateSpy }) };

    await releaseAnalysisLockIfOwned(supabase as never, BRAND_ID, "tok");

    expect(updateSpy).toHaveBeenCalledWith({ analysis_lock_token: null, analysis_locked_at: null });
  });

  it("scopes the clear to the caller's own token, never a different request's", async () => {
    const tokenEqSpy = vi.fn().mockResolvedValue({ data: null, error: null });
    const idEqSpy = vi.fn().mockReturnValue({ eq: tokenEqSpy });
    const supabase = { from: () => ({ update: vi.fn().mockReturnValue({ eq: idEqSpy }) }) };

    await releaseAnalysisLockIfOwned(supabase as never, BRAND_ID, "run-a-token");

    expect(idEqSpy).toHaveBeenCalledWith("id", BRAND_ID);
    // The CAS filter must carry exactly this call's own token — not a
    // hardcoded/shared value — so it can never clear another request's
    // (e.g. "run-b-token") lock.
    expect(tokenEqSpy).toHaveBeenCalledWith("analysis_lock_token", "run-a-token");
  });

  it("swallows a thrown error and logs instead of propagating", async () => {
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const supabase = {
      from: () => ({
        update: () => ({
          eq: () => {
            throw new Error("transient network blip");
          },
        }),
      }),
    };

    await expect(releaseAnalysisLockIfOwned(supabase as never, BRAND_ID, "tok")).resolves.toBeUndefined();
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "[analysis-lock] failed to clear lock token after success",
      expect.objectContaining({ brandId: BRAND_ID, error: "transient network blip" }),
    );
    consoleErrorSpy.mockRestore();
  });
});
