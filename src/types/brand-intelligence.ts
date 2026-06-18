export type BrandIntelligenceRequest = {
  url: string;
  brandId?: string;
};

export type BrandScoreType =
  | "visual"
  | "audience"
  | "consistency"
  | "commerce_readiness";

export type BrandScoreRow = {
  id: string;
  score_type: BrandScoreType | string;
  score: number;
};

export type BrandAiProfile = {
  name: string;
  tagline: string;
  category: string;
  visualIdentity: {
    colors: string[];
    mood: string;
  };
  targetAudience: string;
  sourceUrl: string;
  analyzedAt: string;
};

export type BrandIntelligenceResponse = {
  brandId: string;
  brand: { id: string; name: string };
  profile: BrandAiProfile;
  scores: BrandScoreRow[];
  logId: string;
  durationMs: number;
  geminiMs: number;
};

export const BRAND_SCORE_LABELS: Record<BrandScoreType, string> = {
  visual: "Visual clarity",
  audience: "Audience clarity",
  consistency: "Brand consistency",
  commerce_readiness: "Commerce readiness",
};
