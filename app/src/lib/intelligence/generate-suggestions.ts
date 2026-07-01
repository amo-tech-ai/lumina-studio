import type { IntelligenceSuggestion } from "./panel-contract";

export type ScoreMap = Record<string, number | null | undefined>;

/** Rule-based suggestions from latest brand pillar scores (IPI-285). */
export function generateSuggestions(scores: ScoreMap): IntelligenceSuggestion[] {
  const suggestions: IntelligenceSuggestion[] = [];
  let id = 0;

  const visual = scores.visual ?? 0;
  const commerce = scores.commerce_readiness ?? 0;
  const consistency = scores.consistency ?? 0;

  if (visual < 70) {
    suggestions.push({
      id: `sugg-${++id}`,
      type: "warning",
      title: "Visual inconsistency detected",
      description: "Audit logo and color usage across brand assets",
      action: { label: "Review assets →", href: "/app/assets" },
      confidence: 0.85,
    });
  }

  if (commerce < 70) {
    suggestions.push({
      id: `sugg-${++id}`,
      type: "action",
      title: "Commerce readiness low",
      description: "Add product shots to improve score",
      action: { label: "Plan shoot →", href: "/app/shoots/new" },
      confidence: 0.6,
    });
  }

  if (consistency >= 85) {
    suggestions.push({
      id: `sugg-${++id}`,
      type: "insight",
      title: "High consistency score",
      description: "Use as reference for new brands",
      confidence: 0.9,
    });
  }

  return suggestions.slice(0, 5);
}
