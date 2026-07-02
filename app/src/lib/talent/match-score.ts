// IPI-308 · MODEL-P2 — filter-based fit scoring (no embeddings for MVP).
// Shared by the model-match agent's computeTalentMatchScore tool and the
// Talent tab UI so score/confidence/why never drift between agent and page.
import type { TalentResult } from "./types";

export type MatchScoreInput = {
  talent: TalentResult;
  shootType?: string;
  representationPreferred?: "independent" | "agency";
};

export type MatchScore = {
  score: number;
  confidence: number;
  why: string;
};

export function computeMatchScore({
  talent,
  shootType,
  representationPreferred,
}: MatchScoreInput): MatchScore {
  let score = 60;
  const reasons: string[] = [];

  if (talent.is_available) {
    score += 20;
    reasons.push("available for the requested dates");
  } else {
    reasons.push("availability not confirmed for these dates");
  }

  if (
    representationPreferred &&
    (representationPreferred === "agency") === talent.is_agency_represented
  ) {
    score += 10;
    reasons.push(`${representationPreferred} representation matches your preference`);
  }

  if (
    shootType &&
    Array.isArray(talent.ai_tags?.shoot_types) &&
    (talent.ai_tags.shoot_types as unknown[]).some(
      (t) => typeof t === "string" && t.toLowerCase() === shootType.toLowerCase(),
    )
  ) {
    score += 10;
    reasons.push(`tagged for ${shootType} work`);
  }

  score = Math.min(100, score);
  const confidence = talent.verification_status === "verified" ? 90 : 65;

  return {
    score,
    confidence,
    why: reasons.length
      ? `${talent.display_name} — ${reasons.join(", ")}.`
      : `${talent.display_name} — general match, limited profile data to score against.`,
  };
}
