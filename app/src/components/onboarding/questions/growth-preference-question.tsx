"use client";

import { OnboardingCard } from "@/components/onboarding/onboarding-card";
import { cn } from "@/lib/utils";

/** DC line 518. The affirmation changes copy only — it never changes routing. */
const GROWTH_OPTIONS = [
  {
    label: "Social media",
    affirmation:
      "Smart — we'll turn your social posts into a steady stream of customers.",
  },
  {
    label: "Paid ads",
    affirmation:
      "Perfect — our AI runs and optimizes your ads so every dollar works harder.",
  },
  { label: "Both", affirmation: "Great choice! We'll combine ads and social to grow you faster." },
  {
    label: "No plan yet — FashionOS decides",
    affirmation: "No problem — FashionOS will pick the highest-ROI mix for you.",
  },
] as const;

/** IPI-833 — screen 7. Single-select; Continue is blocked while `grow` is null. */
export function GrowthPreferenceQuestion({
  value,
  onChange,
}: {
  value: string | null;
  onChange: (next: string) => void;
}) {
  const affirmation = GROWTH_OPTIONS.find((option) => option.label === value)?.affirmation;

  return (
    <OnboardingCard>
      <h1 className="m-0 text-[1.75rem] font-extrabold leading-tight tracking-tight">
        Preferred way to grow?
      </h1>
      <p className="mt-2.5 text-sm leading-snug text-[var(--onboarding-sub)]">
        We&rsquo;ll bias your plan toward what you pick.
      </p>

      <div role="radiogroup" aria-label="Preferred way to grow" className="mt-6 grid gap-2.5">
        {GROWTH_OPTIONS.map((option) => {
          const selected = value === option.label;
          return (
            <button
              key={option.label}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onChange(option.label)}
              data-testid={`grow-option-${option.label.split(" ")[0].toLowerCase()}`}
              className={cn(
                "rounded-[var(--radius-lg)] border p-3 text-left text-sm font-semibold",
                "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--onboarding-accent)]",
                selected
                  ? "border-[var(--onboarding-accent-line)] bg-[var(--onboarding-accent-tint)]"
                  : "border-[var(--onboarding-hair)]",
              )}
            >
              {option.label}
            </button>
          );
        })}
      </div>

      {affirmation ? (
        <p
          aria-live="polite"
          data-testid="grow-affirmation"
          className="onb-slide mt-4 rounded-[var(--radius-md)] bg-[var(--onboarding-accent-tint)] p-3 text-xs font-medium text-[var(--onboarding-accent-ink)]"
        >
          {affirmation}
        </p>
      ) : null}
    </OnboardingCard>
  );
}
