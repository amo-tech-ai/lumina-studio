// IPI-261 · DESIGN-077 — shared Zod schemas for the Creative Director agent's
// asset-intelligence tools (getAssetDnaEvidence, suggestAssetRetakes,
// draftBulkAssetApproval). Field names deliberately mirror
// EvidenceBlockProps (app/src/components/evidence-block/types.ts) — title,
// score, confidence, why, evidence, suggestions — so a future UI wiring step
// (PR B) can map tool output 1:1 without a translation layer.
import { z } from "zod";

export const DNA_PILLAR_KEYS = [
  "brandConsistency",
  "compositionQuality",
  "channelReadiness",
  "productClarity",
] as const;
export type DnaPillarKey = (typeof DNA_PILLAR_KEYS)[number];

export const DNA_PILLAR_LABELS: Record<DnaPillarKey, string> = {
  brandConsistency: "Brand Consistency",
  compositionQuality: "Composition Quality",
  channelReadiness: "Channel Readiness",
  productClarity: "Product Clarity",
};

// Mirrors the shape audit-asset-dna writes into assets.dna_pillars
// (supabase/functions/audit-asset-dna/handler.ts:347-355) — every numeric
// field is nullable here because this tool never assumes the DB payload is
// well-formed (asset never audited, partial legacy rows, hand-edited jsonb).
export const AssetDnaPillarsSchema = z.object({
  brandConsistency: z.number().nullable(),
  compositionQuality: z.number().nullable(),
  channelReadiness: z.number().nullable(),
  productClarity: z.number().nullable(),
  rationale: z.string().nullable(),
});
export type AssetDnaPillars = z.infer<typeof AssetDnaPillarsSchema>;

export const AssetDnaEvidenceSchema = z.object({
  assetId: z.string(),
  brandId: z.string().nullable(),
  found: z.boolean().describe("false when the asset does not exist or is not RLS-visible to this operator"),
  dnaScore: z.number().nullable(),
  dnaStatus: z.string().nullable(),
  pillars: AssetDnaPillarsSchema.nullable(),
  pillarsMalformed: z.boolean().describe("true when dna_pillars jsonb did not match the expected shape"),
  error: z.string().nullable(),
});
export type AssetDnaEvidence = z.infer<typeof AssetDnaEvidenceSchema>;

export const RETAKE_SEVERITIES = ["critical", "moderate", "minor", "none"] as const;
export type RetakeSeverity = (typeof RETAKE_SEVERITIES)[number];

export const RetakeSuggestionSchema = z.object({
  pillar: z.enum(DNA_PILLAR_KEYS),
  pillarLabel: z.string(),
  score: z.number().nullable(),
  severity: z.enum(RETAKE_SEVERITIES),
  advice: z.string(),
});
export type RetakeSuggestion = z.infer<typeof RetakeSuggestionSchema>;

// EvidenceBlockProps-compatible subset — see
// app/src/components/evidence-block/types.ts for the full component contract.
export const EvidenceItemSchema = z.object({ text: z.string() });
export const EvidenceSuggestionSchema = z.object({ text: z.string(), gain: z.number() });

export const EvidenceBlockResultSchema = z.object({
  title: z.string(),
  score: z.number(),
  confidence: z.number(),
  why: z.string(),
  evidence: z.array(EvidenceItemSchema).optional(),
  suggestions: z.array(EvidenceSuggestionSchema).optional(),
});
export type EvidenceBlockResult = z.infer<typeof EvidenceBlockResultSchema>;
