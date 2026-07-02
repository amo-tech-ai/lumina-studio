import { scoreLabel } from "@/lib/brand-utils";

type PillarScore = { score_type: string; score: number };

export function brandDetailGreeting(
  brandName: string,
  dnaScore: number,
  baseScores: PillarScore[],
): string {
  if (dnaScore <= 0) {
    return `${brandName} is set up but hasn't been analysed yet. I can crawl the site and build the DNA profile — takes about 2 minutes.`;
  }

  if (baseScores.length === 0) {
    return `${brandName} DNA: ${Math.round(dnaScore)}. Open a pillar in the intelligence panel for evidence and improvements.`;
  }

  const sorted = [...baseScores].sort((a, b) => b.score - a.score);
  const strongest = sorted[0];
  const weakest = sorted[sorted.length - 1];

  return `${brandName} DNA: ${Math.round(dnaScore)}. Strongest: ${scoreLabel(strongest.score_type)} (${Math.round(strongest.score)}). Weakest: ${scoreLabel(weakest.score_type)} (${Math.round(weakest.score)}). Want me to draft improvements?`;
}

export function brandDetailHeroChip(
  intakeStatus: string | null,
  dnaScore: number,
): string {
  const status = intakeStatus ?? "brand_created";
  if (status === "failed") return "unavailable";
  if (["crawl_running", "crawl_complete", "analysis_running"].includes(status)) {
    return "analysing…";
  }
  if (dnaScore <= 0) return "not analysed";
  if (["ready", "scores_complete"].includes(status)) return "active";
  return "draft";
}
