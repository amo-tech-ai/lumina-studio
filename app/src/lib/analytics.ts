/**
 * Analytics read-layer contract — BE-D2 (IPI-399).
 * Reuse-first: no migration/view/RPC. Verified sources only; unavailable → null (never fake).
 *
 * Provenance (2026-08-14 live nvdlhrodvevgwdsneplk):
 * - campaignsLive: public.campaigns count where status='live' | start_date | is_org_member(org_id) AND brand_id=:brand | 0 if none
 * - assetsPublished: public.assets count where status in ('approved','final') | created_at | brand_id via brands.org_id (assets_brand_id_idx btree brand_id) | 0
 * - avgBrandDna: computeDnaScore(brand_scores where score_type in BASE_SCORE_TYPES per app/src/lib/brand-scores.ts) | brand_scores.created_at | brand_id via brands.org_id | null if any of the 4 base scores missing (no fallback to assets.dna_score)
 * - avgAssetMatch: avg(assets.dna_score) where status in ('approved','final') | assets.created_at | brand_id (assets_brand_id_idx) | null if no published rows
 * - reach/engagementRate/ctr/conversions/cpe/aiActionsApproved/approvalTurnaroundDays: **no verified source** (no spend/impression/click tables) → null / unavailable
 *
 * Index proof: assets WHERE brand_id uses assets_brand_id_idx (btree brand_id), not PK assets_pkey (id).
 * RLS proof: campaigns/assets RLS TO authenticated USING is_org_member(org_id); anon /rest/v1/assets → [] 200 (actual anon client).
 */

import type { CampaignStatus } from "./campaigns";

export type AnalyticsOverviewPayload = {
  /** Verified: count live campaigns */
  campaignsLive: number;
  /** Verified: count published assets */
  assetsPublished: number;
  /** Verified or null: canonical Brand DNA via computeDnaScore (4 base scores); null if incomplete, never avg(assets) fallback */
  avgBrandDna: number | null;
  /** Verified or null: avg asset match over published assets only */
  avgAssetMatch: number | null;
  /** Unavailable: no verified reach source */
  reach: null;
  /** Unavailable: no verified engagement source */
  engagementRate: null;
  /** Unavailable: no verified CTR source */
  ctr: null;
  /** Unavailable: no verified conversions source */
  conversions: null;
  /** Unavailable: no verified CPE source */
  cpe: null;
  /** Unavailable: no verified AI actions source */
  aiActionsApproved: null;
  /** Unavailable: no verified turnaround source */
  approvalTurnaroundDays: null;
};

export type AnalyticsPayload = AnalyticsOverviewPayload;

/** IPI-297 per-campaign row — campaign identity + verified fields (metrics remain null/unavailable per provenance). */
export type CampaignPerformanceRow = {
  campaignId: string;
  name: string;
  status: CampaignStatus;
  brandId: string;
  orgId: string;
};

/** IPI-297 payload: list of per-campaign rows (ranking + drill-down via campaignId). */
export type CampaignPerformancePayload = {
  campaigns: CampaignPerformanceRow[];
};

/** Helper: assert unavailable metrics stay null (ponytail: prevents accidental fake). */
export function isUnavailableMetricsNull(p: AnalyticsPayload): boolean {
  return (
    p.reach === null &&
    p.engagementRate === null &&
    p.ctr === null &&
    p.conversions === null &&
    p.cpe === null &&
    p.aiActionsApproved === null &&
    p.approvalTurnaroundDays === null
  );
}
