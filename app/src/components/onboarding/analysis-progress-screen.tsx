"use client";

import { useEffect, useRef, useState } from "react";

import { OnboardingCard } from "@/components/onboarding/onboarding-card";
import { Progress } from "@/components/ui/progress";

/**
 * IPI-833 — screen 12.
 *
 * ⚠️ This bar is a PLACEHOLDER, and deliberately so. The design comp advances it
 * on a timer (line 438: setInterval 110ms, +2.5% a tick), which is not progress
 * — it is an animation that would keep filling while the backend was on fire.
 *
 * IPI-835 replaces this entirely with real `brand_crawls` page counts and a
 * server-owned terminal state. Nothing here may survive that: no client timer
 * can be allowed to decide a run succeeded or failed.
 *
 * Until then it advertises what it is ("Setting things up"), never claims a
 * measured result, and hands control back through onComplete.
 */
const TICK_MS = 110;
const STEP_PERCENT = 2.5;
const SETTLE_MS = 650;

export function AnalysisProgressScreen({ onComplete }: { onComplete: () => void }) {
  const [percent, setPercent] = useState(0);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    // Started once, here. The design comp starts it from both goScreen() and
    // componentDidUpdate and relies on clearInterval to paper over the double
    // start — that bug is not ported.
    let settleTimer: ReturnType<typeof setTimeout> | undefined;

    const interval = setInterval(() => {
      setPercent((current) => {
        const next = Math.min(100, current + STEP_PERCENT);
        if (next >= 100 && current < 100) {
          clearInterval(interval);
          settleTimer = setTimeout(() => onCompleteRef.current(), SETTLE_MS);
        }
        return next;
      });
    }, TICK_MS);

    return () => {
      clearInterval(interval);
      if (settleTimer) clearTimeout(settleTimer);
    };
  }, []);

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
          className="h-2 bg-[var(--onboarding-hair)]"
        />
        <p
          role="status"
          aria-live="polite"
          data-testid="analysis-status"
          className="mt-3 text-xs font-medium tabular-nums text-[var(--onboarding-muted)]"
        >
          {percent < 100 ? "Preparing your workspace…" : "Ready"}
        </p>
      </div>
    </OnboardingCard>
  );
}
