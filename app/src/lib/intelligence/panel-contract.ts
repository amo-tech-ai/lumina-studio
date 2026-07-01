import type { BaseScoreType } from "@/lib/brand-scores";

export type IntelligenceApprovalItem = {
  id: string;
  kind: "brand_draft";
  label: string;
  href: string;
};

export type IntelligenceAsset = {
  id: string;
  url: string;
  thumbnail_url: string | null;
  asset_type: "image" | "video";
  width: number | null;
  height: number | null;
  created_at: string;
};

export type IntelligenceSuggestion = {
  id: string;
  type: "action" | "insight" | "warning";
  title: string;
  description: string;
  action?: {
    label: string;
    href: string;
  };
  confidence: number;
};

export type IntelligencePanelData = {
  brand: {
    id: string;
    name: string;
    status: string;
  } | null;
  scores: {
    dna: number;
    pillars: Record<BaseScoreType, number | null>;
  } | null;
  approvals: {
    pendingCount: number;
    items: IntelligenceApprovalItem[];
  };
  assets?: IntelligenceAsset[];
  suggestions?: IntelligenceSuggestion[];
};
