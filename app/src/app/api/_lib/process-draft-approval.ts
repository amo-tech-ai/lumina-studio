import { getMastra } from "@/mastra";
import { createSupabaseAdminClient } from "@/app/api/_lib/supabase-admin";
import { discardBrandDraft } from "@/lib/brand/discard-draft";
import { promoteBrandDraft } from "@/lib/brand/promote-draft";

export const PENDING_DRAFT_STATUS = "pending_approval";

export type ProcessDraftApprovalResult =
  | { ok: true; approved: boolean; brandId: string }
  | { ok: false; error: string };

async function rollbackDraftRow(draftId: string) {
  await createSupabaseAdminClient()
    .from("brand_intake_drafts")
    .update({
      status: PENDING_DRAFT_STATUS,
      approved_at: null,
      rejected_at: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", draftId)
    .then(undefined, (rbErr) => {
      console.error("[process-draft-approval] rollback failed — draft stuck:", rbErr);
    });
}

/** Shared HITL approve/reject — used by API route, server actions, and Mastra tool. */
export async function processBrandIntelligenceDraftApproval(params: {
  runId: string;
  approved: boolean;
  operatorId: string;
}): Promise<ProcessDraftApprovalResult> {
  const { runId, approved, operatorId } = params;
  const sb = createSupabaseAdminClient();

  const { data: draft, error: lookupErr } = await sb
    .from("brand_intake_drafts")
    .select("id, brand_id, user_id")
    .eq("draft_profile->>_workflow_run_id", runId)
    .eq("status", PENDING_DRAFT_STATUS)
    .single();
  if (lookupErr || !draft) {
    return { ok: false, error: "No pending draft found for this workflow run" };
  }
  if (draft.user_id !== operatorId) {
    return { ok: false, error: "Forbidden" };
  }

  const { data: updatedDraft, error: updateErr } = await sb
    .from("brand_intake_drafts")
    .update({
      status: approved ? "approved" : "rejected",
      approved_at: approved ? new Date().toISOString() : null,
      rejected_at: approved ? null : new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", draft.id)
    .eq("status", PENDING_DRAFT_STATUS)
    .select("id")
    .single();
  if (updateErr || !updatedDraft) {
    return { ok: false, error: "Draft already processed — possible duplicate approve request" };
  }

  if (approved) {
    const promoteResult = await promoteBrandDraft(sb, draft.brand_id);
    if (!promoteResult.ok) {
      await rollbackDraftRow(draft.id);
      return { ok: false, error: promoteResult.error };
    }
  } else {
    const discardResult = await discardBrandDraft(sb, draft.brand_id);
    if (!discardResult.ok) {
      await rollbackDraftRow(draft.id);
      return { ok: false, error: discardResult.error };
    }
  }

  try {
    const run = await getMastra().getWorkflow("brand-intelligence").createRun({ runId });
    await run.resume({ step: "save-draft-and-wait", resumeData: { approved } });
  } catch (resumeErr) {
    // Best-effort: profile already promoted/discarded — do not rollback draft row.
    console.error("[process-draft-approval] resume failed (profile already applied):", resumeErr);
  }

  return { ok: true, approved, brandId: draft.brand_id };
}
