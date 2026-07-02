import type { IntelligencePanelData } from "./panel-contract";

/** DC Command Center populated DNA block when brand_scores not loaded yet. */
export const COMMAND_CENTER_SCORES_FALLBACK: NonNullable<
  IntelligencePanelData["scores"]
> = {
  dna: 87,
  pillars: {
    visual: 65,
    audience: 94,
    consistency: 88,
    commerce_readiness: 81,
  },
};

export function resolvePanelScores(
  scores: IntelligencePanelData["scores"],
  commandCenterMode: boolean,
): IntelligencePanelData["scores"] {
  if (scores) return scores;
  if (!commandCenterMode) return null;
  return COMMAND_CENTER_SCORES_FALLBACK;
}
