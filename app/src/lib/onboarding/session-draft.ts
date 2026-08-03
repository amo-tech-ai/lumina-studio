import type { OnboardingForm } from "./schema";
import {
  EMPTY_ANSWERS,
  type OnboardingAnswers,
} from "./navigation";

/** Persist / restore v2 answers inside onboarding_sessions.draft_answers. */
export function serializeDraftAnswers(
  answers: OnboardingAnswers,
): Record<string, unknown> {
  return {
    build: answers.build,
    brandName: answers.brandName,
    websiteUrl: answers.websiteUrl,
    listed: answers.listed,
    grow: answers.grow,
  };
}

export function parseDraftAnswers(raw: unknown): OnboardingAnswers {
  if (typeof raw !== "object" || raw === null) return { ...EMPTY_ANSWERS };
  const o = raw as Record<string, unknown>;
  const listed =
    typeof o.listed === "object" && o.listed !== null && !Array.isArray(o.listed)
      ? Object.fromEntries(
          Object.entries(o.listed as Record<string, unknown>).filter(
            ([, v]) => v === true,
          ).map(([k]) => [k, true as const]),
        )
      : {};
  return {
    build: typeof o.build === "string" ? o.build : null,
    brandName: typeof o.brandName === "string" ? o.brandName : "",
    websiteUrl: typeof o.websiteUrl === "string" ? o.websiteUrl : "",
    listed,
    grow: typeof o.grow === "string" ? o.grow : null,
  };
}

/** Map v2 answers → materialize RPC form (legacy fields not collected yet). */
export function answersToOnboardingForm(answers: OnboardingAnswers): OnboardingForm {
  return {
    brandName: answers.brandName.trim(),
    websiteUrl: answers.websiteUrl.trim(),
    instagramHandle: "",
    // ponytail: v2 does not collect industry/goal yet — map from build/grow until UI adds them.
    industry: answers.build?.trim() || "Fashion",
    goal: answers.grow?.trim() || "Brand Intelligence",
  };
}
