export type BrandIntelligenceRequest = {
  url: string;
  brandId?: string;
};

export type BrandIntelligenceCommitRequest = {
  draftId: string;
  decision: "approve" | "reject";
};

export type BrandScoreType =
  | "visual"
  | "audience"
  | "consistency"
  | "commerce_readiness";

export type BrandScoreRow = {
  id?: string;
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

/** Analyze response — draft only; no brands/brand_scores persisted yet. */
export type BrandIntelligenceAnalyzeResponse = {
  action: "analyze";
  draftId: string;
  status: "pending";
  brandId: string | null;
  profile: BrandAiProfile;
  scores: BrandScoreRow[];
  urlRetrieval: unknown;
  logId: string;
  durationMs: number;
  geminiMs: number;
};

export type BrandIntelligenceCommitApproveResponse = {
  action: "commit";
  decision: "approve";
  draftId: string;
  status: "approved";
  brandId: string;
  brand: { id: string; name: string };
  profile: BrandAiProfile;
  scores: BrandScoreRow[];
  logId: string;
  durationMs: number;
};

export type BrandIntelligenceCommitRejectResponse = {
  action: "commit";
  decision: "reject";
  draftId: string;
  status: "rejected";
  durationMs: number;
};

export type BrandIntelligenceCommitResponse =
  | BrandIntelligenceCommitApproveResponse
  | BrandIntelligenceCommitRejectResponse;

/** @deprecated Use BrandIntelligenceAnalyzeResponse — kept for gradual migration */
export type BrandIntelligenceResponse = BrandIntelligenceAnalyzeResponse;

export const BRAND_SCORE_LABELS: Record<BrandScoreType, string> = {
  visual: "Visual clarity",
  audience: "Audience clarity",
  consistency: "Brand consistency",
  commerce_readiness: "Commerce readiness",
};
