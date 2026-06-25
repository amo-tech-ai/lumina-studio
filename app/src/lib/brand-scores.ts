/** Base readiness scores written by brand-intelligence edge fn (IPI-46). */
export const BASE_SCORE_TYPES = [
  "visual",
  "audience",
  "consistency",
  "commerce_readiness",
] as const;

export type BaseScoreType = (typeof BASE_SCORE_TYPES)[number];

export type BrandScoreRow = { score_type: string; score: number };

/** DNA badge = average of all four base scores; 0 until profile is complete. */
export const computeDnaScore = (scores: BrandScoreRow[] | null | undefined): number => {
  if (!scores?.length) return 0;
  const byType = new Map(scores.map((s) => [s.score_type, s.score]));
  const values = BASE_SCORE_TYPES.map((t) => byType.get(t));
  if (values.some((v) => typeof v !== "number" || !Number.isFinite(v))) return 0;
  const avg = values.reduce((a, b) => a + (b as number), 0) / BASE_SCORE_TYPES.length;
  return Math.round(avg * 100) / 100;
};
