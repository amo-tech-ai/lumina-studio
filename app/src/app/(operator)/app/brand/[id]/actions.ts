"use server";

import { revalidatePath } from "next/cache";
import { discardBrandDraft } from "@/lib/brand/discard-draft";
import { processBrandIntelligenceDraftApproval } from "@/app/api/_lib/process-draft-approval";
import { promoteBrandDraft } from "@/lib/brand/promote-draft";
import { invokeBrandIntelligence, invokeStartBrandCrawl, waitForCrawlCompletion } from "@/lib/onboarding";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type ReanalyzeResult =
  | { ok: true; hasDraft: true }
  | { ok: false; error: string };

// IPI-744 — never throw: a failed restore must not mask the caller's
// original crawl/analysis error or reject the Server Action. Callers don't
// need the boolean today; it's here so a future caller (e.g. stale-lock
// recovery, IPI-745) can react to a failed restore without re-deriving this.
//
// Compare-and-swap on analysis_lock_token (migration PR #540): only the run
// that acquired the lock may restore. A newer reanalyzeBrand overwrites the
// token, so Run A's late restore is a no-op and cannot clobber Run B's
// analysis_running / ready / scores_complete.
//
// Still skip draft_ready: brand-intelligence may write draft_ready while this
// client call still errors (lost response). Token alone would still match and
// could wipe a completed draft — keep the .neq guard.
async function restoreBrandStatus(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
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
      console.error("[reanalyze] failed to restore brand status", { brandId, code: error.code });
      return false;
    }
    if (!data) {
      // No row matched — token stolen by a newer run, already draft_ready, or
      // brand gone. Safe no-op.
      return false;
    }
    return true;
  } catch (error) {
    console.error("[reanalyze] status restoration threw", {
      brandId,
      error: error instanceof Error ? error.message : String(error),
    });
    return false;
  }
}

export async function reanalyzeBrand(brandId: string): Promise<ReanalyzeResult> {
  if (!brandId) return { ok: false, error: "Brand id is required" };

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser();

  if (authErr || !user) {
    return { ok: false, error: "You must be signed in to re-analyze" };
  }

  const { data: brand, error: brandErr } = await supabase
    .from("brands")
    .select("id, name, brand_url, intake_status")
    .eq("id", brandId)
    .maybeSingle();

  if (brandErr || !brand) {
    return { ok: false, error: "Brand not found" };
  }

  if (!brand.brand_url?.trim()) {
    return { ok: false, error: "Brand has no website URL to analyze" };
  }

  if (
    brand.intake_status === "crawl_running" ||
    brand.intake_status === "analysis_running" ||
    brand.intake_status === "draft_ready"
  ) {
    return { ok: false, error: "Analysis already in progress" };
  }

  const priorStatus = brand.intake_status ?? "ready";
  const runToken = crypto.randomUUID();

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
    return { ok: false, error: "Could not start analysis" };
  }
  if (!locked) {
    return { ok: false, error: "Analysis already in progress" };
  }

  try {
    // IPI-738 — a brand with no prior crawl has no content for Groq
    // brand-intelligence to work from, and 422s immediately. Mirror the
    // onboarding flow (app/src/app/(operator)/app/onboarding/page.tsx):
    // start the crawl first, wait for it, then analyze with its content.
    // idempotencyKey is stable per brand, so a retry after a timeout reuses
    // the same in-flight crawl instead of starting a duplicate.
    let crawlResultId: string | undefined;
    try {
      const crawl = await invokeStartBrandCrawl(supabase, brandId, brand.brand_url, {
        idempotencyKey: `reanalyze-${brandId}`,
      });
      crawlResultId = crawl.crawlId;

      const crawlOutcome = await waitForCrawlCompletion(supabase, crawl.crawlId);
      if (crawlOutcome === "failed") {
        await restoreBrandStatus(supabase, brandId, priorStatus, runToken);
        return {
          ok: false,
          error: "We couldn't crawl this website. Check the URL is reachable and try again.",
        };
      }
      if (crawlOutcome === "timeout") {
        await restoreBrandStatus(supabase, brandId, priorStatus, runToken);
        return {
          ok: false,
          error: "Crawling this website is taking longer than expected. Try Start analysis again in a minute.",
        };
      }
    } catch (crawlErr) {
      // Firecrawl itself couldn't be reached (e.g. not configured) — proceed
      // without crawl context. Gemini can still analyze from the URL alone;
      // Groq will return its own specific "requires Firecrawl content" error.
      console.warn("[reanalyze] start-brand-crawl failed, continuing without crawl context:", crawlErr);
    }

    // draft_mode: true → edge fn writes ai_profile_draft, not ai_profile; skips scores upsert
    await invokeBrandIntelligence(
      supabase,
      brandId,
      { brandName: brand.name, websiteUrl: brand.brand_url, instagramHandle: "", industry: "", goal: "" },
      { draftMode: true, crawlResultId },
    );

    // Clear this run's lock token on success (edge may have set draft_ready).
    await supabase
      .from("brands")
      .update({ analysis_lock_token: null, analysis_locked_at: null })
      .eq("id", brandId)
      .eq("analysis_lock_token", runToken);

    revalidatePath(`/app/brand/${brandId}`);
    return { ok: true, hasDraft: true };
  } catch (err) {
    // Restore prior status so a failed re-analyze doesn't corrupt a healthy brand
    await restoreBrandStatus(supabase, brandId, priorStatus, runToken);
    const message = err instanceof Error ? err.message : "Re-analyze failed";
    return { ok: false, error: message };
  }
}

