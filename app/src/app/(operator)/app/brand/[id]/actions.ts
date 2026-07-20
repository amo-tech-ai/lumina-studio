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
// The update is conditional on intake_status NOT already being "draft_ready"
// (checked via .select("id").maybeSingle() to prove whether a row actually
// matched) — draft_ready is the one state that must never be clobbered: a
// late-arriving brand-intelligence success (edge function writes draft_ready
// server-side, but the client-visible invokeBrandIntelligence call still
// errors — e.g. the response is lost) must not have this cleanup blindly
// overwrite it back to priorStatus, hiding a completed draft behind a stale
// error.
//
// This is deliberately NOT `.eq("intake_status", "analysis_running")":
// firecrawl-webhook's crawl.failed/crawl.completed handlers (using the
// service-role client) can independently flip intake_status to "failed" or
// "crawl_complete" *before* this restore runs — that's the common case for a
// real crawl failure, not an edge case, since the webhook typically lands
// well within waitForCrawlCompletion's 2.5s poll interval. Requiring the
// status to still equal "analysis_running" made restore silently no-op on
// exactly the failure path it exists to handle. Everything except
// draft_ready is safe to restore over.
async function restoreBrandStatus(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  brandId: string,
  status: string,
): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from("brands")
      .update({ intake_status: status })
      .eq("id", brandId)
      .neq("intake_status", "draft_ready")
      .select("id")
      .maybeSingle();

    if (error) {
      console.error("[reanalyze] failed to restore brand status", { brandId, code: error.code });
      return false;
    }
    if (!data) {
      // No row matched — status is already draft_ready (a real success
      // landed) or the brand id doesn't exist. Nothing to restore; not a
      // failure.
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

  const { data: locked, error: lockErr } = await supabase
    .from("brands")
    .update({ intake_status: "analysis_running" })
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
        await restoreBrandStatus(supabase, brandId, priorStatus);
        return {
          ok: false,
          error: "We couldn't crawl this website. Check the URL is reachable and try again.",
        };
      }
      if (crawlOutcome === "timeout") {
        await restoreBrandStatus(supabase, brandId, priorStatus);
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

    revalidatePath(`/app/brand/${brandId}`);
    return { ok: true, hasDraft: true };
  } catch (err) {
    // Restore prior status so a failed re-analyze doesn't corrupt a healthy brand
    await restoreBrandStatus(supabase, brandId, priorStatus);
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
