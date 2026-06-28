export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getMastra } from "@/mastra";
import { OperatorAuthError, withOperatorAuth } from "@/lib/operator-gate";
// POST /api/workflows/resume
// Body: { workflowId, runId, stepId, resumeData }
export async function POST(req: NextRequest) {
  try {
    await withOperatorAuth(req);
    const { workflowId, runId, stepId, resumeData } = await req.json();
    if (!workflowId || !runId || !stepId) {
      return NextResponse.json({ error: "workflowId, runId, and stepId are required" }, { status: 400 });
    }
    const mastra = getMastra();
    const run = await mastra.getWorkflow(workflowId).createRun({ runId });

    // Primary: resume the step and grab the next gate's payload from the result.
    // If the step was already resumed (stale retry), swallow the error and fall through
    // to the snapshot so we still return the currently-suspended gate's payload.
    let suspendPayload: unknown = null;
    try {
      const result = await run.resume({ step: stepId, resumeData });
      if (result?.status === "suspended") suspendPayload = result.suspendPayload ?? null;
    } catch (resumeErr) {
      const msg = resumeErr instanceof Error ? resumeErr.message : "";
      if (!msg.toLowerCase().includes("not suspended") && !msg.toLowerCase().includes("not found")) throw resumeErr;
      // step already resumed — fall through to snapshot to return current gate
    }

    // Fallback: Mastra 1.41 may return before the next step suspends (race), or the step
    // was already resumed. Retry up to 5× with backoff; skip the just-resumed stepId.
    // Snapshot stores the suspend data under step.payload (not step.suspendPayload).
    if (!suspendPayload) {
      const workflowsStore = await mastra.getStorage()?.getStore("workflows");
      if (workflowsStore) {
        for (let attempt = 0; attempt < 5 && !suspendPayload; attempt++) {
          if (attempt > 0) await new Promise((r) => setTimeout(r, 200 * attempt));
          const snapshot = await workflowsStore.loadWorkflowSnapshot({ workflowName: workflowId, runId });
          if (snapshot) {
            const nextStepId = Object.keys(snapshot.suspendedPaths ?? {}).find((id) => id !== stepId);
            if (nextStepId) {
              const step = snapshot.context[nextStepId];
              if (step?.status === "suspended") suspendPayload = step?.payload ?? step?.suspendPayload ?? null;
            }
          }
        }
      }
    }

    return NextResponse.json({ ok: true, runId, suspendPayload });
  } catch (err) {
    if (err instanceof OperatorAuthError) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
