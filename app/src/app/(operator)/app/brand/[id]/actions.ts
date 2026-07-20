"use server";

import { revalidatePath } from "next/cache";
import { discardBrandDraft } from "@/lib/brand/discard-draft";
import { processBrandIntelligenceDraftApproval } from "@/app/api/_lib/process-draft-approval";
import { promoteBrandDraft } from "@/lib/brand/promote-draft";
import {
  releaseAnalysisLockIfOwned,
  restoreAnalysisStatusIfOwned,
  tryAcquireAnalysisLock,
} from "@/lib/brand/analysis-lock";
import { invokeBrandIntelligence, invokeStartBrandCrawl, waitForCrawlCompletion } from "@/lib/onboarding";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type ReanalyzeResult =
  | { ok: true; hasDraft: true }
  | { ok: false; error: string };

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
    .select("id, name, brand_url")
    .eq("id", brandId)
    .maybeSingle();

  if (brandErr || !brand) {
    return { ok: false, error: "Brand not found" };
  }

  if (!brand.brand_url?.trim()) {
    return { ok: false, error: "Brand has no website URL to analyze" };
  }

  // IPI-745 — fresh-vs-stale-aware lock acquire. A brand already locked as
  // analysis_running is not an automatic rejection: if that lock is older
  // than STALE_LOCK_THRESHOLD_SECONDS, this atomically takes it over instead
  // of leaving the brand stuck forever behind an abandoned run.
  const acquired = await tryAcquireAnalysisLock(supabase, brandId);
  if (!acquired.ok) {
    return { ok: false, error: acquired.error };
  }
  const { runToken, priorStatus } = acquired;

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
        await restoreAnalysisStatusIfOwned(supabase, brandId, priorStatus, runToken);
        return {
          ok: false,
          error: "We couldn't crawl this website. Check the URL is reachable and try again.",
        };
      }
      if (crawlOutcome === "timeout") {
        await restoreAnalysisStatusIfOwned(supabase, brandId, priorStatus, runToken);
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
    await releaseAnalysisLockIfOwned(supabase, brandId, runToken);

    revalidatePath(`/app/brand/${brandId}`);
    return { ok: true, hasDraft: true };
  } catch (err) {
    // Restore prior status so a failed re-analyze doesn't corrupt a healthy brand
    await restoreAnalysisStatusIfOwned(supabase, brandId, priorStatus, runToken);
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
