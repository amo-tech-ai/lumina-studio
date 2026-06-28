export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getMastra } from "@/mastra";
import { OperatorAuthError, withOperatorAuth } from "@/lib/operator-gate";

export async function POST(req: NextRequest) {
  try {
    await withOperatorAuth(req);
    const body = await req.json();
    const run = await getMastra().getWorkflow("shoot-wizard").createRun();
    // Start the workflow — it suspends immediately at Gate 1 (deliverable-gate)
    const result = await run.start({ inputData: body });
    // Mastra nests payload under the step name; unwrap so client gets flat {deliverables, ...}
    const raw = result?.status === "suspended" ? result.suspendPayload : null;
    const suspendPayload = raw
      ? ((raw as Record<string, unknown>)["deliverable-gate"] ?? raw)
      : null;
    return NextResponse.json({ runId: run.runId, suspendPayload }, { status: 202 });
  } catch (err) {
    if (err instanceof OperatorAuthError) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
