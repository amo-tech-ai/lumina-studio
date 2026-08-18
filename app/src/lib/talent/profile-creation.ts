export type AnalyzedPublishField = {
  key: string;
  value?: string;
  confidence: number;
  evidence?: string;
};

export type CreateTalentProfileInput = {
  displayName: string;
  bio?: string;
  handle?: string;
  niche?: string;
  location?: string;
  dayRate?: string;
  languages?: string[];
  sourceUrl: string;
  agencyOrgId?: string;
  analyzedFields: AnalyzedPublishField[];
};

/** Matching reads numeric rates.half_day via talent.compute_rate_tier. */
export function parseHalfDayRate(raw: string | undefined): number | null {
  if (!raw) return null;
  const n = Number(String(raw).replace(/[^0-9.]/g, ""));
  if (!Number.isFinite(n) || n <= 0) return null;
  return n;
}

export function toCreateTalentProfileRpcArgs(input: CreateTalentProfileInput) {
  return {
    p_display_name: input.displayName,
    p_bio: input.bio ?? null,
    p_handle: input.handle ?? null,
    p_niche: input.niche ?? null,
    p_location: input.location ?? null,
    p_half_day: parseHalfDayRate(input.dayRate),
    p_languages: input.languages ?? [],
    p_source_url: input.sourceUrl,
    p_agency_org_id: input.agencyOrgId ?? null,
    p_sources: input.analyzedFields.map((field) => ({
      field_name: field.key,
      confidence: field.confidence,
    })),
  };
}
