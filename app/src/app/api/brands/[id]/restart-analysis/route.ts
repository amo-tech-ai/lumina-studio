// IPI-905 · ONB2-INT-001d — POST /api/brands/[id]/restart-analysis
// Protected recovery for failed Brand Analysis (owner/editor only).
import { NextResponse } from "next/server";
import {
  restartFailedBrandAnalysis,
  restartHttpStatus,
} from "@/lib/brand/restart-failed-analysis";
import { resolveJwtActor } from "@/lib/jwt-actor";
import { withOperatorAuth, OperatorAuthError } from "@/lib/operator-gate";

export const dynamic = "force-dynamic";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await withOperatorAuth(request);
  } catch (e) {
    if (e instanceof OperatorAuthError) {
      return NextResponse.json(
        { ok: false, code: "unauthorized", message: "Unauthorized" },
        { status: 401 },
      );
    }
    throw e;
  }

  const { id: brandId } = await params;
  if (!UUID_RE.test(brandId)) {
    return NextResponse.json(
      { ok: false, code: "invalid_url", message: "brandId must be a valid UUID." },
      { status: 400 },
    );
  }

  const actor = await resolveJwtActor(request);
  if (!actor.ok) {
    return NextResponse.json(
      { ok: false, code: "unauthorized", message: actor.error },
      { status: actor.status },
    );
  }

  const rawBody = await request.text();
  let websiteUrl: string | undefined;
  if (rawBody.trim()) {
    let body: unknown;
    try {
      body = JSON.parse(rawBody) as unknown;
    } catch {
      return NextResponse.json(
        { ok: false, code: "invalid_url", message: "Request body must be valid JSON." },
        { status: 400 },
      );
    }
    if (body === null || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json(
        { ok: false, code: "invalid_url", message: "Request body must be a JSON object." },
        { status: 400 },
      );
    }
    const websiteUrlRaw = (body as { websiteUrl?: unknown }).websiteUrl;
    if (websiteUrlRaw !== undefined && typeof websiteUrlRaw !== "string") {
      return NextResponse.json(
        { ok: false, code: "invalid_url", message: "websiteUrl must be a string." },
        { status: 400 },
      );
    }
    if (typeof websiteUrlRaw === "string" && websiteUrlRaw.trim()) {
      websiteUrl = websiteUrlRaw.trim();
    }
  }

  const result = await restartFailedBrandAnalysis({
    supabase: actor.client,
    actorId: actor.userId,
    brandId,
    websiteUrl,
  });

  return NextResponse.json(result, { status: restartHttpStatus(result) });
}
