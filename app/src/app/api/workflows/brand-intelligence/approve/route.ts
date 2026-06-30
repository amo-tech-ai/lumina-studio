// IPI-32 — Approve or reject brand intelligence draft (HITL gate)
// POST { runId: string, approved: boolean }
import { NextResponse } from "next/server";
import { withOperatorAuth, OperatorAuthError } from "@/lib/operator-gate";
import { processBrandIntelligenceDraftApproval } from "@/app/api/_lib/process-draft-approval";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let operator: Awaited<ReturnType<typeof withOperatorAuth>>;
  try {
    operator = await withOperatorAuth(request);
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
    const result = await processBrandIntelligenceDraftApproval({
      runId,
      approved,
      operatorId: operator.id,
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
