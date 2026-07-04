// IPI-257 074a — signed Cloudinary upload params (secret never leaves the server)
import { NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import { withOperatorAuth, OperatorAuthError } from "@/lib/operator-gate";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { CLOUDINARY_PRESETS } from "@/lib/cloudinary/url";

export const dynamic = "force-dynamic";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const RESOURCE_TYPES = new Set(["image", "video"]);
const ALLOWED_FORMATS = "jpg,png,webp,mp4,mov";
// Advisory only — this is when we'd ask the client to re-request a signature,
// not an enforced window. Cloudinary itself accepts the signed `timestamp` for
// ~1hr regardless of this value (there's no separate server-side TTL to check
// against, since the timestamp is minted fresh on every call to this route).
const SIGNATURE_TTL_SECONDS = 300;

type UploadSignBody = {
  brandId?: string;
  resourceType?: string;
  filename?: string;
  context?: { shootId?: string; campaignId?: string };
};

function validContextIds(context: UploadSignBody["context"]) {
  const shootId = context?.shootId && UUID_RE.test(context.shootId) ? context.shootId : undefined;
  const campaignId =
    context?.campaignId && UUID_RE.test(context.campaignId) ? context.campaignId : undefined;
  return { shootId, campaignId };
}

function assetFolderFor(brandId: string, shootId?: string, campaignId?: string): string {
  if (shootId) return `ipix/shoots/${shootId}/raw`;
  if (campaignId) return `ipix/campaigns/${campaignId}`;
  return `ipix/brands/${brandId}/products`;
}

function sanitizeFilename(filename: string): string {
  return filename.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 200);
}

// 074e — eager pregeneration for the two image presets consumed off the upload path
// (asset-tile in the brand asset panel, asset-masonry in the library grid). Cloudinary's
// `eager` param accepts literal transformation strings, so no server-side named
// transformation needs to be registered in the account — CLOUDINARY_PRESETS is the
// single source of truth these strings are derived from.
const EAGER_IMAGE_PRESETS = ["asset-tile", "asset-masonry"] as const;

function presetToEagerString(preset: (typeof EAGER_IMAGE_PRESETS)[number]): string {
  const { width, height, crop } = CLOUDINARY_PRESETS[preset];
  const parts = [`c_${crop}`, `w_${width}`];
  if (height) parts.push(`h_${height}`);
  if (crop !== "limit") parts.push("g_auto");
  parts.push("f_auto", "q_auto");
  return parts.join(",");
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

  let parsed: unknown;
  try {
    parsed = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const body = parsed as UploadSignBody;

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
  const { shootId, campaignId } = validContextIds(body.context);
  const assetFolder = assetFolderFor(brandId, shootId, campaignId);
  const contextParts = [`brand_id=${brandId}`];
  if (shootId) contextParts.push(`shoot_id=${shootId}`);
  if (campaignId) contextParts.push(`campaign_id=${campaignId}`);

  const paramsToSign: Record<string, string | number> = {
    timestamp,
    asset_folder: assetFolder,
    // Pre-approval delivery is always signed/authenticated (see §5 of the
    // IPI-257 spec) — flips to public `upload` only after HITL approval.
    type: "authenticated",
    allowed_formats: ALLOWED_FORMATS,
    unique_filename: "true",
    use_filename: "true",
    filename: sanitizeFilename(filename),
    context: contextParts.join("|"),
  };
  if (resourceType === "image") {
    paramsToSign.eager = EAGER_IMAGE_PRESETS.map(presetToEagerString).join("|");
  }

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
