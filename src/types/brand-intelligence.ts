export type BrandIntelligenceRequest = {
  url: string;
  brandId?: string;
};

export type BrandScoreRow = {
  id: string;
  score_type: string;
  score: number;
  details?: {
    confidence?: number;
    evidence?: string[];
    source?: string;
    url?: string;
  };
  score_version?: number;
  source?: string;
};

export type BrandIntelligenceResponse = {
  brandId: string;
  brand: { id: string; name: string };
  profile: Record<string, unknown>;
  scores: BrandScoreRow[];
  logId: string;
  durationMs: number;
  geminiMs: number;
};
