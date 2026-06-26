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

  let body: { runId?: string; approved?: boolean; brandId?: string };
  try {
    body = (await request.json()) as { runId?: string; approved?: boolean; brandId?: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { runId, approved, brandId } = body;
  if (!runId || approved === undefined || !brandId) {
    return NextResponse.json({ error: "runId, approved, and brandId required" }, { status: 400 });
  }

  try {
    // Update draft status before resuming so commit-or-reject step reads correct value
    const sb = adminClient();
    const { error: updateErr } = await sb
      .from("brand_intake_drafts")
      .update({
        status: approved ? "approved" : "rejected",
        approved_at: approved ? new Date().toISOString() : null,
        rejected_at: approved ? null : new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("brand_id", brandId);
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
