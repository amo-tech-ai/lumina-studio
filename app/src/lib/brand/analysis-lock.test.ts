import { describe, expect, it, vi } from "vitest";
import {
  releaseAnalysisLockIfOwned,
  restoreAnalysisStatusIfOwned,
  tryAcquireAnalysisLock,
} from "./analysis-lock";

type BrandRow = {
  id: string;
  intake_status: string | null;
  analysis_lock_token: string | null;
  analysis_locked_at: string | null;
};

const BRAND_ID = "brand-1";

function freshBrand(status: string): BrandRow {
  return { id: BRAND_ID, intake_status: status, analysis_lock_token: null, analysis_locked_at: null };
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
    expect(result).toEqual({ ok: true, runToken: expect.any(String), priorStatus: "ready", tookOverStale: false });
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

describe("tryAcquireAnalysisLock — stale takeover (IPI-745)", () => {
  const LOCKED = (): BrandRow => ({
    id: BRAND_ID,
    intake_status: "analysis_running",
    analysis_lock_token: "old-token",
    analysis_locked_at: "2026-07-20T00:00:00.000Z",
  });

  function makeRpcSupabase(brand: BrandRow, rpcImpl: (args: Record<string, unknown>) => Promise<{ data: unknown; error: unknown }>) {
    return {
      from: () => ({
        select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: brand, error: null }) }) }),
      }),
      rpc: (name: string, args: Record<string, unknown>) => {
        if (name !== "take_over_stale_analysis_lock") throw new Error(`unexpected rpc: ${name}`);
        return rpcImpl(args);
      },
    };
  }

  it("takes over a stale lock and marks priorStatus 'failed' (true prior status is unrecoverable)", async () => {
    const supabase = makeRpcSupabase(LOCKED(), async (args) => {
      expect(args).toEqual(
        expect.objectContaining({ p_brand_id: BRAND_ID, p_expected_token: "old-token", p_stale_after_seconds: 300 }),
      );
      return { data: true, error: null };
    });
    const result = await tryAcquireAnalysisLock(supabase as never, BRAND_ID);
    expect(result).toEqual({ ok: true, runToken: expect.any(String), priorStatus: "failed", tookOverStale: true });
  });

  it("rejects when the RPC reports the lock is still fresh (returns false)", async () => {
    const supabase = makeRpcSupabase(LOCKED(), async () => ({ data: false, error: null }));
    const result = await tryAcquireAnalysisLock(supabase as never, BRAND_ID);
    expect(result).toEqual({ ok: false, error: "Analysis already in progress" });
  });

  it("rejects when the RPC returns a { error }", async () => {
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const supabase = makeRpcSupabase(LOCKED(), async () => ({ data: null, error: { code: "42883" } }));
    const result = await tryAcquireAnalysisLock(supabase as never, BRAND_ID);
    expect(result).toEqual({ ok: false, error: "Analysis already in progress" });
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "[analysis-lock] stale takeover rpc failed",
      expect.objectContaining({ brandId: BRAND_ID, code: "42883" }),
    );
    consoleErrorSpy.mockRestore();
  });

  it("rejects when the RPC call throws (network blip)", async () => {
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const supabase = {
      from: () => ({ select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: LOCKED(), error: null }) }) }) }),
      rpc: () => {
        throw new Error("network blip");
      },
    };
    const result = await tryAcquireAnalysisLock(supabase as never, BRAND_ID);
    expect(result).toEqual({ ok: false, error: "Analysis already in progress" });
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "[analysis-lock] stale takeover threw",
      expect.objectContaining({ brandId: BRAND_ID, error: "network blip" }),
    );
    consoleErrorSpy.mockRestore();
  });

  it("fails closed when locked as analysis_running but missing a token (pre-IPI-744 row)", async () => {
    const supabase = makeRpcSupabase(
      { id: BRAND_ID, intake_status: "analysis_running", analysis_lock_token: null, analysis_locked_at: null },
      async () => {
        throw new Error("rpc should not be called");
      },
    );
    const result = await tryAcquireAnalysisLock(supabase as never, BRAND_ID);
    expect(result).toEqual({ ok: false, error: "Analysis already in progress" });
  });

  it("exactly one of two concurrent takeover attempts wins (unit-level CAS proof)", async () => {
    // Models the RPC's real atomicity: the first UPDATE to commit changes
    // analysis_lock_token, so the second caller's WHERE (matching the old
    // token) no longer matches. See the live concurrency proof (IPI-745 PR)
    // for the real-database version of this guarantee.
    let currentToken = "old-token";
    const supabase = makeRpcSupabase(LOCKED(), async (args) => {
      if (args.p_expected_token !== currentToken) return { data: false, error: null };
      currentToken = args.p_new_token as string;
      return { data: true, error: null };
    });

    const [a, b] = await Promise.all([
      tryAcquireAnalysisLock(supabase as never, BRAND_ID),
      tryAcquireAnalysisLock(supabase as never, BRAND_ID),
    ]);

    const winners = [a, b].filter((r) => r.ok);
    expect(winners).toHaveLength(1);
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
