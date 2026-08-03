import type { SupabaseClient } from "@supabase/supabase-js";

<<<<<<< HEAD
=======
import {
  stripBrandProfileMeta,
  validateBrandProfilePayload,
} from "@/lib/brand/brand-profile-contract";
import {
  DRAFT_ACTION_DOMAIN,
  type DraftActionResult,
  failure,
  isUniqueViolationSignal,
  logDraftActionError,
  mapDraftActionDbError,
} from "@/lib/brand/draft-action-errors";
import { BASE_SCORE_TYPES } from "@/lib/brand-scores";

/** Build brand_scores rows from embedded `_draft_scores` or contract `scores`. */
export function resolvePromoteScoreRows(
  draft: Record<string, unknown>,
): Array<Record<string, unknown>> | null {
  const byType = new Map<string, number>();

  if (Array.isArray(draft._draft_scores)) {
    for (const row of draft._draft_scores) {
      if (!row || typeof row !== "object" || Array.isArray(row)) continue;
      const rec = row as Record<string, unknown>;
      const type = typeof rec.score_type === "string" ? rec.score_type : null;
      const score = typeof rec.score === "number" && Number.isFinite(rec.score) ? rec.score : null;
      if (type && score != null) byType.set(type, score);
    }
  }

  const profileScores =
    draft.scores && typeof draft.scores === "object" && !Array.isArray(draft.scores)
      ? (draft.scores as Record<string, unknown>)
      : null;
  if (profileScores) {
    for (const type of BASE_SCORE_TYPES) {
      if (byType.has(type)) continue;
      const score = profileScores[type];
      if (typeof score === "number" && Number.isFinite(score)) byType.set(type, score);
    }
  }

  for (const type of BASE_SCORE_TYPES) {
    if (!byType.has(type)) return null;
  }

  const embedded = Array.isArray(draft._draft_scores)
    ? (draft._draft_scores as Array<Record<string, unknown>>)
    : [];
  const embeddedTypes = new Set(
    embedded
      .map((row) =>
        row && typeof row === "object" && !Array.isArray(row)
          ? (row as Record<string, unknown>).score_type
          : null,
      )
      .filter((t): t is string => typeof t === "string"),
  );

  // Prefer full embedded rows when they already cover the base set.
  if (BASE_SCORE_TYPES.every((t) => embeddedTypes.has(t))) {
    return embedded.filter((row) => {
      if (!row || typeof row !== "object" || Array.isArray(row)) return false;
      const rec = row as Record<string, unknown>;
      return (
        typeof rec.score_type === "string" &&
        typeof rec.score === "number" &&
        Number.isFinite(rec.score)
      );
    });
  }

  return BASE_SCORE_TYPES.map((score_type) => ({
    score_type,
    score: byType.get(score_type),
    score_version: 1,
    source: "promote",
    details: { source: "promoteBrandDraft" },
  }));
}

async function resolvePromoteUniqueOrCas(
  supabase: SupabaseClient,
  brandId: string,
): Promise<DraftActionResult> {
  const { data: again, error: againErr } = await supabase
    .from("brands")
    .select("intake_status")
    .eq("id", brandId)
    .maybeSingle();
  if (againErr) {
    const mapped = mapDraftActionDbError("promote", brandId, againErr);
    if (isUniqueViolationSignal(mapped)) {
      return failure("CONFLICT");
    }
    return mapped;
  }
  if (again?.intake_status === "ready") {
    return { ok: true, status: "already_completed" };
  }
  return failure("CONFLICT", DRAFT_ACTION_DOMAIN.NOT_DRAFT_READY);
}

