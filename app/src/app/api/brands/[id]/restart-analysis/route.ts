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
      { ok: false, code: "not_found", message: "Brand not found." },
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

  let websiteUrl: string | undefined;
  try {
    const body = (await request.json()) as { websiteUrl?: unknown };
    if (typeof body.websiteUrl === "string" && body.websiteUrl.trim()) {
      websiteUrl = body.websiteUrl.trim();
    }
  } catch {
    // Empty body is fine — brand.brand_url is used.
  }

  const result = await restartFailedBrandAnalysis({
    supabase: actor.client,
    actorId: actor.userId,
    brandId,
    websiteUrl,
  });

  return NextResponse.json(result, { status: restartHttpStatus(result) });
}
