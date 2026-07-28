import type { ReactNode } from "react";

import {
  ContentPackBody,
  GoalsDashboardBody,
  PhoneAdBody,
  ProofTilesBody,
  ScoreComparisonBody,
  SocialFunnelBody,
  TestimonialBody,
} from "@/components/onboarding/marketing/marketing-bodies";
import { OnboardingCard } from "@/components/onboarding/onboarding-card";

/**
 * IPI-833 · ONB2-UI-001 — Standalone Onboarding Route, Screens, and Deterministic State Machine
 * the seven marketing interstitials.
 *
 * Shared shell, distinct bodies. The heading and subcopy live here; the visual
 * belongs to its own component so the seven cannot drift into one another.
 */
type MarketingContent = {
  heading: string;
  subcopy?: string;
  body: ReactNode;
};

const MARKETING_CONTENT: Record<number, MarketingContent> = {
  1: {
    // The comp opened with "We've helped 10,000+ fashion brands launch". There is
    // no source for that number, so it says what the product does instead.
    heading: "Build your fashion brand with AI",
    subcopy:
      "Answer a few quick questions and iPix will create your Brand DNA, positioning, and personalized next steps.",
    body: <ProofTilesBody />,
  },
  3: {
    heading: "iPix builds your Brand DNA fast",
    subcopy: "Trained on top fashion houses — watch your identity score climb.",
    body: <ScoreComparisonBody />,
  },
  6: {
    heading: "“21 sales in the first hour!”",
    body: <TestimonialBody />,
  },
  8: {
    heading: "Turn your brand into cash flow with ads run by AI",
    subcopy: "Create, launch and optimize high-performing ads automatically — no team needed.",
    body: <PhoneAdBody />,
  },
  9: {
    heading: "Make your ad budget work smarter with AI",
    subcopy: "Test, learn and scale what works — so your money works harder.",
    body: <GoalsDashboardBody />,
  },
  10: {
    heading: "Go viral on socials and 10× your orders",
    subcopy: "iPix taps into social algorithms to turn attention into customers.",
    body: <SocialFunnelBody />,
  },
  11: {
    heading: "Go from clicks to sales in minutes, not weeks",
    subcopy: "Generate a full content pack in one click — test faster, grow sooner.",
    body: <ContentPackBody />,
  },
};

export function MarketingScreen({ screen }: { screen: number }) {
  const content = MARKETING_CONTENT[screen];
  if (!content) return null;

  return (
    <OnboardingCard>
      <h1 className="m-0 text-[1.7rem] font-extrabold leading-tight tracking-tight">
        {content.heading}
      </h1>
      {content.subcopy ? (
        <p className="mt-2.5 text-sm leading-snug text-[var(--onboarding-sub)]">
          {content.subcopy}
        </p>
      ) : null}
      {content.body}
    </OnboardingCard>
  );
}
