"use client";

import { useEffect, useRef, useState } from "react";

import { OnboardingCard } from "@/components/onboarding/onboarding-card";
import { RestartAnalysisButton } from "@/components/brand-hub/restart-analysis-button";
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

  /** Recoverable crawl start warning — BI may still proceed. */
  const [crawlWarning, setCrawlWarning] = useState<string | null>(null);
  /** Fatal kickoff / BI start — analysis will not continue without retry. */
  const [fatalError, setFatalError] = useState<string | null>(null);
  /** Bumped by Retry to re-run the brandId-gated kickoff effect. */
  const [kickoffAttempt, setKickoffAttempt] = useState(0);
  /** True after kickoff effect settles (success or failure) — gates deferred BI. */
  const [kickoffSettled, setKickoffSettled] = useState(false);

  const biStartedRef = useRef(false);
  const completedRef = useRef(false);
  const crawlIdRef = useRef<string | undefined>(undefined);

  const { intakeStatus, crawl, phase, reconnect } = useBrandAnalysisProgress({
    brandId,
    initialStatus: "brand_created",
    quietGapMs,
  });

  // Idempotent crawl (+ BI when crawl already done / start failed).
  // brandId + kickoffAttempt gated; answers via answersRef (intentional).
  useEffect(() => {
    let cancelled = false;
    const supabase = createSupabaseBrowserClient();
    const form = answersToOnboardingForm(answersRef.current);
    const websiteUrl = answersRef.current.websiteUrl.trim();

    setKickoffSettled(false);
    setCrawlWarning(null);
    setFatalError(null);
    biStartedRef.current = false;
    crawlIdRef.current = undefined;

    (async () => {
      try {
        const result = await kickoffOnboardingCrawl(supabase, brandId, websiteUrl);
        if (cancelled) return;

        // Defensive: website is enforced at screen 4, so this should never
        // happen in normal flow. If it does (e.g. resumed session from before
        // the fix), surface a fatal error so Retry can recover.
        if (result.kind === "needs_website") {
          setFatalError("Website URL is required for Brand DNA analysis. Please go back and add it.");
          setKickoffSettled(true);
          return;
        }

        if (result.kind === "already_done") {
          if (!completedRef.current) {
            completedRef.current = true;
            onCompleteRef.current();
          }
          setKickoffSettled(true);
          return;
        }

        if (result.kind === "listen_only") {
          setKickoffSettled(true);
          return;
        }

        if (result.kind === "crawl_started") {
          // Store crawl id before marking settled so deferred BI can attach it.
          crawlIdRef.current = result.crawlId;
          setKickoffSettled(true);
          if (result.startBiNow && !biStartedRef.current) {
            biStartedRef.current = true;
            try {
              await startOnboardingBrandIntelligence(supabase, brandId, form, {
                crawlResultId: result.crawlId,
              });
            } catch (err) {
              if (!cancelled) {
                biStartedRef.current = false;
                setFatalError(
                  err instanceof Error ? err.message : "Brand analysis failed to start",
                );
              }
            }
          }
          return;
        }

        // crawl_failed — non-blocking; fall through to BI without crawl content.
        setCrawlWarning(result.error);
        setKickoffSettled(true);
        if (result.startBiNow && !biStartedRef.current) {
          biStartedRef.current = true;
          try {
            await startOnboardingBrandIntelligence(supabase, brandId, form);
          } catch (err) {
            if (!cancelled) {
              biStartedRef.current = false;
              setFatalError(
                err instanceof Error ? err.message : "Brand analysis failed to start",
              );
            }
          }
        }
      } catch (err) {
        if (cancelled) return;
        setFatalError(err instanceof Error ? err.message : "Could not start analysis");
        setKickoffSettled(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [brandId, kickoffAttempt]);

  // When crawl finishes after a deferred kickoff, start BI once — only after kickoff settled
  // so crawlIdRef is populated when a crawl already completed on mount.
  useEffect(() => {
    if (!kickoffSettled) return;
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
      biStartedRef.current = false;
      setFatalError(err instanceof Error ? err.message : "Brand analysis failed to start");
    });
  }, [brandId, intakeStatus, kickoffSettled]);

  // Advance to DNA review when server says analysis is reviewable.
  useEffect(() => {
    if (!isAnalysisReviewable(intakeStatus)) return;
    if (completedRef.current) return;
    completedRef.current = true;
    onCompleteRef.current();
  }, [intakeStatus]);

  const retryKickoff = () => {
    setFatalError(null);
    setCrawlWarning(null);
    setKickoffAttempt((n) => n + 1);
  };

  // Client kickoff/BI start failed — Retry re-runs idempotent kickoff.
  if (fatalError) {
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
          {fatalError}
        </p>
        <button
          type="button"
          onClick={retryKickoff}
          className="mt-5 rounded-full bg-[var(--onboarding-cta)] px-5 py-2.5 font-sans text-sm font-semibold text-[var(--onboarding-card)]"
        >
          Retry
        </button>
      </OnboardingCard>
    );
  }

  // Server terminal failed — listen-only kickoff is done; offer the shared
  // IPI-905/918 recovery action so users retry without leaving onboarding.
  // The restart API is stage-aware (reuse active crawl, restart failed crawl,
  // or re-run BI only) and idempotent — no duplicate crawl is started.
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
          Something went wrong while analysing your brand. Restart analysis to pick up where it stopped — you don't need to redo onboarding.
        </p>
        <RestartAnalysisButton brandId={brandId} />
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
        {crawlWarning ? (
          <p className="mt-2 text-xs text-[var(--onboarding-weak)]" role="status">
            Crawl warning: {crawlWarning}. Analysis may still continue.
          </p>
        ) : null}
      </div>
    </OnboardingCard>
  );
}
