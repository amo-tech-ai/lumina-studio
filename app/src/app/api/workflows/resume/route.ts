import { NextRequest, NextResponse } from "next/server";
import { getMastra } from "@/mastra";

// POST /api/workflows/resume
// Body: { workflowId, runId, stepId, resumeData }
export async function POST(req: NextRequest) {
  try {
    const { workflowId, runId, stepId, resumeData } = await req.json();
    if (!workflowId || !runId || !stepId) {
      return NextResponse.json({ error: "workflowId, runId, and stepId are required" }, { status: 400 });
    }
    const run = await getMastra().getWorkflow(workflowId).createRun({ runId });
    const result = await run.resume({ step: stepId, resumeData });
    // ponytail: return suspendPayload so the client reads workflow-computed data (shots, budget)
    // instead of recalculating locally — avoids DRY violation and state drift
    const suspendPayload = result?.status === "suspended" ? result.suspendPayload : null;
    return NextResponse.json({ ok: true, runId, suspendPayload });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
