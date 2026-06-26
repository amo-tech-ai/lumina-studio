export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getMastra } from "@/mastra";
import { OperatorAuthError, withOperatorAuth } from "@/lib/operator-gate";

export async function POST(req: NextRequest) {
  try {
    await withOperatorAuth(req);
    const body = await req.json();
    const run = await getMastra().getWorkflow("shoot-wizard").createRun();
    // Start the workflow — it will immediately suspend at Gate 1
    await run.start({ inputData: body });
    return NextResponse.json({ runId: run.runId }, { status: 202 });
  } catch (err) {
    if (err instanceof OperatorAuthError) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
