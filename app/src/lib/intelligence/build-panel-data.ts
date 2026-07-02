import {
  BASE_SCORE_TYPES,
  computeDnaScore,
  type BaseScoreType,
  type BrandScoreRow,
} from "@/lib/brand-scores";
import { parseAiProfile } from "@/lib/brand-hub";
import type { IntelligencePanelData } from "./panel-contract";

type BrandRow = {
  id: string;
  name: string;
  intake_status: string;
  ai_profile?: unknown;
};

export type { BrandRow };

function profileSnippetFromProfile(
  profile: ReturnType<typeof parseAiProfile> | null,
): string | undefined {
  if (!profile) return undefined;
  return profile.overview ?? profile.tagline ?? profile.brandVoice ?? undefined;
}

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

  const profile = brand ? parseAiProfile(brand.ai_profile) : null;
  const profileSnippet = profileSnippetFromProfile(profile);
  const visualScore = pillars.visual;

  return {
    brand: brand
      ? {
          id: brand.id,
          name: brand.name,
          status: brand.intake_status,
          summary: profileSnippet,
        }
      : null,
    scores: brand && hasPillar ? { dna, pillars } : null,
    profileSnippet,
    visualIdentity:
      brand && visualScore != null
        ? {
            visualScore: Math.round(visualScore),
            palette: profile?.visualIdentity?.colors ?? [],
            sampleUrls: [],
          }
        : undefined,
    approvals: {
      pendingCount: approvalItems.length,
      items: approvalItems,
    },
  };
}
