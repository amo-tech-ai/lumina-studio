import { createSupabaseAdminClient } from "@/app/api/_lib/supabase-admin";
import { discardBrandDraft } from "@/lib/brand/discard-draft";
import { promoteBrandDraft } from "@/lib/brand/promote-draft";

export const PENDING_DRAFT_STATUS = "pending_approval";

/** Brand already promoted/discarded — safe to continue without rolling back draft row. */
const IDEMPOTENT_DRAFT_STATE_ERROR = "Brand is not in draft_ready state";

export type ProcessDraftApprovalResult =
  | { ok: true; approved: boolean; brandId: string }
  | { ok: false; error: string };

async function rollbackDraftRow(draftId: string) {
  const { error } = await createSupabaseAdminClient()
    .from("brand_intake_drafts")
    .update({
      status: PENDING_DRAFT_STATUS,
      approved_at: null,
      rejected_at: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", draftId);

  if (error) {
    console.error("[process-draft-approval] rollback failed — draft stuck:", error);
  }
}

/** Same outcome as a successful first approve/reject when the draft was already processed. */
async function resolveIdempotentApproval(params: {
  sb: ReturnType<typeof createSupabaseAdminClient>;
  runId: string;
  approved: boolean;
  operatorId: string;
  expectedBrandId?: string;
}): Promise<ProcessDraftApprovalResult> {
  const { sb, runId, approved, operatorId, expectedBrandId } = params;
  const targetStatus = approved ? "approved" : "rejected";

  let query = sb
    .from("brand_intake_drafts")
    .select("id, brand_id, user_id, status")
    .eq("draft_profile->>_workflow_run_id", runId)
    .eq("status", targetStatus);
  if (expectedBrandId) {
    query = query.eq("brand_id", expectedBrandId);
  }
  const { data: existing } = await query.maybeSingle();
  if (!existing) {
    return { ok: false, error: "No pending draft found for this workflow run" };
  }
  if (existing.user_id !== operatorId) {
    return { ok: false, error: "Forbidden" };
  }

  if (approved) {
    const { data: brand } = await sb
      .from("brands")
      .select("intake_status")
      .eq("id", existing.brand_id)
      .maybeSingle();
    if (brand?.intake_status === "ready") {
      return { ok: true, approved: true, brandId: existing.brand_id };
    }
    // Draft row already approved but promote never landed — retry once, never
    // report success until intake_status is durably ready.
    const promoteResult = await promoteBrandDraft(sb, existing.brand_id);
    if (promoteResult.ok) {
      return { ok: true, approved: true, brandId: existing.brand_id };
    }
    return {
      ok: false,
      error: promoteResult.error || "Draft already processed — brand is not ready yet",
    };
  }

  return { ok: true, approved, brandId: existing.brand_id };
}

/** Shared HITL approve/reject — used by API route, server actions, and Mastra tool. */
export async function processBrandIntelligenceDraftApproval(params: {
  runId: string;
  approved: boolean;
  operatorId: string;
  expectedBrandId?: string;
}): Promise<ProcessDraftApprovalResult> {
  const { runId, approved, operatorId, expectedBrandId } = params;
  const sb = createSupabaseAdminClient();

  let draftQuery = sb
    .from("brand_intake_drafts")
    .select("id, brand_id, user_id")
    .eq("draft_profile->>_workflow_run_id", runId)
    .eq("status", PENDING_DRAFT_STATUS);
  if (expectedBrandId) {
    draftQuery = draftQuery.eq("brand_id", expectedBrandId);
  }
  const { data: draft, error: lookupErr } = await draftQuery.single();
  if (lookupErr || !draft) {
    // IPI-835 · D — idempotent re-approve when the draft was already applied.
    return resolveIdempotentApproval({
      sb,
      runId,
      approved,
      operatorId,
      expectedBrandId,
    });
  }
  if (draft.user_id !== operatorId) {
    return { ok: false, error: "Forbidden" };
  }
  if (expectedBrandId && draft.brand_id !== expectedBrandId) {
    return { ok: false, error: "Draft does not belong to this brand" };
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
    // Concurrent duplicate approve — treat as success when brand already ready.
    return resolveIdempotentApproval({
      sb,
      runId,
      approved,
      operatorId,
      expectedBrandId: expectedBrandId ?? draft.brand_id,
    });
  }

  if (approved) {
    const promoteResult = await promoteBrandDraft(sb, draft.brand_id);
    if (!promoteResult.ok && promoteResult.error !== IDEMPOTENT_DRAFT_STATE_ERROR) {
      await rollbackDraftRow(draft.id);
      return { ok: false, error: promoteResult.error };
    }
  } else {
    const discardResult = await discardBrandDraft(sb, draft.brand_id);
    if (!discardResult.ok && discardResult.error !== IDEMPOTENT_DRAFT_STATE_ERROR) {
      await rollbackDraftRow(draft.id);
      return { ok: false, error: discardResult.error };
    }
  }

  try {
    // Dynamic import (not a top-level one) breaks a real circular dependency:
    // this file is imported by brand-intelligence-tools.ts, which is imported by
    // brand-intelligence-agent.ts, which @/mastra's index.ts registers — a
    // top-level import here would cycle straight back to @/mastra.
    const { getMastra } = await import("@/mastra");
    const run = await getMastra().getWorkflow("brand-intelligence").createRun({ runId });
    await run.resume({ step: "save-draft-and-wait", resumeData: { approved } });
  } catch (resumeErr) {
    // Best-effort: profile already promoted/discarded — do not rollback draft row.
    console.error("[process-draft-approval] resume failed (profile already applied):", resumeErr);
  }

  return { ok: true, approved, brandId: draft.brand_id };
}
