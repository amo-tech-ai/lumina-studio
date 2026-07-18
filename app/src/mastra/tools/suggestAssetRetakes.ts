// IPI-261 · DESIGN-077 — suggestAssetRetakes Mastra tool
// Deterministically maps DNA pillar scores (from getAssetDnaEvidence) to
// practical retake guidance. No model call, no Supabase access, no writes —
// this is a pure function wrapped in createTool so the agent can invoke it,
// and the mapping itself is exported for isolated unit testing.
import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import {
  AssetDnaEvidenceSchema,
  DNA_PILLAR_KEYS,
  DNA_PILLAR_LABELS,
  EvidenceItemSchema,
  EvidenceSuggestionSchema,
  RetakeSuggestionSchema,
  type AssetDnaEvidence,
  type AssetDnaPillars,
  type DnaPillarKey,
  type RetakeSeverity,
  type RetakeSuggestion,
} from "./asset-intelligence-schemas";

const GAIN_BY_SEVERITY: Record<Exclude<RetakeSeverity, "none">, number> = {
  critical: 15,
  moderate: 8,
  minor: 3,
};

const ADVICE_BY_PILLAR: Record<DnaPillarKey, Record<Exclude<RetakeSeverity, "none">, string>> = {
  brandConsistency: {
    critical: "Reshoot against an on-brand backdrop/props and match the brand color palette — this asset reads off-brand.",
    moderate: "Adjust styling, backdrop, or color grading to align more closely with brand guidelines.",
    minor: "Fine-tune color grading to tighten the brand palette match.",
  },
  compositionQuality: {
    critical: "Reshoot with sharper focus and even lighting — composition issues are blocking channel use.",
    moderate: "Retake with improved lighting and framing; check focus and crop safety.",
    minor: "Minor framing or lighting touch-up recommended before publishing.",
  },
  channelReadiness: {
    critical: "Not ready for PDP, social, or paid use — reshoot at the channel's required aspect ratio and resolution.",
    moderate: "Crop or reshoot to fit target channel safe zones before publishing.",
    minor: "Verify crop against channel safe-zone guidelines before publishing.",
  },
  productClarity: {
    critical: "Product is not clearly presented — reshoot with the product as the clear, unobstructed focal point.",
    moderate: "Retake with the product framed more prominently and in sharper focus.",
    minor: "Slight product-framing adjustment recommended.",
  },
};

/** Deterministic score → severity thresholds. Exported for direct testing. */
export function severityFromScore(score: number | null): RetakeSeverity {
  if (score === null) return "none";
  if (score < 50) return "critical";
  if (score < 70) return "moderate";
  if (score < 85) return "minor";
  return "none";
}

/**
 * Pure mapping of pillar scores → retake advice. No model call, no I/O —
 * exported so it can be tested in isolation from the createTool wrapper.
 */
export function computeRetakeSuggestions(pillars: AssetDnaPillars | null): RetakeSuggestion[] {
  if (!pillars) return [];
  return DNA_PILLAR_KEYS.map((key) => {
    const score = pillars[key];
    const severity = severityFromScore(score);
    const advice =
      severity === "none"
        ? score === null
          ? `No ${DNA_PILLAR_LABELS[key]} score recorded for this asset yet — this tool cannot trigger a rescore; retake guidance for this pillar isn't available until evidence exists.`
          : `${DNA_PILLAR_LABELS[key]} meets brand standard — no retake needed.`
        : ADVICE_BY_PILLAR[key][severity];
    return {
      pillar: key,
      pillarLabel: DNA_PILLAR_LABELS[key],
      score,
      severity,
      advice,
    };
  });
}

function averagePillarScore(pillars: AssetDnaPillars): number | null {
  const scores = DNA_PILLAR_KEYS.map((key) => pillars[key]).filter(
    (value): value is number => value !== null,
  );
  if (!scores.length) return null;
  return Math.round(scores.reduce((sum, value) => sum + value, 0) / scores.length);
}

function buildAssetResult(item: AssetDnaEvidence) {
  if (!item.found || !item.pillars) {
    return {
      assetId: item.assetId,
      title: "Retake Suggestions",
      score: item.dnaScore ?? 0,
      confidence: 0,
      why: item.found
        ? "No DNA pillar data recorded yet for this asset — this tool cannot trigger a rescore, so no retake guidance is available until pillar evidence exists."
        : "Asset not found or not accessible — cannot compute retake guidance.",
      evidence: undefined,
      suggestions: undefined,
      retakeSuggestions: [] as RetakeSuggestion[],
    };
  }

  const retakeSuggestions = computeRetakeSuggestions(item.pillars);
  const actionable = retakeSuggestions.filter((s) => s.severity !== "none");
  const anyPillarScored = retakeSuggestions.some((s) => s.score !== null);
  const score = item.dnaScore ?? averagePillarScore(item.pillars) ?? 0;

  // Never report "no retake needed" unless at least one pillar was actually
  // scored and none are malformed — a non-empty-but-unrecognized dna_pillars
  // payload (e.g. `{foo: "bar"}`) parses to an all-null pillars object with
  // pillarsMalformed: true (see parseDnaPillars in getAssetDnaEvidence.ts),
  // which would otherwise fall through to actionable.length === 0 and read as
  // a false "all standards met" pass.
  let why: string;
  if (actionable.length) {
    why = `${actionable.length} pillar${actionable.length === 1 ? "" : "s"} below brand standard — see suggestions.`;
  } else if (item.pillarsMalformed) {
    why = "DNA pillar data for this asset could not be parsed — retake status cannot be confirmed until valid evidence exists.";
  } else if (!anyPillarScored) {
    why = "No pillar scores recorded for this asset yet — retake status cannot be confirmed.";
  } else {
    why = "All scored pillars meet brand standard — no retake needed.";
  }

  return {
    assetId: item.assetId,
    title: "Retake Suggestions",
    score,
    confidence: item.pillarsMalformed ? 40 : 90,
    why,
    evidence: retakeSuggestions
      .filter((s) => s.score !== null)
      .map((s) => ({ text: `${s.pillarLabel}: ${s.score}/100` })),
    suggestions: actionable.map((s) => ({
      text: s.advice,
      gain: GAIN_BY_SEVERITY[s.severity as Exclude<RetakeSeverity, "none">] ?? 0,
    })),
    retakeSuggestions,
  };
}

export const suggestAssetRetakes = createTool({
  id: "suggestAssetRetakes",
  description:
    "Deterministically map an asset's DNA pillar scores to practical retake guidance. " +
    "Pass the `evidence` array returned by getAssetDnaEvidence. Purely rule-based — no model call for the " +
    "mapping itself and no database access, so it cannot write anything.",
  inputSchema: z.object({
    evidence: z.array(AssetDnaEvidenceSchema).min(1),
  }),
  outputSchema: z.object({
    results: z.array(
      z.object({
        assetId: z.string(),
        title: z.string(),
        score: z.number(),
        confidence: z.number(),
        why: z.string(),
        evidence: z.array(EvidenceItemSchema).optional(),
        suggestions: z.array(EvidenceSuggestionSchema).optional(),
        retakeSuggestions: z.array(RetakeSuggestionSchema),
      }),
    ),
  }),
  execute: async ({ evidence }) => {
    return { results: evidence.map(buildAssetResult) };
  },
});
