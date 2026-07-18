// IPI-433 / IPI-257 — signed Cloudinary upload params (secret never leaves the server)
import { NextResponse } from "next/server";
import { withOperatorAuth, OperatorAuthError } from "@/lib/operator-gate";
import { isBrandAccessible } from "@/lib/assets/brand-access";
import {
  assetFolderFor,
  buildUploadParamsToSign,
  isAllowedResourceType,
  sanitizeUploadFilename,
  signCloudinaryParams,
} from "@/lib/cloudinary/sign-upload";
import { createOperatorSupabaseClient } from "@/lib/supabase/operator-client";

export const dynamic = "force-dynamic";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const SIGNATURE_TTL_SECONDS = 300;

type UploadSignBody = {
  brandId?: string;
  resourceType?: string;
  filename?: string;
  folder?: string;
  context?: { shootId?: string; campaignId?: string };
  notificationUrl?: string;
};

function validContextIds(context: UploadSignBody["context"]) {
  const shootId = context?.shootId && UUID_RE.test(context.shootId) ? context.shootId : undefined;
  const campaignId =
    context?.campaignId && UUID_RE.test(context.campaignId) ? context.campaignId : undefined;
  return { shootId, campaignId };
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

  const { brandId, resourceType, filename, folder, notificationUrl } = body;
  if (!brandId || !UUID_RE.test(brandId)) {
    return NextResponse.json({ error: "Invalid brandId" }, { status: 400 });
  }
  if (!resourceType || !isAllowedResourceType(resourceType)) {
    return NextResponse.json({ error: "resourceType must be image or video" }, { status: 400 });
  }
  if (!filename || sanitizeUploadFilename(filename).length === 0) {
    return NextResponse.json({ error: "Invalid filename" }, { status: 400 });
  }
  if (folder && typeof folder !== "string") {
    return NextResponse.json({ error: "folder must be a string" }, { status: 400 });
  }
  if (notificationUrl) {
    try {
      if (new URL(notificationUrl).protocol !== "https:") {
        return NextResponse.json({ error: "notificationUrl must use https" }, { status: 400 });
      }
    } catch {
      return NextResponse.json({ error: "notificationUrl must be a valid URL" }, { status: 400 });
    }
  }

  const { shootId, campaignId } = validContextIds(body.context);

  if (operator.id !== "dev-unauthenticated") {
    const supabase = await createOperatorSupabaseClient(request);
    const brandCheck = await isBrandAccessible(supabase, brandId);
    if (!brandCheck.ok) {
      return NextResponse.json({ error: brandCheck.message }, { status: brandCheck.status });
    }

    if (campaignId) {
      const { data: campaign, error: campaignErr } = await supabase
        .from("campaigns")
        .select("id")
        .eq("id", campaignId)
        .eq("brand_id", brandId)
        .maybeSingle();
      if (campaignErr) {
        console.error("[assets/upload-sign] campaign ownership query failed:", campaignErr.message);
        return NextResponse.json({ error: "Internal error" }, { status: 500 });
      }
      if (!campaign) {
        return NextResponse.json({ error: "Campaign does not belong to the requested brand" }, { status: 403 });
      }
    }
  }

  const timestamp = Math.floor(Date.now() / 1000);
  const assetFolder = folder ?? assetFolderFor(brandId, shootId, campaignId);
  const paramsToSign = buildUploadParamsToSign({
    brandId,
    resourceType,
    timestamp,
    shootId,
    campaignId,
    folder,
    notificationUrl,
  });

  const signature = signCloudinaryParams(paramsToSign, apiSecret);

  return NextResponse.json({
    cloudName,
    apiKey,
    timestamp,
    signature,
    assetFolder,
    uploadUrl: `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`,
    filename: sanitizeUploadFilename(filename),
    params: paramsToSign,
    expiresAt: timestamp + SIGNATURE_TTL_SECONDS,
  });
}
