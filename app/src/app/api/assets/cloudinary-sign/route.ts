// IPI-433 — function-based CldUploadWidget signatures (widget-provided timestamp)
import { NextResponse } from "next/server";
import { withOperatorAuth, OperatorAuthError } from "@/lib/operator-gate";
import {
  isBrandAccessible,
  parseBrandIdFromCloudinaryContext,
} from "@/lib/assets/brand-access";
import {
  assetFolderFor,
  buildUploadParamsToSign,
  isAllowedResourceType,
  signCloudinaryParams,
  validateParamsToSign,
} from "@/lib/cloudinary/sign-upload";
import { createOperatorSupabaseClient } from "@/lib/supabase/operator-client";

export const dynamic = "force-dynamic";

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

  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  if (!apiSecret) {
    console.error("[assets/cloudinary-sign] CLOUDINARY_API_SECRET missing");
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }

  let parsed: unknown;
  try {
    parsed = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const paramsToSign =
    parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? (parsed as { paramsToSign?: unknown }).paramsToSign
      : undefined;

  if (!paramsToSign || typeof paramsToSign !== "object" || Array.isArray(paramsToSign)) {
    return NextResponse.json({ error: "paramsToSign is required" }, { status: 400 });
  }

  const params = paramsToSign as Record<string, unknown>;
  const validationError = validateParamsToSign(params);
  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  const brandId = parseBrandIdFromCloudinaryContext(params.context);
  if (!brandId) {
    return NextResponse.json({ error: "Invalid brand_id in context" }, { status: 400 });
  }

  if (operator.id !== "dev-unauthenticated") {
    const supabase = await createOperatorSupabaseClient(request);
    const brandCheck = await isBrandAccessible(supabase, brandId);
    if (!brandCheck.ok) {
      return NextResponse.json({ error: brandCheck.message }, { status: brandCheck.status });
    }
  }

  const timestamp =
    typeof params.timestamp === "number" ? params.timestamp : Number(params.timestamp);
  if (!Number.isFinite(timestamp) || timestamp <= 0) {
    return NextResponse.json({ error: "Invalid timestamp" }, { status: 400 });
  }

  const resourceType =
    typeof params.resource_type === "string" && params.resource_type.length > 0
      ? params.resource_type
      : "image";
  if (!isAllowedResourceType(resourceType)) {
    return NextResponse.json({ error: "Invalid resource_type" }, { status: 400 });
  }

  // Rebuild canonical params server-side — never sign arbitrary client-supplied fields.
  const canonicalParams = buildUploadParamsToSign({
    brandId,
    resourceType,
    timestamp,
    folder: assetFolderFor(brandId),
  });

  const signature = signCloudinaryParams(canonicalParams, apiSecret);

  return NextResponse.json({ signature });
}
