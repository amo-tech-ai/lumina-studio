import type { SupabaseClient } from "@supabase/supabase-js";

<<<<<<< HEAD
=======
import {
  DRAFT_ACTION_DOMAIN,
  type DraftActionResult,
  failure,
  isUniqueViolationSignal,
  mapDraftActionDbError,
} from "@/lib/brand/draft-action-errors";

async function resolveDiscardUniqueOrCas(
  supabase: SupabaseClient,
  brandId: string,
): Promise<DraftActionResult> {
  const { data: again, error: againErr } = await supabase
    .from("brands")
    .select("intake_status")
    .eq("id", brandId)
    .maybeSingle();
  if (againErr) {
    const mapped = mapDraftActionDbError("discard", brandId, againErr);
    if (isUniqueViolationSignal(mapped)) {
      return failure("CONFLICT");
    }
    return mapped;
  }
  if (!again) {
    return failure("NOT_FOUND");
  }
  // Already left draft_ready — discard is durably done.
  if (again.intake_status !== "draft_ready") {
    return { ok: true, status: "already_completed" };
  }
  return failure("CONFLICT", DRAFT_ACTION_DOMAIN.NOT_DRAFT_READY);
}

>>>>>>> origin/main
/** Clear ai_profile_draft and restore intake_status after rejection. Caller must enforce auth. */
export async function discardBrandDraft(
  supabase: SupabaseClient,
  brandId: string,
<<<<<<< HEAD
): Promise<{ ok: true } | { ok: false; error: string }> {
=======
): Promise<DraftActionResult> {
>>>>>>> origin/main
  const { data: brand, error: selectErr } = await supabase
    .from("brands")
    .select("id, ai_profile, intake_status")
    .eq("id", brandId)
    .maybeSingle();

<<<<<<< HEAD
  if (selectErr) return { ok: false, error: selectErr.message };
  if (!brand) return { ok: false, error: "Brand not found" };
=======
  if (selectErr) {
    const mapped = mapDraftActionDbError("discard", brandId, selectErr);
    if (isUniqueViolationSignal(mapped)) {
      return resolveDiscardUniqueOrCas(supabase, brandId);
    }
    return mapped;
  }
  if (!brand) {
    return failure("NOT_FOUND");
  }
>>>>>>> origin/main

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

<<<<<<< HEAD
  if (error) return { ok: false, error: error.message };
  if (!updated) return { ok: false, error: "Brand is not in draft_ready state" };

  return { ok: true };
=======
  if (error) {
    const mapped = mapDraftActionDbError("discard", brandId, error);
    if (isUniqueViolationSignal(mapped)) {
      return resolveDiscardUniqueOrCas(supabase, brandId);
    }
    return mapped;
  }
  if (!updated) {
    return resolveDiscardUniqueOrCas(supabase, brandId);
  }

  return { ok: true, status: "completed" };
>>>>>>> origin/main
}
