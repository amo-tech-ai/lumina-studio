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
  try {
    await withOperatorAuth(request);
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
      .select("id, brand_id")
      .eq("draft_profile->>_workflow_run_id", runId)
      .eq("status", "pending_approval")
      .single();
    if (lookupErr || !draft) {
      return NextResponse.json({ error: "No pending draft found for this workflow run" }, { status: 404 });
    }

    const { error: updateErr } = await sb
      .from("brand_intake_drafts")
      .update({
        status: approved ? "approved" : "rejected",
        approved_at: approved ? new Date().toISOString() : null,
        rejected_at: approved ? null : new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", draft.id)
      .eq("status", "pending_approval");
    if (updateErr) throw new Error(`draft update: ${updateErr.message}`);

    const workflow = getMastra().getWorkflow("brand-intelligence");
    const run = await workflow.createRun({ runId });
    await run.resume({
      step: "save-draft-and-wait",
      resumeData: { approved },
    });

    return NextResponse.json({ ok: true, approved });
  } catch (e) {
    console.error("[brand-intelligence/approve]", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Internal error" },
      { status: 500 },
    );
  }
}
