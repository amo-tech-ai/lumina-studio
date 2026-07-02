import type { IntelligenceHealthPillar, IntelligencePanelData } from "./panel-contract";

export function resolveHealthPillars(
  data: IntelligencePanelData,
): IntelligenceHealthPillar[] | null {
  if (data.health?.length) return data.health;
  if (!data.scores) return null;

  const { dna, pillars } = data.scores;
  // DC health strip: Brand · Visual · Voice · Commerce — voice maps to audience score only.
  return [
    { key: "brand", label: "Brand", score: dna },
    { key: "visual", label: "Visual", score: pillars.visual ?? 0 },
    { key: "voice", label: "Voice", score: pillars.audience ?? 0 },
    { key: "commerce", label: "Commerce", score: pillars.commerce_readiness ?? 0 },
  ];
}

/** Brand detail DC panel — Visual · Voice · Consistency · Commerce. */
export function resolveDetailPillars(
  data: IntelligencePanelData,
): IntelligenceHealthPillar[] | null {
  if (!data.scores) return null;
  const { pillars } = data.scores;
  return [
    { key: "visual", label: "Visual", score: pillars.visual ?? 0 },
    { key: "voice", label: "Voice", score: pillars.audience ?? 0 },
    { key: "consistency", label: "Consistency", score: pillars.consistency ?? 0 },
    { key: "commerce", label: "Commerce", score: pillars.commerce_readiness ?? 0 },
  ];
}
