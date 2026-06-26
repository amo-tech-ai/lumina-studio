// IPI-32 — Start brand-intelligence workflow
// POST { brandId: string }
import { NextResponse } from "next/server";
import { withOperatorAuth, OperatorAuthError } from "@/lib/operator-gate";
import { mastra } from "@/mastra";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let user: Awaited<ReturnType<typeof withOperatorAuth>>;
  try {
    user = await withOperatorAuth(request);
  } catch (e) {
    if (e instanceof OperatorAuthError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    throw e;
  }

  let body: { brandId?: string };
  try {
    body = (await request.json()) as { brandId?: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const brandId = body.brandId?.trim();
  if (!brandId) {
    return NextResponse.json({ error: "brandId required" }, { status: 400 });
  }

  // Extract access token from Authorization header for edge fn calls within workflow
  const authHeader = request.headers.get("Authorization") ?? "";
  const accessToken = authHeader.replace(/^Bearer\s+/i, "");

  try {
    const workflow = mastra.getWorkflow("brand-intelligence");
    const run = await workflow.createRun();
    // startAsync: fire-and-forget, workflow suspends at wait-for-crawl
    await run.startAsync({
      inputData: {
        brandId,
        userId: user.id,
        accessToken,
      },
    });
    return NextResponse.json({ runId: run.runId });
  } catch (e) {
    console.error("[brand-intelligence/start]", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Internal error" },
      { status: 500 },
    );
  }
}
