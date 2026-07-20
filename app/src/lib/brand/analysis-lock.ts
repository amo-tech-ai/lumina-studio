import type { SupabaseClient } from "@supabase/supabase-js";

export type AcquireLockResult =
  | { ok: true; runToken: string; priorStatus: string }
  | { ok: false; error: string };

type BrandLockRow = {
  id: string;
  intake_status: string | null;
};

/**
 * Acquire the analysis_running lock on a brand. Atomically rejects if the
 * brand is already locked (crawl_running/analysis_running/draft_ready).
 *
 * A brand stuck in analysis_running forever (e.g. a crashed run) is not
 * recovered here — IPI-745's pg_cron sweep (expire_stale_brand_analysis,
 * 20260720163043) resets truly-abandoned analysis_running rows on a
 * schedule instead, so this function sees intake_status move on within the
 * sweep window and a fresh acquire succeeds normally. That replaced an
 * earlier synchronous takeover RPC here (take_over_stale_analysis_lock,
 * dropped): its null-tolerant predicate let any brand mid-analysis be taken
 * over as if abandoned, because two live writers (brand-intelligence edge
 * function, brand-intelligence-workflow) never set the lock columns at all.
 */
export async function tryAcquireAnalysisLock(
  supabase: SupabaseClient,
  brandId: string,
): Promise<AcquireLockResult> {
  const { data: brand, error: fetchErr } = await supabase
    .from("brands")
    .select("id, intake_status")
    .eq("id", brandId)
    .maybeSingle<BrandLockRow>();

  if (fetchErr) {
    console.error("[analysis-lock] failed to read brand status", { brandId, code: fetchErr.code });
    return { ok: false, error: "Could not start analysis" };
  }
  if (!brand) return { ok: false, error: "Brand not found" };

  if (
    brand.intake_status === "crawl_running" ||
    brand.intake_status === "analysis_running" ||
    brand.intake_status === "draft_ready"
  ) {
    return { ok: false, error: "Analysis already in progress" };
  }

  const priorStatus = brand.intake_status ?? "ready";
  const runToken = crypto.randomUUID();

  // analysis_locked_at is intentionally omitted — the brands_stamp_analysis_locked_at
  // trigger stamps it from Postgres now() whenever analysis_lock_token is set,
  // keeping it on the same DB clock the cron sweep compares against.
  const { data: locked, error: lockErr } = await supabase
    .from("brands")
    .update({
      intake_status: "analysis_running",
      analysis_lock_token: runToken,
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
  return { ok: true, runToken, priorStatus };
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
