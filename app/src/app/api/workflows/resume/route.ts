export const dynamic = "force-dynamic";
export const maxDuration = 60; // polling loop can take up to 30s for AI shot-list generation
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
      if (result?.status === "suspended") {
        // Mastra may nest payload under the next step's name (same pattern as run.start()).
        // Unwrap so both paths return the same flat structure.
        const raw = (result.suspendPayload ?? null) as Record<string, unknown> | null;
        // Only unwrap when the key is a gate step-id (ends in "-gate"), not a data field.
        const nextKey = raw ? Object.keys(raw).find((k) => k !== stepId && k.endsWith("-gate")) : null;
        suspendPayload = (nextKey ? raw![nextKey] : raw) ?? null;
      }
    } catch (resumeErr) {
      // ponytail: String() handles non-Error throws from Mastra internals
      const msg = (resumeErr instanceof Error ? resumeErr.message : String(resumeErr)).toLowerCase();
      if (!msg.includes("not suspended") && !msg.includes("step not found")) throw resumeErr;
      // step already resumed — fall through to snapshot to return current gate
    }

    // Fallback: Mastra 1.41 may return before the next step suspends (race), or the step
    // was already resumed. Poll up to 30s — AI shot-list generation can take 15-20s.
    // In the snapshot, step.suspendPayload = shots/budget; step.payload = gate input (brand/channels).
    if (!suspendPayload) {
      const workflowsStore = await mastra.getStorage()?.getStore("workflows");
      if (workflowsStore) {
        for (let attempt = 0; attempt < 15 && !suspendPayload; attempt++) {
          if (attempt > 0) await new Promise((r) => setTimeout(r, 2000));
          const snapshot = await workflowsStore.loadWorkflowSnapshot({ workflowName: workflowId, runId });
          if (snapshot) {
            const active = Object.keys(snapshot.suspendedPaths ?? {});
            if (active.length === 0) break; // workflow complete, no more gates
            const nextStepId = active.find((id) => id !== stepId);
            if (nextStepId) {
              const step = snapshot.context[nextStepId];
              // suspendPayload holds the shots/budget; payload is the gate *input* (brand, channels, etc.)
              if (step?.status === "suspended") suspendPayload = step?.suspendPayload ?? step?.payload ?? null;
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
