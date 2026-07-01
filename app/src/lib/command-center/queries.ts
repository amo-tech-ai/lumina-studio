import type { SupabaseClient } from "@supabase/supabase-js";

import {
  filterDisplayScores,
  getBaseScores,
  parseAiProfile,
  type BrandScoreDetail,
} from "@/lib/brand-hub";
import { computeDnaScore } from "@/lib/brand-scores";
import type { Database } from "@/types/supabase";

import type {
  CommandCenterData,
  FeaturedApproval,
  HeroBrand,
  RecentShoot,
} from "./types";

type Db = SupabaseClient<Database>;

const PENDING_DRAFT_STATUSES = ["pending_approval", "pending"] as const;

type BrandRow = {
  id: string;
  name: string;
  brand_url: string | null;
  intake_status: string | null;
  created_at: string;
};

type ShootRow = {
  id: string | null;
  name: string | null;
  status: string | null;
  dna_score: number | null;
  updated_at: string | null;
};

/** Unique brands with pending intake drafts or draft_ready status. */
export function countPendingApprovalBrands(
  pendingDrafts: { brand_id: string | null }[],
  draftReadyBrands: { id: string }[],
): number {
  const ids = new Set<string>();
  for (const draft of pendingDrafts) {
    if (draft.brand_id) ids.add(draft.brand_id);
  }
  for (const brand of draftReadyBrands) {
    ids.add(brand.id);
  }
  return ids.size;
}

/** Server-side KPI reads for Command Center (RLS-scoped). */
export async function fetchCommandCenterKpis(
  supabase: Db,
  userId: string,
): Promise<CommandCenterData> {
  try {
    const { data: brands, error: brandsError } = await supabase
      .from("brands")
      .select("id, name, brand_url, intake_status, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (brandsError) {
      return errorPayload(brandsError.message);
    }

    const brandRows = brands ?? [];
    const brandIds = brandRows.map((b) => b.id);
    const brandCount = brandRows.length;
    const heroRow = brandRows[0] ?? null;

    const [scoresResult, shootsResult, shootCountResult, pendingDraftsResult, draftReadyResult] =
      await Promise.all([
        fetchHeroScores(supabase, heroRow),
        fetchRecentShoots(supabase, brandIds),
        fetchShootCount(supabase, brandIds),
        supabase
          .from("brand_intake_drafts")
          .select("id, brand_id, draft_profile, draft_scores, status, updated_at")
          .eq("user_id", userId)
          .in("status", [...PENDING_DRAFT_STATUSES])
          .order("updated_at", { ascending: false }),
        supabase
          .from("brands")
          .select("id, name")
          .eq("user_id", userId)
          .eq("intake_status", "draft_ready"),
      ]);

    if (scoresResult.error) return errorPayload(scoresResult.error.message);
    if (shootsResult.error) return errorPayload(shootsResult.error.message);
    if (shootCountResult.error) return errorPayload(shootCountResult.error.message);
    if (pendingDraftsResult.error) return errorPayload(pendingDraftsResult.error.message);
    if (draftReadyResult.error) return errorPayload(draftReadyResult.error.message);

    const heroBrand = buildHeroBrand(heroRow, scoresResult.data ?? []);
    const recentShoots = mapRecentShoots(shootsResult.data ?? []);
    const pendingDrafts = pendingDraftsResult.data ?? [];
    const draftReadyBrands = draftReadyResult.data ?? [];
    const pendingApprovalCount = countPendingApprovalBrands(pendingDrafts, draftReadyBrands);

    const brandNameById = new Map(brandRows.map((b) => [b.id, b.name]));
    const featuredApproval = await resolveFeaturedApproval(
      supabase,
      pendingDrafts[0],
      brandNameById,
    );

    return {
      heroBrand,
      brandCount,
      shootCount: shootCountResult.count ?? 0,
      pendingApprovalCount,
      featuredApproval,
      recentShoots,
      realtimeStatus: "live",
      fetchError: null,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to load dashboard";
    return errorPayload(message);
  }
}

async function fetchHeroScores(supabase: Db, heroRow: BrandRow | null) {
  if (!heroRow) return { data: [], error: null };
  return supabase
    .from("brand_scores")
    .select("score_type, score")
    .eq("brand_id", heroRow.id);
}

async function fetchRecentShoots(supabase: Db, brandIds: string[]) {
  if (brandIds.length === 0) {
    return { data: [] as ShootRow[], error: null };
  }
  // Defense-in-depth: view filters auth.uid(); explicit brand_id scopes to user's brands.
  return supabase
    .from("shoot_portfolio_view")
    .select("id, name, status, dna_score, updated_at")
    .in("brand_id", brandIds)
    .order("updated_at", { ascending: false })
    .limit(8);
}

async function fetchShootCount(supabase: Db, brandIds: string[]) {
  if (brandIds.length === 0) {
    return { count: 0, error: null };
  }
  return supabase
    .from("shoot_portfolio_view")
    .select("id", { count: "exact", head: true })
    .in("brand_id", brandIds);
}

function buildHeroBrand(
  heroRow: BrandRow | null,
  scoreRows: { score_type: string; score: number }[],
): HeroBrand | null {
  if (!heroRow) return null;
  return {
    id: heroRow.id,
    name: heroRow.name,
    brandUrl: heroRow.brand_url,
    intakeStatus: heroRow.intake_status,
    dnaScore: computeDnaScore(scoreRows),
  };
}

function mapRecentShoots(rows: ShootRow[]): RecentShoot[] {
  return rows
    .filter(
      (row): row is ShootRow & { id: string; name: string; status: string; updated_at: string } =>
        Boolean(row.id && row.name && row.status && row.updated_at),
    )
    .map((row) => ({
      id: row.id,
      name: row.name,
      status: row.status,
      dnaScore: row.dna_score,
      updatedAt: row.updated_at,
    }));
}

async function resolveFeaturedApproval(
  supabase: Db,
  draft:
    | {
        brand_id: string | null;
        draft_profile: unknown;
        draft_scores: unknown;
      }
    | undefined,
  brandNameById: Map<string, string>,
): Promise<FeaturedApproval | null> {
  if (!draft?.brand_id) return null;

  const dp = draft.draft_profile as Record<string, unknown> | null;
  const runId = typeof dp?._workflow_run_id === "string" ? dp._workflow_run_id : null;
  if (!runId) return null;

  const brandName = brandNameById.get(draft.brand_id) ?? "Brand";
  const draftScores = normalizeDraftScores(draft.draft_scores);

  const { data: liveRows, error: liveScoresError } = await supabase
    .from("brand_scores")
    .select("score_type, score, details, source, score_version")
    .eq("brand_id", draft.brand_id);

  if (liveScoresError) return null;

  const liveScores = filterDisplayScores(
    getBaseScores((liveRows ?? []) as BrandScoreDetail[]),
  );

  return {
    brandId: draft.brand_id,
    brandName,
    runId,
    draft: parseAiProfile(draft.draft_profile),
    draftScores,
    liveScores,
  };
}

function normalizeDraftScores(raw: unknown): BrandScoreDetail[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter(
    (row): row is BrandScoreDetail =>
      typeof row === "object" &&
      row !== null &&
      typeof (row as BrandScoreDetail).score_type === "string" &&
      typeof (row as BrandScoreDetail).score === "number",
  );
}

function errorPayload(message: string): CommandCenterData {
  return {
    heroBrand: null,
    brandCount: 0,
    shootCount: 0,
    pendingApprovalCount: 0,
    featuredApproval: null,
    recentShoots: [],
    realtimeStatus: "stale",
    fetchError: message,
  };
}
