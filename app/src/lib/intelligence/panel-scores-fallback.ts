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

/** Only use DC placeholder scores when Command Center hero is populated (design parity). */
export function resolvePanelScores(
  scores: IntelligencePanelData["scores"],
  useCommandCenterFallback: boolean,
): IntelligencePanelData["scores"] {
  if (scores) return scores;
  if (!useCommandCenterFallback) return null;
  return COMMAND_CENTER_SCORES_FALLBACK;
}