>>>>>>> origin/main
/** Promote ai_profile_draft → ai_profile and upsert draft scores. Caller must enforce auth. */
export async function promoteBrandDraft(
  supabase: SupabaseClient,
  brandId: string,
<<<<<<< HEAD
): Promise<{ ok: true } | { ok: false; error: string }> {
=======
): Promise<DraftActionResult> {
>>>>>>> origin/main
  const { data: brand, error: selectErr } = await supabase
    .from("brands")
    .select("id, ai_profile_draft, intake_status")
    .eq("id", brandId)
    .maybeSingle();

<<<<<<< HEAD
  if (selectErr) return { ok: false, error: selectErr.message };
  if (!brand?.ai_profile_draft) {
    // HITL handler (processBrandIntelligenceDraftApproval) may promote before workflow resume.
    if (brand?.intake_status === "ready") return { ok: true };
    return { ok: false, error: "No draft to apply" };
  }

  const draft = brand.ai_profile_draft as Record<string, unknown>;
  const draftScores = Array.isArray(draft._draft_scores)
    ? (draft._draft_scores as Array<Record<string, unknown>>)
    : [];
=======
  if (selectErr) {
    const mapped = mapDraftActionDbError("promote", brandId, selectErr);
    if (isUniqueViolationSignal(mapped)) {
      return resolvePromoteUniqueOrCas(supabase, brandId);
    }
    return mapped;
  }
  if (!brand?.ai_profile_draft) {
    // HITL handler (processBrandIntelligenceDraftApproval) may promote before workflow resume.
    if (brand?.intake_status === "ready") {
      return { ok: true, status: "already_completed" };
    }
    return failure("NOT_FOUND", DRAFT_ACTION_DOMAIN.NO_DRAFT);
  }

  const draft = brand.ai_profile_draft as Record<string, unknown>;
  // IPI-835 · D / IPI-834 — refuse promote when DNA fails the evidence-backed contract.
  const contractPayload = stripBrandProfileMeta(draft);
  if (!contractPayload || validateBrandProfilePayload(contractPayload) !== null) {
    return failure("CONFLICT", DRAFT_ACTION_DOMAIN.INVALID_DNA);
  }

  // Command Center DNA badge reads brand_scores — refuse ready without the four base scores.
  const draftScores = resolvePromoteScoreRows(draft);
  if (!draftScores) {
    return failure("CONFLICT", DRAFT_ACTION_DOMAIN.INVALID_DNA);
  }

>>>>>>> origin/main
  const { _draft_scores: _removed, ...cleanDraft } = draft;

  const { data: updated, error } = await supabase
    .from("brands")
    .update({
      ai_profile: cleanDraft,
      ai_profile_draft: null,
      intake_status: "ready",
      // IPI-744 — clear any lingering reanalyzeBrand lock token here. Without
      // this, a delayed/failed reanalyzeBrand run whose response was lost
      // client-side can still own a stale analysis_lock_token; its late
      // restoreBrandStatus call would then match on token + "not draft_ready"
      // and silently revert this brand back to an old status after approval.
      analysis_lock_token: null,
      analysis_locked_at: null,
      ...(typeof cleanDraft.name === "string" ? { name: cleanDraft.name } : {}),
    })
    .eq("id", brandId)
    .eq("intake_status", "draft_ready")
    .select("id")
    .maybeSingle();

<<<<<<< HEAD
  if (error) return { ok: false, error: error.message };
  if (!updated) return { ok: false, error: "Brand is not in draft_ready state" };
=======
  if (error) {
    const mapped = mapDraftActionDbError("promote", brandId, error);
    if (isUniqueViolationSignal(mapped)) {
      return resolvePromoteUniqueOrCas(supabase, brandId);
    }
    return mapped;
  }
  if (!updated) {
    return resolvePromoteUniqueOrCas(supabase, brandId);
  }
>>>>>>> origin/main

  if (draftScores.length > 0) {
    const scoreRows = draftScores.map((r) => ({ ...r, brand_id: brandId }));
    const { error: scoresErr } = await supabase
      .from("brand_scores")
      .upsert(scoreRows, { onConflict: "brand_id,score_type" });
    if (scoresErr) {
      // Profile is already committed — do not fail the approval path (rollback would
      // leave draft pending_approval while brand is ready). Scores can be re-synced.
<<<<<<< HEAD
      console.error("[promoteBrandDraft] score upsert failed after profile commit:", scoresErr);
    }
  }

  return { ok: true };
=======
      logDraftActionError("promote", brandId, scoresErr);
    }
  }

  return { ok: true, status: "completed" };
>>>>>>> origin/main
}
