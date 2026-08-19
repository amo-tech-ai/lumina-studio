import { createSupabaseAdminClient } from "@/app/api/_lib/supabase-admin";
import {
  DRAFT_ACTION_DOMAIN,
  DRAFT_ACTION_MESSAGES,
} from "@/lib/brand/draft-action-errors";
import { discardBrandDraft } from "@/lib/brand/discard-draft";
import { promoteBrandDraft } from "@/lib/brand/promote-draft";

export const PENDING_DRAFT_STATUS = "pending_approval";

/** Brand already promoted/discarded — safe to continue without rolling back draft row. */
const IDEMPOTENT_DRAFT_STATE_ERROR = DRAFT_ACTION_DOMAIN.NOT_DRAFT_READY;

/** Intentional product / already-sanitized helper messages — never raw PostgREST. */
const SAFE_DRAFT_ACTION_ERRORS = new Set<string>([
  DRAFT_ACTION_DOMAIN.NO_DRAFT,
  DRAFT_ACTION_DOMAIN.INVALID_DNA,
  DRAFT_ACTION_DOMAIN.NOT_DRAFT_READY,
  DRAFT_ACTION_MESSAGES.NOT_FOUND,
  DRAFT_ACTION_MESSAGES.FORBIDDEN,
  DRAFT_ACTION_MESSAGES.CONFLICT,
]);

export type ProcessDraftApprovalResult =
  | { ok: true; approved: boolean; brandId: string }
  | { ok: false; error: string };

/**
 * Defers Mastra workflow resume. Next Route Handlers / Server Actions pass
 * `after` from `next/server`. Mastra tools omit this and use `queueMicrotask`.
 */
export type ScheduleDraftResume = (task: () => void | Promise<void>) => void;

export type ProcessDraftApprovalParams = {
  runId: string;
  approved: boolean;
  operatorId: string;
  expectedBrandId?: string;
  scheduleWork?: ScheduleDraftResume;
};

/**
 * Never forward raw Supabase/PostgREST strings to API / Server Action / UI callers.
 * Known domain messages pass through; everything else becomes a generic product error.
 */
export function sanitizeDraftActionError(
  operation: "promote" | "discard",
  brandId: string,
  error?: string,
): string {
  if (error && SAFE_DRAFT_ACTION_ERRORS.has(error)) {
    return error;
  }
  console.error(`[process-draft-approval] ${operation} failed`, {
    brandId,
    error: error ?? null,
  });
  return operation === "promote"
    ? "Unable to approve Brand DNA right now"
    : "Unable to reject Brand DNA right now";
}

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
  const { data: existing, error: existingErr } = await query.maybeSingle();
  if (existingErr) {
    console.error("[process-draft-approval] idempotent draft lookup", existingErr);
    return { ok: false, error: "Failed to load draft" };
  }
  if (!existing) {
    return { ok: false, error: "No pending draft found for this workflow run" };
  }
  if (existing.user_id !== operatorId) {
    return { ok: false, error: "Forbidden" };
  }

  const { data: brand, error: brandErr } = await sb
    .from("brands")
    .select("intake_status")
    .eq("id", existing.brand_id)
    .maybeSingle();
  if (brandErr) {
    console.error("[process-draft-approval] idempotent brand lookup", brandErr);
    return { ok: false, error: "Failed to load brand status" };
  }
  if (!brand) {
    return { ok: false, error: "Brand not found" };
  }

  if (approved) {
    if (brand.intake_status === "ready") {
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
      error: sanitizeDraftActionError(
        "promote",
        existing.brand_id,
        promoteResult.error,
      ),
    };
  }

  // Reject path: draft row may already be `rejected` while discard is still
  // in flight (or failed + rolled back). Never report success until the brand
  // is no longer waiting on draft_ready — and never treat a lookup failure as
  // “already discarded”.
  if (brand.intake_status !== "draft_ready") {
    return { ok: true, approved: false, brandId: existing.brand_id };
  }
  const discardResult = await discardBrandDraft(sb, existing.brand_id);
  if (discardResult.ok) {
    return { ok: true, approved: false, brandId: existing.brand_id };
  }
  return {
    ok: false,
    error: sanitizeDraftActionError(
      "discard",
      existing.brand_id,
      discardResult.error,
    ),
  };
}

