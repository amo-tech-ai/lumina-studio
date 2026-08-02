"use client";

import { useEffect, useRef, useState } from "react";

import { OnboardingCard } from "@/components/onboarding/onboarding-card";
import { Progress } from "@/components/ui/progress";
import { formatCrawlProgressLabel } from "@/lib/brand-hub/format-crawl-progress";
import { useBrandAnalysisProgress } from "@/lib/brand-hub/use-brand-analysis-progress";
import {
  isAnalysisReviewable,
  kickoffOnboardingCrawl,
  startOnboardingBrandIntelligence,
} from "@/lib/onboarding/kickoff-onboarding-analysis";
import { answersToOnboardingForm } from "@/lib/onboarding/session-draft";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { OnboardingAnswers } from "@/lib/onboarding/navigation";

const STATUS_COPY: Record<string, string> = {
  brand_created: "Preparing your workspace…",
  crawl_running: "Crawling your website…",
  crawl_complete: "Crawl complete — starting AI analysis…",
  analysis_running: "Building your Brand DNA…",
  scores_complete: "Scores ready — finishing up…",
  draft_ready: "Review ready…",
  ready: "Ready",
};

function progressPercent(
  intakeStatus: string,
  crawled: number | null | undefined,
  found: number | null | undefined,
): number {
  if (isAnalysisReviewable(intakeStatus)) return 100;
  if (intakeStatus === "analysis_running") return 85;
  if (intakeStatus === "crawl_complete") return 75;
  if (intakeStatus === "crawl_running" && crawled != null) {
    if (found != null && found > 0) {
      return Math.min(70, Math.round((crawled / found) * 70));
    }
    return Math.min(70, 15 + crawled);
  }
  if (intakeStatus === "brand_created") return 8;
  return 20;
}

export type AnalysisProgressScreenProps = {
  brandId: string | null;
  answers: OnboardingAnswers;
  onComplete: () => void;
  /** Forwarded to the shared hook; `0` disables still-working (tests). */
  quietGapMs?: number;
};

/**
 * IPI-835 · C — screen 12 driven by Realtime + server intake_status.
 * No client timer decides success or failure.
 */
export function AnalysisProgressScreen({
  brandId,
  answers,
  onComplete,
  quietGapMs,
}: AnalysisProgressScreenProps) {
  if (!brandId) {
    return (
      <OnboardingCard>
        <h1 className="m-0 text-[1.75rem] font-extrabold leading-tight tracking-tight">
          Setting things up
        </h1>
        <p
          role="alert"
          data-testid="analysis-status"
          aria-live="assertive"
          className="mt-2.5 text-sm leading-snug text-destructive"
        >
          Brand is not ready yet. Go back and continue again.
        </p>
      </OnboardingCard>
    );
  }

  return (
    <AnalysisProgressLive
      brandId={brandId}
      answers={answers}
      onComplete={onComplete}
      quietGapMs={quietGapMs}
    />
  );
}

