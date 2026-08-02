import type { SupabaseClient } from "@supabase/supabase-js";

import {
  invokeBrandIntelligence,
  invokeStartBrandCrawl,
  type OnboardingForm,
} from "@/lib/onboarding";

/**
 * Terminal / mid-flight — listen only; do not re-invoke edge functions.
 * `failed` must not auto-restart crawl (Brand Hub owns explicit retry).
 */
const LISTEN_ONLY = new Set(["analysis_running", "failed"]);

/** Analysis already finished enough for screen 13 (DNA review). */
export function isAnalysisReviewable(intakeStatus: string | null | undefined): boolean {
  return (
    intakeStatus === "scores_complete" ||
    intakeStatus === "draft_ready" ||
    intakeStatus === "ready"
  );
}

export type KickoffOnboardingCrawlResult =
  | { kind: "already_done"; intakeStatus: string }
  | { kind: "listen_only"; intakeStatus: string }
  /** Website intentionally blank — caller must not start crawl or BI (needs URL). */
  | { kind: "needs_website" }
  | { kind: "crawl_started"; crawlId: string; reused?: boolean; startBiNow: boolean }
  | { kind: "crawl_failed"; error: string; startBiNow: true };

/**
 * IPI-835 · C — idempotent crawl kickoff for `/onboarding` screen 12.
 *
 * `start-brand-crawl` reuses an in-flight/complete row for `onboarding-${brandId}`.
 * Brand intelligence starts when `startBiNow` is true (crawl already complete, or
 * crawl start failed — same fallthrough as legacy `/app/onboarding`).
 */
export async function kickoffOnboardingCrawl(
  supabase: SupabaseClient,
  brandId: string,
  websiteUrl: string,
): Promise<KickoffOnboardingCrawlResult> {
  const trimmedUrl = websiteUrl.trim();
  if (!trimmedUrl) {
    return { kind: "needs_website" };
  }

  const { data: brand, error } = await supabase
    .from("brands")
    .select("intake_status")
    .eq("id", brandId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message || "Failed to read brand intake status");
  }

  const intakeStatus =
    typeof brand?.intake_status === "string" ? brand.intake_status : "brand_created";

  if (isAnalysisReviewable(intakeStatus)) {
    return { kind: "already_done", intakeStatus };
  }

  if (LISTEN_ONLY.has(intakeStatus)) {
    return { kind: "listen_only", intakeStatus };
  }

  try {
    const crawl = await invokeStartBrandCrawl(supabase, brandId, trimmedUrl, {
      idempotencyKey: `onboarding-${brandId}`,
    });
    return {
      kind: "crawl_started",
      crawlId: crawl.crawlId,
      reused: crawl.reused,
      // Already past crawl → start BI now. Otherwise screen waits for Realtime crawl_complete.
      startBiNow: intakeStatus === "crawl_complete",
    };
  } catch (err) {
    return {
      kind: "crawl_failed",
      error: err instanceof Error ? err.message : "start-brand-crawl failed",
      startBiNow: true,
    };
  }
}

/**
 * Start Gemini/Groq brand-intelligence once crawl content is available (or crawl skipped).
 *
 * Claims `analysis_running` with a compare-and-swap so two tabs seeing the same
 * `crawl_complete` Realtime event cannot both invoke the LLM. Losers no-op.
 *
 * If the edge invoke fails after a successful claim, the claim is released so a
 * later retry can reclaim (client-side recovery; not a durable job queue).
 */
export async function startOnboardingBrandIntelligence(
  supabase: SupabaseClient,
  brandId: string,
  form: OnboardingForm,
  options?: { crawlResultId?: string },
): Promise<void> {
  const { data: claimed, error: claimErr } = await supabase
    .from("brands")
    .update({ intake_status: "analysis_running" })
    .eq("id", brandId)
    .in("intake_status", ["brand_created", "crawl_running", "crawl_complete"])
    .select("id")
    .maybeSingle();

  if (claimErr) {
    throw new Error(claimErr.message || "Failed to claim brand analysis");
  }
  if (!claimed) {
    // Another tab/session already claimed or analysis is past kickoff.
    return;
  }

  try {
    await invokeBrandIntelligence(supabase, brandId, form, {
      ...(options?.crawlResultId ? { crawlResultId: options.crawlResultId } : {}),
    });
  } catch (err) {
    // Best-effort release so Retry / remount can reclaim. Prefer crawl_complete when
    // we had crawl content; otherwise brand_created (no-website / crawl_failed path).
    const releaseTo = options?.crawlResultId ? "crawl_complete" : "brand_created";
    await supabase
      .from("brands")
      .update({ intake_status: releaseTo })
      .eq("id", brandId)
      .eq("intake_status", "analysis_running");
    throw err;
  }
}
