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
 * IPI-833 · ONB2-UI-001 — Standalone Onboarding Route, Screens, and Deterministic State Machine
 * screen 2. Single-select; Continue is blocked while `build` is null.
 *
 * Native radios supply the browser's arrow-key and form semantics without a
 * custom keyboard handler. The stable option ID is stored; the label is display
 * copy only and can change without changing persisted answers.
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

      <fieldset className="mt-6 grid gap-2.5 border-0 p-0">
        <legend className="sr-only">What are you building?</legend>
        {BUILD_OPTIONS.map((option) => {
          const selected = value === option.id;
          return (
            <label
              key={option.id}
              className={cn(
                "flex cursor-pointer items-center gap-3 rounded-[var(--radius-lg)] border p-2.5 text-left",
                "focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-[var(--onboarding-accent)]",
                selected
                  ? "border-[var(--onboarding-accent-line)] bg-[var(--onboarding-accent-tint)]"
                  : "border-[var(--onboarding-hair)] bg-transparent",
              )}
            >
              <input
                type="radio"
                name="build"
                value={option.id}
                checked={selected}
                onChange={() => onChange(option.id)}
                data-testid={`build-option-${option.id}`}
                className="sr-only"
              />
              <Image
                src={`/onboarding/${option.image}-fashionos.jpeg`}
                alt=""
                width={44}
                height={44}
                className="h-11 w-11 rounded-[var(--radius-md)] object-cover"
              />
              <span className="text-sm font-semibold">{option.label}</span>
            </label>
          );
        })}
      </fieldset>
    </OnboardingCard>
  );
}
