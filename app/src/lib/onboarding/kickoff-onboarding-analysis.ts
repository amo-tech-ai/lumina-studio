import type { SupabaseClient } from "@supabase/supabase-js";

import {
  invokeBrandIntelligence,
  invokeStartBrandCrawl,
  type OnboardingForm,
} from "@/lib/onboarding";

/** Mid-flight analysis — listen only; do not re-invoke edge functions. */
const LISTEN_ONLY = new Set(["analysis_running"]);

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
    const crawl = await invokeStartBrandCrawl(supabase, brandId, websiteUrl, {
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

/** Start Gemini/Groq brand-intelligence once crawl content is available (or crawl skipped). */
export async function startOnboardingBrandIntelligence(
  supabase: SupabaseClient,
  brandId: string,
  form: OnboardingForm,
  options?: { crawlResultId?: string },
): Promise<void> {
  await invokeBrandIntelligence(supabase, brandId, form, {
    ...(options?.crawlResultId ? { crawlResultId: options.crawlResultId } : {}),
  });
}
