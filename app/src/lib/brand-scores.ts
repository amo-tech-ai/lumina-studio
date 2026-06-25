/** Base readiness scores written by brand-intelligence edge fn (IPI-46). */
export const BASE_SCORE_TYPES = [
  "visual",
  "audience",
  "consistency",
  "commerce_readiness",
] as const;

export type BaseScoreType = (typeof BASE_SCORE_TYPES)[number];

export type BrandScoreRow = { score_type: string; score: number };

/** DNA badge = average of the four base scores (0 when none present). */
export const computeDnaScore = (scores: BrandScoreRow[] | null | undefined): number => {
  if (!scores?.length) return 0;
  const byType = new Map(scores.map((s) => [s.score_type, s.score]));
  const values = BASE_SCORE_TYPES.map((t) => byType.get(t)).filter(
    (n): n is number => typeof n === "number" && Number.isFinite(n),
  );
  if (!values.length) return 0;
  const avg = values.reduce((a, b) => a + b, 0) / values.length;
  return Math.round(avg * 100) / 100;
};