function AnalysisProgressLive({
  brandId,
  answers,
  onComplete,
  quietGapMs,
}: {
  brandId: string;
  answers: OnboardingAnswers;
  onComplete: () => void;
  quietGapMs?: number;
}) {
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;
  const answersRef = useRef(answers);
  answersRef.current = answers;

  const [kickoffError, setKickoffError] = useState<string | null>(null);
  const biStartedRef = useRef(false);
  const completedRef = useRef(false);
  const crawlIdRef = useRef<string | undefined>(undefined);

  const { intakeStatus, crawl, phase, reconnect } = useBrandAnalysisProgress({
    brandId,
    initialStatus: "brand_created",
    quietGapMs,
  });

  // Idempotent crawl (+ BI when crawl already done / start failed).
  useEffect(() => {
    let cancelled = false;
    const supabase = createSupabaseBrowserClient();
    const form = answersToOnboardingForm(answersRef.current);
    const websiteUrl = answersRef.current.websiteUrl.trim();

    (async () => {
      try {
        const result = await kickoffOnboardingCrawl(supabase, brandId, websiteUrl);
        if (cancelled) return;

        if (result.kind === "already_done") {
          if (!completedRef.current) {
            completedRef.current = true;
            onCompleteRef.current();
          }
          return;
        }

        if (result.kind === "listen_only") return;

        if (result.kind === "crawl_started") {
          crawlIdRef.current = result.crawlId;
          if (result.startBiNow && !biStartedRef.current) {
            biStartedRef.current = true;
            await startOnboardingBrandIntelligence(supabase, brandId, form, {
              crawlResultId: result.crawlId,
            });
          }
          return;
        }

        setKickoffError(result.error);
        if (result.startBiNow && !biStartedRef.current) {
          biStartedRef.current = true;
          await startOnboardingBrandIntelligence(supabase, brandId, form);
        }
      } catch (err) {
        if (cancelled) return;
        setKickoffError(err instanceof Error ? err.message : "Could not start analysis");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [brandId]);

  // When crawl finishes after a deferred kickoff, start BI once.
  useEffect(() => {
    if (intakeStatus !== "crawl_complete") return;
    if (biStartedRef.current) return;
    biStartedRef.current = true;
    const supabase = createSupabaseBrowserClient();
    void startOnboardingBrandIntelligence(
      supabase,
      brandId,
      answersToOnboardingForm(answersRef.current),
      crawlIdRef.current ? { crawlResultId: crawlIdRef.current } : undefined,
    ).catch((err) => {
      setKickoffError(err instanceof Error ? err.message : "Brand analysis failed to start");
    });
  }, [brandId, intakeStatus]);

  // Advance to DNA review when server says analysis is reviewable.
  useEffect(() => {
    if (!isAnalysisReviewable(intakeStatus)) return;
    if (completedRef.current) return;
    completedRef.current = true;
    onCompleteRef.current();
  }, [intakeStatus]);

  if (phase === "failed") {
    return (
      <OnboardingCard>
        <h1 className="m-0 text-[1.75rem] font-extrabold leading-tight tracking-tight">
          Analysis failed
        </h1>
        <p
          role="alert"
          data-testid="analysis-status"
          aria-live="assertive"
          className="mt-2.5 text-sm leading-snug text-destructive"
        >
          {kickoffError ??
            "Something went wrong while analysing your brand. You can retry from Brand Hub."}
        </p>
      </OnboardingCard>
    );
  }

  if (phase === "connection_lost") {
    return (
      <OnboardingCard>
        <h1 className="m-0 text-[1.75rem] font-extrabold leading-tight tracking-tight">
          Connection lost
        </h1>
        <p className="mt-2.5 text-sm leading-snug text-[var(--onboarding-sub)]">
          Analysis may still be running on the server. Reconnect to resume live progress.
        </p>
        <p
          role="status"
          aria-live="polite"
          data-testid="analysis-status"
          className="mt-3 text-xs font-medium text-[var(--onboarding-weak)]"
        >
          Offline — not failed
        </p>
        <button
          type="button"
          onClick={reconnect}
          className="mt-5 rounded-full bg-[var(--onboarding-cta)] px-5 py-2.5 font-sans text-sm font-semibold text-[var(--onboarding-card)]"
        >
          Reconnect
        </button>
      </OnboardingCard>
    );
  }

  const crawled = crawl?.pages_crawled;
  const found = crawl?.pages_found;
  const showCrawlCount =
    (phase === "live" || phase === "still_working") &&
    intakeStatus === "crawl_running" &&
    crawled != null;
  const percent = progressPercent(intakeStatus, crawled, found);
  const statusText =
    phase === "still_working"
      ? "Still working — this is taking longer than usual…"
      : (STATUS_COPY[intakeStatus] ?? "Preparing your workspace…");

  return (
    <OnboardingCard>
      <h1 className="m-0 text-[1.75rem] font-extrabold leading-tight tracking-tight">
        Setting things up
      </h1>
      <p className="mt-2.5 text-sm leading-snug text-[var(--onboarding-sub)]">
        This only takes a moment.
      </p>

      <div className="mt-7">
        <Progress
          value={percent}
          aria-label="Setup progress"
          className="h-2 bg-[var(--onboarding-hair)] [&>*]:bg-[var(--onboarding-accent)]"
        />
        <p
          role="status"
          aria-live="polite"
          data-testid="analysis-status"
          className="mt-3 text-xs font-medium tabular-nums text-[var(--onboarding-muted)]"
        >
          {statusText}
          {showCrawlCount ? (
            <span className="ml-1 text-[var(--onboarding-accent-ink)]">
              ({formatCrawlProgressLabel(crawled!, found)})
            </span>
          ) : null}
        </p>
        {kickoffError ? (
          <p className="mt-2 text-xs text-[var(--onboarding-weak)]" role="status">
            Crawl warning: {kickoffError}. Analysis may still continue.
          </p>
        ) : null}
      </div>
    </OnboardingCard>
  );
}
