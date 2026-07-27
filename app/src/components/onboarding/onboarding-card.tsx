import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * IPI-833 — the shared card every onboarding screen sits in.
 *
 * All 13 screens use identical card chrome in the design comp: 480px max width,
 * 28px radius, 32px padding, white on the black page. Only the body differs —
 * which is exactly why the seven marketing screens share this shell but keep
 * their own visual components rather than collapsing into one conditional.
 */
export function OnboardingCard({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      data-testid="onboarding-card"
      className={cn(
        "w-full max-w-[var(--onboarding-card-width)]",
        "rounded-[var(--onboarding-card-radius)] bg-[var(--onboarding-card)]",
        "p-[var(--onboarding-card-pad)] text-[var(--onboarding-ink)]",
        "shadow-[0_24px_60px_rgb(0_0_0/0.4)]",
        className,
      )}
    >
      {children}
    </div>
  );
}
