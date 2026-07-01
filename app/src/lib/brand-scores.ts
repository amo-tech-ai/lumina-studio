/** Base readiness scores written by brand-intelligence edge fn (IPI-46). */
export const BASE_SCORE_TYPES = [
  "visual",
  "audience",
  "consistency",
  "commerce_readiness",
] as const;

export type BaseScoreType = (typeof BASE_SCORE_TYPES)[number];

export type BrandScoreRow = { score_type: string; score: number };

/** Preserve null from DB; never coerce null → 0 (IPI-284 panel route). */
export function parseBrandScore(value: unknown): number | null {
  if (value == null) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

/** DNA badge = average of all four base scores; 0 until profile is complete. */
export const computeDnaScore = (scores: BrandScoreRow[] | null | undefined): number => {
  if (!scores?.length) return 0;
  const byType = new Map(scores.map((s) => [s.score_type, s.score]));
  let sum = 0;
  for (const scoreType of BASE_SCORE_TYPES) {
    const value = byType.get(scoreType);
    if (typeof value !== "number" || !Number.isFinite(value)) return 0;
    sum += value;
  }
  const avg = sum / BASE_SCORE_TYPES.length;
  return Math.round(avg * 100) / 100;
};
