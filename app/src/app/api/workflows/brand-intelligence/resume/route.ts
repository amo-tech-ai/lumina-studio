// IPI-32 — Resume brand-intelligence workflow after Firecrawl completes
// Called by firecrawl-webhook edge fn with X-Internal-Secret header
// POST { runId: string, crawlId: string }
import { NextResponse } from "next/server";
import { mastra } from "@/mastra";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const secret = request.headers.get("X-Internal-Secret");
  if (!secret || secret !== process.env.INTERNAL_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { runId?: string; crawlId?: string; failed?: boolean; error?: string };
  try {
    body = (await request.json()) as { runId?: string; crawlId?: string; failed?: boolean; error?: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { runId, crawlId, failed, error } = body;
  if (!runId || !crawlId) {
    return NextResponse.json({ error: "runId and crawlId required" }, { status: 400 });
  }

  try {
    const workflow = mastra.getWorkflow("brand-intelligence");
    const run = await workflow.createRun({ runId });
    await run.resume({
      step: "wait-for-crawl",
      resumeData: { crawlId, ...(failed ? { failed: true, error } : {}) },
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[brand-intelligence/resume]", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Internal error" },
      { status: 500 },
    );
  }
}
