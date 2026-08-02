"use client";

import { useEffect, useRef } from "react";

import { OnboardingFlow } from "@/components/onboarding/onboarding-flow";
import { Skeleton } from "@/components/ui/skeleton";
import { useOnboardingSession } from "@/lib/onboarding/use-onboarding-session";

/**
 * IPI-835 · B1 / IPI-903 — loads the real onboarding_sessions draft before mounting the flow.
 * Keeps `OnboardingFlow` testable without Supabase.
 */
export function OnboardingSessionGate() {
  const session = useOnboardingSession();
  const errorPanelRef = useRef<HTMLDivElement>(null);

  // Match onboarding-flow screen transitions: move focus into the error panel
  // when bootstrap fails so screen readers announce the alert + retry control.
  useEffect(() => {
    if (session.status !== "error") return;
    const panel = errorPanelRef.current;
    if (!panel) return;
    panel.tabIndex = -1;
    panel.focus();
  }, [session.status]);

  if (session.status === "loading") {
    return (
      <div className="flex min-h-full items-center justify-center p-4">
        <Skeleton className="h-96 w-full max-w-[var(--onboarding-card-width)] rounded-[var(--onboarding-card-radius)]" />
      </div>
    );
  }

  if (session.status === "error") {
    return (
      <div
        ref={errorPanelRef}
        className="flex min-h-full items-center justify-center p-6 outline-none"
        role="alert"
        data-testid="onboarding-session-error"
      >
        <div className="max-w-md space-y-3 text-center">
          <h1 className="font-serif text-2xl text-[var(--onboarding-card)]">
            Couldn’t resume setup
          </h1>
          <p className="font-sans text-sm text-[var(--onboarding-sub)]">
            {session.message}
          </p>
          <button
            type="button"
            onClick={session.retry}
            data-testid="onboarding-session-retry"
            className="rounded-full bg-[var(--onboarding-card)] px-5 py-2.5 font-sans text-sm font-semibold text-[var(--onboarding-cta)]"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <OnboardingFlow
      initialScreen={session.currentScreen}
      initialAnswers={session.answers}
      initialBrandId={session.brandId}
      onDraftChange={session.saveDraft}
      onCommitAnalysis={session.materialize}
    />
  );
}
