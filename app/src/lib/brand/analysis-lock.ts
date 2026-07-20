import type { SupabaseClient } from "@supabase/supabase-js";

/** IPI-745 — matches waitForCrawlCompletion's ~50s timeout plus headroom. */
export const STALE_LOCK_THRESHOLD_SECONDS = 300;

export type AcquireLockResult =
  | { ok: true; runToken: string; priorStatus: string; tookOverStale: boolean }
  | { ok: false; error: string };

type BrandLockRow = {
  id: string;
  intake_status: string | null;
  analysis_lock_token: string | null;
  analysis_locked_at: string | null;
};

/**
 * Acquire the analysis_running lock on a brand. Fresh (no existing lock, or
 * lock in a terminal/non-locking status) acquires directly. A lock already
 * held as analysis_running is only taken over if it is stale — via the
 * take_over_stale_analysis_lock RPC, which re-checks staleness against
 * Postgres now() atomically at write time (IPI-745).
 */
export async function tryAcquireAnalysisLock(
  supabase: SupabaseClient,
  brandId: string,
): Promise<AcquireLockResult> {
  const { data: brand, error: fetchErr } = await supabase
    .from("brands")
    .select("id, intake_status, analysis_lock_token, analysis_locked_at")
    .eq("id", brandId)
    .maybeSingle<BrandLockRow>();

  if (fetchErr) {
    console.error("[analysis-lock] failed to read brand status", { brandId, code: fetchErr.code });
    return { ok: false, error: "Could not start analysis" };
  }
  if (!brand) return { ok: false, error: "Brand not found" };

  if (brand.intake_status === "crawl_running" || brand.intake_status === "draft_ready") {
    return { ok: false, error: "Analysis already in progress" };
  }

  const runToken = crypto.randomUUID();

  if (brand.intake_status !== "analysis_running") {
    const priorStatus = brand.intake_status ?? "ready";
    const { data: locked, error: lockErr } = await supabase
      .from("brands")
      .update({
        intake_status: "analysis_running",
        analysis_lock_token: runToken,
        analysis_locked_at: new Date().toISOString(),
      })
      .eq("id", brandId)
      .not("intake_status", "in", "(crawl_running,analysis_running,draft_ready)")
      .select("id")
      .maybeSingle();

    if (lockErr) {
      console.error("[analysis-lock] failed to acquire lock", { brandId, code: lockErr.code });
      return { ok: false, error: "Could not start analysis" };
    }
    if (!locked) return { ok: false, error: "Analysis already in progress" };
    return { ok: true, runToken, priorStatus, tookOverStale: false };
  }

  // Locked as analysis_running — no token means it predates IPI-744 or was
  // corrupted; fail closed rather than guess.
  if (!brand.analysis_lock_token || !brand.analysis_locked_at) {
    return { ok: false, error: "Analysis already in progress" };
  }

  try {
    const { data: tookOver, error: rpcErr } = await supabase.rpc("take_over_stale_analysis_lock", {
      p_brand_id: brandId,
      p_expected_token: brand.analysis_lock_token,
      p_new_token: runToken,
      p_stale_after_seconds: STALE_LOCK_THRESHOLD_SECONDS,
    });

    if (rpcErr) {
      console.error("[analysis-lock] stale takeover rpc failed", { brandId, code: rpcErr.code });
      return { ok: false, error: "Analysis already in progress" };
    }
    if (!tookOver) return { ok: false, error: "Analysis already in progress" };

    // The abandoned run's true prior status is lost — it was overwritten by
    // its own acquire. "failed" is a safe, visible restore target if this
    // takeover run also fails, rather than guessing "ready" for a brand that
    // may have been mid-onboarding.
    return { ok: true, runToken, priorStatus: "failed", tookOverStale: true };
  } catch (error) {
    console.error("[analysis-lock] stale takeover threw", {
      brandId,
      error: error instanceof Error ? error.message : String(error),
    });
    return { ok: false, error: "Analysis already in progress" };
  }
}

// IPI-744 — never throw: a failed restore must not mask the caller's
// original crawl/analysis error or reject the Server Action.
//
// Compare-and-swap on analysis_lock_token: only the run that currently owns
// the lock may restore. A newer run (fresh acquire or stale takeover)
// overwrites the token, so a late restore from an abandoned run is a no-op
// and cannot clobber the newer run's analysis_running / ready / scores_complete.
//
// Still skip draft_ready: brand-intelligence may write draft_ready while this
// client call still errors (lost response). Token alone would still match and
// could wipe a completed draft — keep the .neq guard.
export async function restoreAnalysisStatusIfOwned(
  supabase: SupabaseClient,
  brandId: string,
  status: string,
  runToken: string,
): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from("brands")
      .update({
        intake_status: status,
        analysis_lock_token: null,
        analysis_locked_at: null,
      })
      .eq("id", brandId)
      .eq("analysis_lock_token", runToken)
      .neq("intake_status", "draft_ready")
      .select("id")
      .maybeSingle();

    if (error) {
      console.error("[analysis-lock] failed to restore brand status", { brandId, code: error.code });
      return false;
    }
    if (!data) {
      // No row matched — token stolen by a newer run, already draft_ready, or
      // brand gone. Safe no-op.
      return false;
    }
    return true;
  } catch (error) {
    console.error("[analysis-lock] status restoration threw", {
      brandId,
      error: error instanceof Error ? error.message : String(error),
    });
    return false;
  }
}

/**
 * Clear this run's lock token on success. Own try/catch: this is
 * non-critical cleanup after a real success — a transient failure here must
 * not be allowed to report a completed analysis as failed.
 */
export async function releaseAnalysisLockIfOwned(
  supabase: SupabaseClient,
  brandId: string,
  runToken: string,
): Promise<void> {
  try {
    await supabase
      .from("brands")
      .update({ analysis_lock_token: null, analysis_locked_at: null })
      .eq("id", brandId)
      .eq("analysis_lock_token", runToken);
  } catch (error) {
    console.error("[analysis-lock] failed to clear lock token after success", {
      brandId,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}
