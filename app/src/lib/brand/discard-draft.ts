import type { SupabaseClient } from "@supabase/supabase-js";

/** Clear ai_profile_draft and restore intake_status after rejection. Caller must enforce auth. */
export async function discardBrandDraft(
  supabase: SupabaseClient,
  brandId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { data: brand, error: selectErr } = await supabase
    .from("brands")
    .select("id, ai_profile, intake_status")
    .eq("id", brandId)
    .maybeSingle();

  if (selectErr) return { ok: false, error: selectErr.message };
  if (!brand) return { ok: false, error: "Brand not found" };

  const priorProfile = brand.ai_profile as Record<string, unknown> | null;
  const restoreStatus = priorProfile?._lifecycle === "scores_complete" ? "ready" : "brand_created";

  const { data: updated, error } = await supabase
    .from("brands")
    // IPI-744 — clear any lingering reanalyzeBrand lock token here too; see
    // promote-draft.ts for why this matters (a delayed Run A restore could
    // otherwise still match on a stale token after rejection).
    .update({
      ai_profile_draft: null,
      intake_status: restoreStatus,
      analysis_lock_token: null,
      analysis_locked_at: null,
    })
    .eq("id", brandId)
    .eq("intake_status", "draft_ready")
    .select("id")
    .maybeSingle();

  if (error) return { ok: false, error: error.message };
  if (!updated) return { ok: false, error: "Brand is not in draft_ready state" };

  return { ok: true };
}
