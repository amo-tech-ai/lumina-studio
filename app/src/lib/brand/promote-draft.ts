import type { SupabaseClient } from "@supabase/supabase-js";

/** Promote ai_profile_draft → ai_profile and upsert draft scores. Caller must enforce auth. */
export async function promoteBrandDraft(
  supabase: SupabaseClient,
  brandId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { data: brand, error: selectErr } = await supabase
    .from("brands")
    .select("id, ai_profile_draft, intake_status")
    .eq("id", brandId)
    .maybeSingle();

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
  const { _draft_scores: _removed, ...cleanDraft } = draft;

  const { data: updated, error } = await supabase
    .from("brands")
    .update({
      ai_profile: cleanDraft,
      ai_profile_draft: null,
      intake_status: "ready",
      ...(typeof cleanDraft.name === "string" ? { name: cleanDraft.name } : {}),
    })
    .eq("id", brandId)
    .eq("intake_status", "draft_ready")
    .select("id")
    .maybeSingle();

  if (error) return { ok: false, error: error.message };
  if (!updated) return { ok: false, error: "Brand is not in draft_ready state" };

  if (draftScores.length > 0) {
    const scoreRows = draftScores.map((r) => ({ ...r, brand_id: brandId }));
    const { error: scoresErr } = await supabase
      .from("brand_scores")
      .upsert(scoreRows, { onConflict: "brand_id,score_type" });
    if (scoresErr) {
      // Profile is already committed — do not fail the approval path (rollback would
      // leave draft pending_approval while brand is ready). Scores can be re-synced.
      console.error("[promoteBrandDraft] score upsert failed after profile commit:", scoresErr);
    }
  }

  return { ok: true };
}
