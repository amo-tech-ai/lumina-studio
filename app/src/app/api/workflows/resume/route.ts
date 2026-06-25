import { NextRequest, NextResponse } from "next/server";
import { mastra } from "@/mastra";

// POST /api/workflows/resume
// Body: { workflowId, runId, stepId, resumeData }
export async function POST(req: NextRequest) {
  try {
    const { workflowId, runId, stepId, resumeData } = await req.json();
    if (!workflowId || !runId || !stepId) {
      return NextResponse.json({ error: "workflowId, runId, and stepId are required" }, { status: 400 });
    }
    const run = await mastra.getWorkflow(workflowId).createRun({ runId });
    await run.resume({ stepId, resumeData });
    return NextResponse.json({ ok: true, runId });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
