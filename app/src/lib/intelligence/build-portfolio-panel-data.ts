import {
  BASE_SCORE_TYPES,
  computeDnaScore,
  type BrandScoreRow,
} from "@/lib/brand-scores";
import type {
  IntelligencePanelData,
  IntelligencePortfolio,
  PortfolioBrandHealthRow,
  PortfolioNeedsAttention,
} from "./panel-contract";
import { buildPanelData, type BrandRow } from "./build-panel-data";

export type { BrandRow };

const ATTENTION_THRESHOLD = 80;

function groupScoresByBrand(
  rows: Array<{ brand_id: string; score_type: string; score: number }>,
): Map<string, BrandScoreRow[]> {
  const map = new Map<string, BrandScoreRow[]>();
  for (const row of rows) {
    const list = map.get(row.brand_id) ?? [];
    list.push({ score_type: row.score_type, score: Number(row.score) });
    map.set(row.brand_id, list);
  }
  return map;
}

function buildHealthRows(
  brands: BrandRow[],
  scoresByBrand: Map<string, BrandScoreRow[]>,
): PortfolioBrandHealthRow[] {
  return brands.map((brand) => {
    const scores = scoresByBrand.get(brand.id) ?? [];
    const hasPillar = BASE_SCORE_TYPES.some((t) =>
      scores.some((r) => r.score_type === t && Number.isFinite(r.score)),
    );
    const dna = hasPillar ? computeDnaScore(scores) : 0;
    return {
      brandId: brand.id,
      name: brand.name,
      score: Math.round(dna),
    };
  });
}

function buildAvgDna(rows: PortfolioBrandHealthRow[]): number {
  const scored = rows.filter((row) => row.score > 0);
  if (!scored.length) return 0;
  const sum = scored.reduce((acc, row) => acc + row.score, 0);
  return Math.round(sum / scored.length);
}

function findNeedsAttention(
  brands: BrandRow[],
  scoresByBrand: Map<string, BrandScoreRow[]>,
): PortfolioNeedsAttention | null {
  let weakest: PortfolioNeedsAttention | null = null;

  for (const brand of brands) {
    const scores = scoresByBrand.get(brand.id) ?? [];
    const visual = scores.find((r) => r.score_type === "visual")?.score;
    if (typeof visual !== "number" || !Number.isFinite(visual) || visual >= ATTENTION_THRESHOLD) {
      continue;
    }
    const rounded = Math.round(visual);
    if (!weakest || rounded < weakest.score) {
      weakest = {
        brandId: brand.id,
        brandName: brand.name,
        pillarLabel: "Visual DNA",
        score: rounded,
        href: `/app/brand/${brand.id}`,
      };
    }
  }

  return weakest;
}

function buildPortfolio(
  brands: BrandRow[],
  scoresByBrand: Map<string, BrandScoreRow[]>,
): IntelligencePortfolio {
  const healthRows = buildHealthRows(brands, scoresByBrand);
  return {
    brandCount: brands.length,
    avgDna: buildAvgDna(healthRows),
    healthRows,
    needsAttention: findNeedsAttention(brands, scoresByBrand),
  };
}

export function buildPortfolioPanelData(
  brands: BrandRow[],
  scoreRows: Array<{ brand_id: string; score_type: string; score: number }>,
  pendingDraftBrands: BrandRow[],
): IntelligencePanelData {
  const scoresByBrand = groupScoresByBrand(scoreRows);
  const base = buildPanelData(null, null, pendingDraftBrands);

  return {
    ...base,
    portfolio: buildPortfolio(brands, scoresByBrand),
  };
}