export async function applyDraft(brandId: string): Promise<{ ok: boolean; error?: string }> {
  if (!brandId) return { ok: false, error: "Brand id is required" };

  const supabase = await createSupabaseServerClient();
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) return { ok: false, error: "Not signed in" };

  const result = await promoteBrandDraft(supabase, brandId);
  if (!result.ok) return result;

  revalidatePath(`/app/brand/${brandId}`);
  return { ok: true };
}

export async function approveWorkflowDraft(brandId: string, runId: string): Promise<{ ok: boolean; error?: string }> {
  if (!brandId || !runId) return { ok: false, error: "brandId and runId required" };

  const supabase = await createSupabaseServerClient();
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) return { ok: false, error: "Not signed in" };

  const result = await processBrandIntelligenceDraftApproval({
    runId,
    approved: true,
    operatorId: user.id,
    expectedBrandId: brandId,
  });
  if (!result.ok) {
    return {
      ok: false,
      error: result.error.includes("already processed") ? "already_processed" : result.error,
    };
  }

  revalidatePath(`/app/brand/${brandId}`);
  return { ok: true };
}

export async function rejectWorkflowDraft(brandId: string, runId: string): Promise<{ ok: boolean; error?: string }> {
  if (!brandId || !runId) return { ok: false, error: "brandId and runId required" };

  const supabase = await createSupabaseServerClient();
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) return { ok: false, error: "Not signed in" };

  const result = await processBrandIntelligenceDraftApproval({
    runId,
    approved: false,
    operatorId: user.id,
    expectedBrandId: brandId,
  });
  if (!result.ok) {
    return {
      ok: false,
      error: result.error.includes("already processed") ? "already_processed" : result.error,
    };
  }

  revalidatePath(`/app/brand/${brandId}`);
  return { ok: true };
}

export async function discardDraft(brandId: string): Promise<{ ok: boolean; error?: string }> {
  if (!brandId) return { ok: false, error: "Brand id is required" };

  const supabase = await createSupabaseServerClient();
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) return { ok: false, error: "Not signed in" };

  const result = await discardBrandDraft(supabase, brandId);
  if (!result.ok) return result;

  revalidatePath(`/app/brand/${brandId}`);
  return { ok: true };
}
