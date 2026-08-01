/**
 * IPI-834 — thin Mastra/app adapter over the canonical Brand DNA JSON Schema.
 *
 * SSOT: supabase/functions/_shared/schemas/brand-profile.schema.json
 * Runtime rules mirror Edge validateBrandProfilePayload (parity-tested).
 * Do NOT add a hand-maintained Zod field list here.
 */
import { z } from "zod";
import brandProfileSchema from "../../../../supabase/functions/_shared/schemas/brand-profile.schema.json";

export const BRAND_PROFILE_SCHEMA_VERSION = 2 as const;

/** Canonical JSON Schema document (imported — not re-authored). */
export const brandProfileJsonSchema = brandProfileSchema;

const QUOTE_MAX = 500;
const VALUE_MAX = 2000;
const URL_MAX = 2048;

const REQUIRED_CLAIMS = ["tagline", "category", "targetAudience"] as const;
const OPTIONAL_CLAIMS = [
  "overview",
  "brandVoice",
  "mission",
  "vision",
  "uvp",
  "positioning",
  "brandPersonality",
] as const;

export type BrandClaimEvidence = {
  sourceUrl: string;
  quote: string;
  crawlResultId?: string;
};

export type BrandClaim = {
  value: string;
  evidence: BrandClaimEvidence[];
};

export type BrandProfilePayload = {
  schemaVersion: typeof BRAND_PROFILE_SCHEMA_VERSION;
  name: string;
  tagline: BrandClaim;
  overview?: BrandClaim;
  category: BrandClaim;
  visualIdentity: { colors: string[]; mood: string };
  targetAudience: BrandClaim;
  sourceUrl: string;
  contentPillars?: string[];
  brandVoice?: BrandClaim;
  recommendedServices?: string[];
  productionReadiness?: number;
  mission?: BrandClaim;
  vision?: BrandClaim;
  values?: string[];
  uvp?: BrandClaim;
  positioning?: BrandClaim;
  brandPersonality?: BrandClaim;
  confidenceScore?: number;
  competitorSignals?: string[];
  scores: {
    visual: number;
    audience: number;
    consistency: number;
    commerce_readiness: number;
    brand_clarity?: number;
    content_strength?: number;
    social_presence?: number;
    digital_experience?: number;
    sustainability_signal?: number;
    photography_readiness?: number;
    confidence?: number;
    evidence?: string[];
  };
};

function trimmedString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function isHttpUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

/** Returns null when valid; otherwise a short error message. */
export function validateClaim(claim: unknown, field: string): string | null {
  if (!claim || typeof claim !== "object" || Array.isArray(claim)) {
    return `Claim "${field}" must be { value, evidence[] }`;
  }
  const record = claim as Record<string, unknown>;
  const value = trimmedString(record.value);
  if (!value) return `Claim "${field}" requires a non-empty value`;
  if (value.length > VALUE_MAX) return `Claim "${field}" value exceeds ${VALUE_MAX} chars`;
  if (!Array.isArray(record.evidence) || record.evidence.length === 0) {
    return `Claim "${field}" requires at least one evidence entry`;
  }
  if (record.evidence.length > 10) {
    return `Claim "${field}" has too many evidence entries`;
  }
  for (let i = 0; i < record.evidence.length; i++) {
    const ev = record.evidence[i];
    if (!ev || typeof ev !== "object" || Array.isArray(ev)) {
      return `Claim "${field}" evidence[${i}] must be an object`;
    }
    const entry = ev as Record<string, unknown>;
    const sourceUrl = trimmedString(entry.sourceUrl);
    if (!sourceUrl || sourceUrl.length > URL_MAX || !isHttpUrl(sourceUrl)) {
      return `Claim "${field}" evidence[${i}] needs a valid http(s) sourceUrl`;
    }
    const quote = trimmedString(entry.quote);
    if (!quote) return `Claim "${field}" evidence[${i}] needs a non-empty quote`;
    if (quote.length > QUOTE_MAX) {
      return `Claim "${field}" evidence[${i}] quote exceeds ${QUOTE_MAX} chars`;
    }
    if (entry.crawlResultId !== undefined) {
      const id = trimmedString(entry.crawlResultId);
      if (!id) return `Claim "${field}" evidence[${i}] crawlResultId is empty`;
    }
  }
  return null;
}

/**
 * Same contract as Edge `validateBrandProfilePayload`.
 * Keep rule text in lockstep — parity fixtures prove both reject the same bad payloads.
 */
export function validateBrandProfilePayload(
  profile: BrandProfilePayload | Record<string, unknown>,
): string | null {
  const record = profile as Record<string, unknown>;

  if (record.schemaVersion !== BRAND_PROFILE_SCHEMA_VERSION) {
    return `schemaVersion must be ${BRAND_PROFILE_SCHEMA_VERSION}`;
  }
  if (!trimmedString(record.name)) return "Could not extract a brand name";
  if (!trimmedString(record.sourceUrl) || !isHttpUrl(String(record.sourceUrl).trim())) {
    return "sourceUrl must be a valid http(s) URL";
  }

  const visual = record.visualIdentity as { colors?: unknown; mood?: unknown } | undefined;
  if (!trimmedString(visual?.mood) || !Array.isArray(visual?.colors)) {
    return "Incomplete brand profile returned";
  }

  for (const field of REQUIRED_CLAIMS) {
    const err = validateClaim(record[field], field);
    if (err) return err;
  }
  for (const field of OPTIONAL_CLAIMS) {
    if (record[field] === undefined || record[field] === null) continue;
    const err = validateClaim(record[field], field);
    if (err) return err;
  }

  const scores = record.scores as Record<string, unknown> | undefined;
  if (
    !scores ||
    typeof scores.visual !== "number" ||
    typeof scores.audience !== "number" ||
    typeof scores.consistency !== "number" ||
    typeof scores.commerce_readiness !== "number"
  ) {
    return "Incomplete scores returned";
  }
  return null;
}

/** Strip draft/lifecycle keys before contract validation. */
export function stripBrandProfileMeta(
  draft: Record<string, unknown> | null | undefined,
): Record<string, unknown> | null {
  if (!draft || typeof draft !== "object") return null;
  return Object.fromEntries(
    Object.entries(draft).filter(
      ([key]) => !key.startsWith("_") && key !== "analyzedAt",
    ),
  );
}

export function assertBrandProfile(payload: unknown): BrandProfilePayload {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new Error("Brand DNA profile must be an object");
  }
  const err = validateBrandProfilePayload(payload as Record<string, unknown>);
  if (err) throw new Error(err);
  return payload as BrandProfilePayload;
}

/**
 * Mastra step boundary — Zod wrapper around the JSON Schema contract.
 * Not a second SSOT: only delegates to validateBrandProfilePayload.
 */
export const brandProfileContractSchema = z.custom<BrandProfilePayload>(
  (data) => validateBrandProfilePayload(data as Record<string, unknown>) === null,
  (data) => ({
    message:
      validateBrandProfilePayload((data ?? {}) as Record<string, unknown>) ??
      "Invalid Brand DNA profile",
  }),
);

/** extractProfile / fanOutEnrichment step output (profile is the contract). */
export const brandProfileStepOutputSchema = z.object({
  profile: brandProfileContractSchema,
});

export type BrandProfileStepOutput = z.infer<typeof brandProfileStepOutputSchema>;

export const enrichmentStepOutputSchema = z.object({
  profile: brandProfileContractSchema,
  enrichment: z.object({
    socialOk: z.boolean(),
    visualOk: z.boolean(),
  }),
});

export type EnrichmentStepOutput = z.infer<typeof enrichmentStepOutputSchema>;
