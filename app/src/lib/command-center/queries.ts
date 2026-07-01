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
    const brandCount = brandRows.length;
    const heroRow = brandRows[0] ?? null;
    const heroBrandId = heroRow?.id ?? null;

    const [scoresResult, shootsResult, pendingDraftsResult, draftReadyResult] =
      await Promise.all([
        heroBrandId
          ? supabase
              .from("brand_scores")
              .select("score_type, score")
              .eq("brand_id", heroBrandId)
          : Promise.resolve({ data: [], error: null }),
        supabase
          .from("shoot_portfolio_view")
          .select("id, name, status, dna_score, updated_at")
          .order("updated_at", { ascending: false })
          .limit(8),
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
    if (pendingDraftsResult.error) return errorPayload(pendingDraftsResult.error.message);
    if (draftReadyResult.error) return errorPayload(draftReadyResult.error.message);

    const heroBrand: HeroBrand | null = heroRow
      ? {
          id: heroRow.id,
          name: heroRow.name,
          brandUrl: heroRow.brand_url,
          intakeStatus: heroRow.intake_status,
          dnaScore: computeDnaScore(scoresResult.data ?? []),
        }
      : null;

    const recentShoots: RecentShoot[] = (shootsResult.data ?? [])
      .filter(
        (row): row is typeof row & { id: string; name: string; status: string; updated_at: string } =>
          Boolean(row.id && row.name && row.status && row.updated_at),
      )
      .map((row) => ({
        id: row.id,
        name: row.name,
        status: row.status,
        dnaScore: row.dna_score,
        updatedAt: row.updated_at,
      }));

    const pendingDrafts = pendingDraftsResult.data ?? [];
    const draftReadyBrands = draftReadyResult.data ?? [];
    const pendingApprovalCount = Math.max(
      pendingDrafts.length,
      draftReadyBrands.length,
    );

    const brandNameById = new Map(brandRows.map((b) => [b.id, b.name]));
    const featuredApproval = await resolveFeaturedApproval(
      supabase,
      pendingDrafts[0],
      brandNameById,
    );

    return {
      heroBrand,
      brandCount,
      shootCount: recentShoots.length,
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

  const { data: liveRows } = await supabase
    .from("brand_scores")
    .select("score_type, score, details, source, score_version")
    .eq("brand_id", draft.brand_id);

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
