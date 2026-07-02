export type ScoreColorTokens = {
  high: string;
  mid: string;
  low: string;
};

export function scoreThresholdColor(score: number, tokens: ScoreColorTokens): string {
  if (score >= 80) return tokens.high;
  if (score >= 60) return tokens.mid;
  return tokens.low;
}