/** Shared HITL approve/reject — used by API route, server actions, and Mastra tool. */
export async function processBrandIntelligenceDraftApproval(
  params: ProcessDraftApprovalParams,
): Promise<ProcessDraftApprovalResult> {
  const { runId, approved, operatorId, expectedBrandId, scheduleWork } = params;
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
  if (lookupErr) {
    // PGRST116 = no pending row — only then try the already-processed path.
    if (lookupErr.code === "PGRST116") {
      return resolveIdempotentApproval({
        sb,
        runId,
        approved,
        operatorId,
        expectedBrandId,
      });
    }
    console.error("[process-draft-approval] pending draft lookup", lookupErr);
    return { ok: false, error: "Failed to load draft" };
  }
  if (!draft) {
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
    // Concurrent CAS miss (PGRST116 / no row) — check durable brand outcome.
    if (updateErr && updateErr.code !== "PGRST116") {
      console.error("[process-draft-approval] draft status update", updateErr);
      return { ok: false, error: "Failed to update draft" };
    }
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
      return {
        ok: false,
        error: sanitizeDraftActionError("promote", draft.brand_id, promoteResult.error),
      };
    }
    // Schedule Mastra workflow resume out-of-band for genuine HITL runs.
    if (promoteResult.ok || promoteResult.error === IDEMPOTENT_DRAFT_STATE_ERROR) {
      scheduleDraftWorkflowResume(runId, true, scheduleWork);
    }
  } else {
    const discardResult = await discardBrandDraft(sb, draft.brand_id);
    if (!discardResult.ok && discardResult.error !== IDEMPOTENT_DRAFT_STATE_ERROR) {
      await rollbackDraftRow(draft.id);
      return {
        ok: false,
        error: sanitizeDraftActionError("discard", draft.brand_id, discardResult.error),
      };
    }
    // Schedule Mastra workflow resume out-of-band for genuine HITL runs.
    if (discardResult.ok || discardResult.error === IDEMPOTENT_DRAFT_STATE_ERROR) {
      scheduleDraftWorkflowResume(runId, false, scheduleWork);
    }
  }

  return { ok: true, approved, brandId: draft.brand_id };
}

/**
 * Schedule Mastra workflow resume after the caller returns.
 * Next request paths pass `after()` via `scheduleWork`; Mastra Studio / tests
 * use `queueMicrotask` so this module never imports `next/server`.
 * Resume uses `with-workflow-mastra-pg-scope` (no NextResponse).
 * Logs failures but never throws — edge onboarding runIds are not suspended
 * Mastra runs and will error "not suspended", which is expected.
 */
function defaultScheduleResume(task: () => void | Promise<void>) {
  queueMicrotask(() => {
    void task();
  });
}

function scheduleDraftWorkflowResume(
  runId: string,
  approved: boolean,
  scheduleWork: ScheduleDraftResume = defaultScheduleResume,
) {
  const schedule = async () => {
    try {
      const { withWorkflowMastraPg } = await import("./with-workflow-mastra-pg-scope");
      await withWorkflowMastraPg(async () => {
        const { getMastra } = await import("@/mastra");
        const mastra = getMastra();
        const run = await mastra.getWorkflow("brand-intelligence").createRun({ runId });
        if (run) {
          await run.resume({ step: "save-draft-and-wait", resumeData: { approved } });
        }
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (!msg.toLowerCase().includes("not suspended")) {
        console.error("[process-draft-approval] workflow resume failed", { runId, approved, error: msg });
      }
    }
  };
  scheduleWork(schedule);
}
