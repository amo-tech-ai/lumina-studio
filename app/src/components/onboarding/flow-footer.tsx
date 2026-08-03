"use client";

import { canBack, canSkip } from "@/lib/onboarding/navigation";

/**
 * IPI-833 — Back / Skip / Continue.
 *
 * Continue takes a real `disabled` attribute rather than a greyed-out style
 * that still submits. The current /app/onboarding page has no `disabled` on
 * either submit control (page.tsx:227 and :247), which is the defect this
 * replaces: validate before the click, not after it.
 */
export function FlowFooter({
  screen,
  continueDisabled,
  continueLabel = "Continue",
<<<<<<< HEAD
=======
  navigationDisabled = false,
>>>>>>> origin/main
  onBack,
  onSkip,
  onContinue,
}: {
  screen: number;
  continueDisabled: boolean;
  continueLabel?: string;
<<<<<<< HEAD
=======
  /** Disables Back/Skip while a commit (e.g. materialize) is in flight. */
  navigationDisabled?: boolean;
>>>>>>> origin/main
  onBack: () => void;
  onSkip: () => void;
  onContinue: () => void;
}) {
  return (
    <div className="mx-auto flex w-full max-w-[var(--onboarding-card-width)] items-center gap-3">
      {canBack(screen) ? (
        <button
          type="button"
          onClick={onBack}
<<<<<<< HEAD
          aria-label="Go back to the previous step"
          className="rounded-[var(--radius-pill)] border border-[var(--onboarding-hair)]/30 px-4 py-3 text-sm font-semibold text-[var(--onboarding-card)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--onboarding-accent)]"
=======
          disabled={navigationDisabled}
          aria-label="Go back to the previous step"
          className="rounded-[var(--radius-pill)] border border-[var(--onboarding-hair)]/30 px-4 py-3 text-sm font-semibold text-[var(--onboarding-card)] disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--onboarding-accent)]"
>>>>>>> origin/main
        >
          Back
        </button>
      ) : null}

      <button
        type="button"
        onClick={onContinue}
        disabled={continueDisabled}
        className="flex-1 rounded-[var(--radius-pill)] bg-[var(--onboarding-card)] px-6 py-3 text-sm font-bold text-[var(--onboarding-cta)] disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--onboarding-accent)]"
      >
        {continueLabel}
      </button>

      {canSkip(screen) ? (
        <button
          type="button"
          onClick={onSkip}
<<<<<<< HEAD
          aria-label="Skip this question"
          className="rounded-[var(--radius-pill)] px-4 py-3 text-sm font-semibold text-[var(--onboarding-card)]/70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--onboarding-accent)]"
=======
          disabled={navigationDisabled}
          aria-label="Skip this question"
          className="rounded-[var(--radius-pill)] px-4 py-3 text-sm font-semibold text-[var(--onboarding-card)]/70 disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--onboarding-accent)]"
>>>>>>> origin/main
        >
          Skip
        </button>
      ) : null}
    </div>
  );
}
