import type { BaseScoreType } from "@/lib/brand-scores";
import type { EvidenceBlockProps } from "@/components/evidence-block/types";

export type IntelligenceInsightKind =
  | "priority"
  | "lowest_score"
  | "needs_review"
  | "recommendation";

export type IntelligenceInsight = {
  id: string;
  kind: IntelligenceInsightKind;
  label: string;
  value: string;
  confidence?: number;
};

export type IntelligenceApprovalItem = {
  id: string;
  kind: "brand_draft";
  label: string;
  href: string;
  thumbnailUrl?: string;
  confidence?: number;
  explanation?: string;
  evidence?: Omit<EvidenceBlockProps, "className" | "loading">;
};

export type IntelligenceActivityItem = {
  id: string;
  label: string;
  detail?: string;
};

export type IntelligenceActivityGroup = {
  period: "yesterday" | "today" | "upcoming";
  title: string;
  items: IntelligenceActivityItem[];
};

export type IntelligenceHealthPillar = {
  key: string;
  label: string;
  score: number;
  trendDelta?: number;
};

export type IntelligenceRecommendedAction = {
  id: string;
  label: string;
  href?: string;
};

export type IntelligencePanelData = {
  brand: {
    id: string;
    name: string;
    status: string;
    summary?: string;
    lastUpdated?: string;
  } | null;
  scores: {
    dna: number;
    pillars: Record<BaseScoreType, number | null>;
  } | null;
  /** Optional DNA explain payload — fixture/API only; never client-derived. */
  dnaEvidence?: Omit<EvidenceBlockProps, "className" | "loading">;
  health?: IntelligenceHealthPillar[];
  insights?: IntelligenceInsight[];
  approvals: {
    pendingCount: number;
    items: IntelligenceApprovalItem[];
  };
  recommendedActions?: IntelligenceRecommendedAction[];
  activity?: IntelligenceActivityGroup[];
};
