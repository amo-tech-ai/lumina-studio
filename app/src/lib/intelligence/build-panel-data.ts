import {
  BASE_SCORE_TYPES,
  computeDnaScore,
  type BaseScoreType,
  type BrandScoreRow,
} from "@/lib/brand-scores";
import type { IntelligencePanelData } from "./panel-contract";

type BrandRow = {
  id: string;
  name: string;
  intake_status: string;
};

export function buildPanelData(
  brand: BrandRow | null,
  scoreRows: BrandScoreRow[] | null,
  pendingDraftBrands: BrandRow[],
): IntelligencePanelData {
  const pillars: Record<BaseScoreType, number | null> = {
    visual: null,
    audience: null,
    consistency: null,
    commerce_readiness: null,
  };

  for (const scoreType of BASE_SCORE_TYPES) {
    const row = scoreRows?.find((r) => r.score_type === scoreType);
    pillars[scoreType] =
      row && Number.isFinite(Number(row.score)) ? Number(row.score) : null;
  }

  const hasPillar = BASE_SCORE_TYPES.some((t) => pillars[t] != null);
  const dna = hasPillar ? computeDnaScore(scoreRows ?? []) : 0;

  const approvalItems = pendingDraftBrands.map((b) => ({
    id: b.id,
    kind: "brand_draft" as const,
    label: `${b.name} — draft ready for review`,
    href: `/app/brand/${b.id}`,
  }));

  return {
    brand: brand
      ? { id: brand.id, name: brand.name, status: brand.intake_status }
      : null,
    scores: brand && hasPillar ? { dna, pillars } : null,
    approvals: {
      pendingCount: approvalItems.length,
      items: approvalItems,
    },
  };
}
