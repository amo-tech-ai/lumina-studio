// IPI-32 — Approve or reject brand intelligence draft (HITL gate)
// POST { runId: string, approved: boolean }
import { NextResponse } from "next/server";
import { withOperatorAuth, OperatorAuthError } from "@/lib/operator-gate";
import { resolveJwtActor } from "@/lib/jwt-actor";
import { processBrandIntelligenceDraftApproval } from "@/app/api/_lib/process-draft-approval";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  // Generic gate only — its return value is NOT the actor. With auth disabled it
  // yields "dev-unauthenticated" without inspecting the request, which can never match
  // brand_intake_drafts.user_id (a verified JWT subject since IPI-812), so every
  // approval would 403. The other three callers of processBrandIntelligenceDraftApproval
  // (approveWorkflowDraft/rejectWorkflowDraft server actions, approveBrandDraft tool)
  // already derive identity from the session — this route was the last one that didn't.
  try {
    await withOperatorAuth(request);
  } catch (e) {
    if (e instanceof OperatorAuthError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    throw e;
  }

  const actor = await resolveJwtActor(request);
  if (!actor.ok) {
    return NextResponse.json({ error: actor.error }, { status: actor.status });
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
    const result = await processBrandIntelligenceDraftApproval({
      runId,
      approved,
      operatorId: actor.userId,
    });

    if (!result.ok) {
      const status =
        result.error === "Forbidden" ? 403
          : result.error.includes("No pending draft") ? 404
            : result.error.includes("already processed") ? 409
              : 500;
      return NextResponse.json({ error: result.error }, { status });
    }

    return NextResponse.json({ ok: true, approved: result.approved });
  } catch (e) {
    console.error("[brand-intelligence/approve]", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Internal error" },
      { status: 500 },
    );
  }
}
