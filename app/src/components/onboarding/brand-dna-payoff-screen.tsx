"use client";

import { OnboardingCard } from "@/components/onboarding/onboarding-card";

/**
 * IPI-833 — screen 13, the payoff.
 *
 * The pillars here are the SHAPE of a Brand DNA, not a result. Nothing on this
 * screen is derived from analysis, because no analysis has run — IPI-834 defines
 * the evidence-backed schema and IPI-835 feeds real values in. Copy is written so
 * it does not read as a finding.
 */
const PILLARS = [
  { title: "Voice", hint: "How your brand sounds" },
  { title: "Palette", hint: "The colours you own" },
  { title: "Audience", hint: "Who you speak to" },
  { title: "Positioning", hint: "Where you sit in the market" },
] as const;

export function BrandDnaPayoffScreen() {
  return (
    <OnboardingCard>
      <h1 className="m-0 text-[1.75rem] font-extrabold leading-tight tracking-tight">
        Your Brand DNA is next
      </h1>
      <p className="mt-2.5 text-sm leading-snug text-[var(--onboarding-sub)]">
        We&rsquo;ll build these four pillars from your own site and channels, and show you the
        evidence behind every one before anything is saved.
      </p>

      <ul className="mt-6 grid list-none grid-cols-2 gap-2.5 p-0">
        {PILLARS.map((pillar) => (
          <li
            key={pillar.title}
            data-testid={`pillar-${pillar.title.toLowerCase()}`}
            className="onb-slide rounded-[var(--radius-lg)] border border-[var(--onboarding-hair)] p-3"
          >
            <p className="m-0 text-sm font-bold">{pillar.title}</p>
            <p className="m-0 mt-1 text-xs text-[var(--onboarding-muted)]">{pillar.hint}</p>
          </li>
        ))}
      </ul>
    </OnboardingCard>
  );
}
