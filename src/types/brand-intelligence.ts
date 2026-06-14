export type BrandIntelligenceRequest = {
  url: string;
  brandId?: string;
};

export type BrandScoreRow = {
  id: string;
  score_type: string;
  score: number;
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
