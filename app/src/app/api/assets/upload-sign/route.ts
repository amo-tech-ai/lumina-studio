// IPI-257 074a — signed Cloudinary upload params (secret never leaves the server)
import { NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import { withOperatorAuth, OperatorAuthError } from "@/lib/operator-gate";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const RESOURCE_TYPES = new Set(["image", "video"]);
const ALLOWED_FORMATS = "jpg,png,webp,mp4,mov";
const SIGNATURE_TTL_SECONDS = 300;

type UploadSignBody = {
  brandId?: string;
  resourceType?: string;
  filename?: string;
  context?: { shootId?: string; campaignId?: string };
};

function assetFolderFor(brandId: string, context: UploadSignBody["context"]): string {
  if (context?.shootId && UUID_RE.test(context.shootId)) {
    return `ipix/shoots/${context.shootId}/raw`;
  }
  if (context?.campaignId && UUID_RE.test(context.campaignId)) {
    return `ipix/campaigns/${context.campaignId}`;
  }
  return `ipix/brands/${brandId}/products`;
}

function sanitizeFilename(filename: string): string {
  return filename.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 200);
}

export async function POST(request: Request) {
  let operator;
  try {
    operator = await withOperatorAuth(request);
  } catch (e) {
    if (e instanceof OperatorAuthError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    throw e;
  }

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  if (!cloudName || !apiKey || !apiSecret) {
    console.error("[assets/upload-sign] Cloudinary env vars missing");
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }

  let body: UploadSignBody;
  try {
    body = (await request.json()) as UploadSignBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { brandId, resourceType, filename } = body;
  if (!brandId || !UUID_RE.test(brandId)) {
    return NextResponse.json({ error: "Invalid brandId" }, { status: 400 });
  }
  if (!resourceType || !RESOURCE_TYPES.has(resourceType)) {
    return NextResponse.json({ error: "resourceType must be image or video" }, { status: 400 });
  }
  if (!filename || sanitizeFilename(filename).length === 0) {
    return NextResponse.json({ error: "Invalid filename" }, { status: 400 });
  }

  // Dev fallback identity never owns a real brand row — skip the ownership
  // check so local dev (OPERATOR_AUTH_ENABLED=false) isn't hard-blocked.
  if (operator.id !== "dev-unauthenticated") {
    const svc = await createSupabaseServerClient();
    const { data: brand, error } = await svc
      .from("brands")
      .select("id")
      .eq("id", brandId)
      .eq("user_id", operator.id)
      .maybeSingle();
    if (error) {
      console.error("[assets/upload-sign] brand ownership query failed:", error.message);
      return NextResponse.json({ error: "Internal error" }, { status: 500 });
    }
    if (!brand) {
      return NextResponse.json({ error: "Brand not owned by caller" }, { status: 403 });
    }
  }

  const timestamp = Math.floor(Date.now() / 1000);
  const assetFolder = assetFolderFor(brandId, body.context);
  const contextParts = [`brand_id=${brandId}`];
  if (body.context?.shootId) contextParts.push(`shoot_id=${body.context.shootId}`);
  if (body.context?.campaignId) contextParts.push(`campaign_id=${body.context.campaignId}`);

  const paramsToSign: Record<string, string | number> = {
    timestamp,
    asset_folder: assetFolder,
    // Pre-approval delivery is always signed/authenticated (see §5 of the
    // IPI-257 spec) — flips to public `upload` only after HITL approval.
    type: "authenticated",
    allowed_formats: ALLOWED_FORMATS,
    unique_filename: "true",
    context: contextParts.join("|"),
    // ponytail: named eager presets (asset-tile/asset-masonry) don't exist in
    // the Cloudinary account yet (074e) — add `eager` once those are created,
    // an undefined named transform would fail the upload today.
  };

  const signature = cloudinary.utils.api_sign_request(paramsToSign, apiSecret);

  return NextResponse.json({
    cloudName,
    apiKey,
    timestamp,
    signature,
    assetFolder,
    uploadUrl: `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`,
    params: paramsToSign,
    expiresAt: timestamp + SIGNATURE_TTL_SECONDS,
  });
}
