"use client";

import Image from "next/image";

import { OnboardingCard } from "@/components/onboarding/onboarding-card";
import { cn } from "@/lib/utils";

/** DC line 505 — five build types, each with its own photo. */
const BUILD_OPTIONS = [
  { id: "fashion", label: "Fashion brand", image: 15 },
  { id: "clothing", label: "Clothing label", image: 16 },
  { id: "access", label: "Accessories & jewelry", image: 17 },
  { id: "beauty", label: "Beauty", image: 18 },
  { id: "both", label: "Both products & services", image: 19 },
] as const;

/**
 * IPI-833 — screen 2. Single-select; Continue is blocked while `build` is null.
 *
 * A radiogroup rather than a list of buttons so arrow keys work and the choice
 * is announced as one of five, not five unrelated toggles.
 */
export function BuildTypeQuestion({
  value,
  onChange,
}: {
  value: string | null;
  onChange: (next: string) => void;
}) {
  return (
    <OnboardingCard>
      <h1 className="m-0 text-[1.75rem] font-extrabold leading-tight tracking-tight">
        What are you building?
      </h1>
      <p className="mt-2.5 text-sm leading-snug text-[var(--onboarding-sub)]">
        This shapes the Brand DNA we generate for you.
      </p>

      <div role="radiogroup" aria-label="What are you building?" className="mt-6 grid gap-2.5">
        {BUILD_OPTIONS.map((option) => {
          const selected = value === option.label;
          return (
            <button
              key={option.id}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onChange(option.label)}
              data-testid={`build-option-${option.id}`}
              className={cn(
                "flex items-center gap-3 rounded-[var(--radius-lg)] border p-2.5 text-left",
                "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--onboarding-accent)]",
                selected
                  ? "border-[var(--onboarding-accent-line)] bg-[var(--onboarding-accent-tint)]"
                  : "border-[var(--onboarding-hair)] bg-transparent",
              )}
            >
              <Image
                src={`/onboarding/${option.image}-fashionos.jpeg`}
                alt=""
                width={44}
                height={44}
                className="h-11 w-11 rounded-[var(--radius-md)] object-cover"
              />
              <span className="text-sm font-semibold">{option.label}</span>
            </button>
          );
        })}
      </div>
    </OnboardingCard>
  );
}
