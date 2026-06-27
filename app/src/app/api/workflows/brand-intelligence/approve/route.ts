// IPI-32 — Approve or reject brand intelligence draft (HITL gate)
// POST { runId: string, approved: boolean }
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { withOperatorAuth, OperatorAuthError } from "@/lib/operator-gate";
import { getMastra } from "@/mastra";

export const dynamic = "force-dynamic";

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );
}

export async function POST(request: Request) {
  let operator: Awaited<ReturnType<typeof withOperatorAuth>>;
  try {
    operator = await withOperatorAuth(request);
  } catch (e) {
    if (e instanceof OperatorAuthError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    throw e;
  }

  let body: { runId?: string; approved?: boolean };
  try {
    body = (await request.json()) as { runId?: string; approved?: boolean };
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { runId, approved } = body;
  if (!runId || typeof approved !== "boolean") {
    return NextResponse.json({ error: "runId (string) and approved (boolean) required" }, { status: 400 });
  }

  try {
    const sb = adminClient();
    // Look up pending draft by workflow run ID — prevents cross-brand approval
    const { data: draft, error: lookupErr } = await sb
      .from("brand_intake_drafts")
      .select("id, brand_id, user_id")
      .eq("draft_profile->>_workflow_run_id", runId)
      .eq("status", "pending_approval")
      .single();
    if (lookupErr || !draft) {
      return NextResponse.json({ error: "No pending draft found for this workflow run" }, { status: 404 });
    }
    if (draft.user_id !== operator.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // .select("id").single() makes the UPDATE fail (PGRST116) if 0 rows matched,
    // preventing a second concurrent approve from silently succeeding and re-resuming.
    const { data: updatedDraft, error: updateErr } = await sb
      .from("brand_intake_drafts")
      .update({
        status: approved ? "approved" : "rejected",
        approved_at: approved ? new Date().toISOString() : null,
        rejected_at: approved ? null : new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", draft.id)
      .eq("status", "pending_approval")
      .select("id")
      .single();
    if (updateErr || !updatedDraft) {
      return NextResponse.json({ error: "Draft already processed — possible duplicate approve request" }, { status: 409 });
    }

    const workflow = getMastra().getWorkflow("brand-intelligence");
    const run = await workflow.createRun({ runId });
    try {
      await run.resume({
        step: "save-draft-and-wait",
        resumeData: { approved },
      });
    } catch (resumeErr) {
      // rollback so operators can retry — draft was updated before resume() was called
      await adminClient()
        .from("brand_intake_drafts")
        .update({ status: "pending_approval", approved_at: null, rejected_at: null, updated_at: new Date().toISOString() })
        .eq("id", draft.id)
        .then(undefined, (rbErr) => { console.error("[brand-intelligence/approve] rollback failed — draft stuck:", rbErr); });
      throw resumeErr;
    }

    return NextResponse.json({ ok: true, approved });
  } catch (e) {
    console.error("[brand-intelligence/approve]", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Internal error" },
      { status: 500 },
    );
  }
}
