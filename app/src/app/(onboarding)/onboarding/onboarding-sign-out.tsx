"use client";

import { SignOutButton } from "@/components/operator-panel/sign-out-button";

/**
 * IPI-945 — standalone `/onboarding` is outside `(operator)` / OperatorPanel.
 * Zero-brand `/app` → `/onboarding` must still offer account switch / exit.
 */
export function OnboardingSignOut() {
  return (
    <div className="onboarding-sign-out">
      <SignOutButton showLabel />
    </div>
  );
}
