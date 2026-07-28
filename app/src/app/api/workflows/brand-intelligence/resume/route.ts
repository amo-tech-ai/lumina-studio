// IPI-32 — Resume brand-intelligence workflow after Firecrawl completes
// Called by firecrawl-webhook edge fn with X-Internal-Secret header
// POST { runId: string, crawlId: string }
import { NextResponse } from "next/server";
import { getMastra } from "@/mastra";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const expectedSecret = process.env.INTERNAL_WEBHOOK_SECRET;
  if (!expectedSecret) {
    console.error("[brand-intelligence/resume] INTERNAL_WEBHOOK_SECRET not configured");
    return NextResponse.json({ error: "Service misconfigured" }, { status: 500 });
  }
  const secret = request.headers.get("X-Internal-Secret");
  if (!secret || secret !== expectedSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { runId?: string; crawlId?: string; failed?: boolean; error?: string };
  try {
    body = (await request.json()) as { runId?: string; crawlId?: string; failed?: boolean; error?: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const runId = typeof body.runId === "string" ? body.runId.trim() : "";
  const crawlId = typeof body.crawlId === "string" ? body.crawlId.trim() : "";
  if (!runId || !crawlId) {
    return NextResponse.json({ error: "runId and crawlId required" }, { status: 400 });
  }
  if (body.failed !== undefined && typeof body.failed !== "boolean") {
    return NextResponse.json({ error: "failed must be a boolean" }, { status: 400 });
  }
  if (body.error !== undefined && typeof body.error !== "string") {
    return NextResponse.json({ error: "error must be a string" }, { status: 400 });
  }
  const failed = body.failed === true;
  const error = typeof body.error === "string" ? body.error : undefined;

  try {
    const workflow = getMastra().getWorkflow("brand-intelligence");
    const run = await workflow.createRun({ runId });
    await run.resume({
      step: "wait-for-crawl",
      resumeData: { crawlId, ...(failed ? { failed: true, ...(error ? { error } : {}) } : {}) },
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
