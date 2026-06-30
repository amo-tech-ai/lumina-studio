import type { BaseScoreType } from "@/lib/brand-scores";

export type IntelligenceApprovalItem = {
  id: string;
  kind: "brand_draft";
  label: string;
  href: string;
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
};
