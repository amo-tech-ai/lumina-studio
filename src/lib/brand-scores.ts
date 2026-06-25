/** Base 4 — drives the computed DNA badge */
export const BASE_SCORE_TYPES = [
  "visual",
  "audience",
  "consistency",
  "commerce_readiness",
] as const;

/** Extended 6 — displayed alongside base 4 in the scores grid */
export const EXTENDED_SCORE_TYPES = [
  "brand_clarity",
  "content_strength",
  "social_presence",
  "digital_experience",
  "sustainability_signal",
  "photography_readiness",
] as const;

export const ALL_SCORE_TYPES = [
  ...BASE_SCORE_TYPES,
  ...EXTENDED_SCORE_TYPES,
] as const;

export type ScoreType = (typeof ALL_SCORE_TYPES)[number];

export const SCORE_LABELS: Record<string, string> = {
  visual: "Visual Identity",
  audience: "Audience Clarity",
  consistency: "Brand Consistency",
  commerce_readiness: "Commerce Readiness",
  brand_clarity: "Brand Clarity",
  content_strength: "Content Strength",
  social_presence: "Social Presence",
  digital_experience: "Digital Experience",
  sustainability_signal: "Sustainability Signal",
  photography_readiness: "Photography Readiness",
};

export const SCORE_DESCRIPTIONS: Record<string, string> = {
  visual: "Visual identity clarity, palette cohesion, imagery quality",
  audience: "Audience clarity — defined personas, targeting precision",
  consistency: "Cross-page consistency — brand voice, visual, messaging",
  commerce_readiness: "E-commerce readiness — product pages, checkout, SEO",
  brand_clarity: "Mission, values, UVP clarity and differentiation",
  content_strength: "Content pillar depth and editorial quality",
  social_presence: "Social channel coverage, follower signal, engagement",
  digital_experience: "Site UX, mobile responsiveness, page speed",
  sustainability_signal: "Eco, ethical, and sustainability indicators",
  photography_readiness: "Product imagery quality and shoot readiness",
};

export function scoreColor(score: number): string {
  if (score >= 80) return "#059669";
  if (score >= 50) return "#D97706";
  return "#DC2626";
}

export function scoreLabel(score: number): string {
  if (score >= 80) return "Strong";
  if (score >= 50) return "Needs Work";
  return "Attention";
}

/**
 * DNA badge = AVG of base 4 scores only.
 * Never includes extended dimensions — DNA is a computed UI value, not stored.
 */
export function computeDnaScore(
  scores: { score_type: string; score: number }[],
): number | null {
  const base = scores.filter((s) =>
    (BASE_SCORE_TYPES as readonly string[]).includes(s.score_type),
  );
  if (base.length === 0) return null;
  const total = base.reduce((sum, s) => sum + s.score, 0);
  return Math.round(total / base.length);
}

/** Check if a score type is a base type */
export function isBaseScoreType(scoreType: string): boolean {
  return (BASE_SCORE_TYPES as readonly string[]).includes(scoreType);
}

/** Filter out legacy dna_readiness rows from a scores array */
export function filterScores<T extends { score_type: string }>(scores: T[]): T[] {
  return scores.filter((s) => s.score_type !== "dna_readiness");
}
