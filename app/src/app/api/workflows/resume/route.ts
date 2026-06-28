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
    const result = await run.resume({ step: stepId, resumeData });

    // Primary: result contains suspendPayload when Mastra awaits through to the next gate
    let suspendPayload = result?.status === "suspended" ? result.suspendPayload : null;

    // Fallback: Mastra 1.41 may return before the next step suspends in a multi-gate workflow.
    // Retry up to 3× to handle async persistence lag; skip the just-resumed stepId so we
    // read the *next* gate's payload, not the one we just resumed.
    if (!suspendPayload) {
      const workflowsStore = await mastra.getStorage()?.getStore("workflows");
      if (workflowsStore) {
        for (let attempt = 0; attempt < 3 && !suspendPayload; attempt++) {
          if (attempt > 0) await new Promise((r) => setTimeout(r, 150));
          const snapshot = await workflowsStore.loadWorkflowSnapshot({ workflowName: workflowId, runId });
          if (snapshot) {
            const nextStepId = Object.keys(snapshot.suspendedPaths ?? {}).find((id) => id !== stepId);
            if (nextStepId) {
              const step = snapshot.context[nextStepId];
              if (step?.status === "suspended") suspendPayload = step.suspendPayload ?? null;
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
