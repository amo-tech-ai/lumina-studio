// IPI-433 — function-based CldUploadWidget signatures (widget-provided timestamp)
import { NextResponse } from "next/server";
import { withOperatorAuth, OperatorAuthError } from "@/lib/operator-gate";
import {
  isBrandAccessible,
  parseBrandIdFromCloudinaryContext,
} from "@/lib/assets/brand-access";
import {
  isAllowedResourceType,
  sanitizeWidgetParamsToSign,
  signCloudinaryParams,
  validateParamsToSign,
} from "@/lib/cloudinary/sign-upload";
import { isDamWorkType, type WorkType } from "@/lib/cloudinary/taxonomy";
import { createOperatorSupabaseClient } from "@/lib/supabase/operator-client";

export const dynamic = "force-dynamic";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type SignBody = {
  paramsToSign?: unknown;
  workType?: unknown;
  workId?: unknown;
};

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

  const body =
    parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? (parsed as SignBody)
      : undefined;
  const paramsToSign = body?.paramsToSign;

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

  let workType: WorkType | undefined;
  if (body?.workType !== undefined && body.workType !== null) {
    if (!isDamWorkType(body.workType)) {
      return NextResponse.json({ error: "Invalid workType" }, { status: 400 });
    }
    workType = body.workType;
  }

  let workId: string | undefined;
  if (body?.workId !== undefined && body.workId !== null) {
    if (typeof body.workId !== "string" || !UUID_RE.test(body.workId)) {
      return NextResponse.json({ error: "Invalid workId" }, { status: 400 });
    }
    workId = body.workId;
  }

  // Prefer RLS-backed org_id from brands — never trust client context for org.
  // Taxonomy folders require a real org UUID (no "null"/"unknown" path segments).
  let orgId: string | null = null;
  if (operator.id !== "dev-unauthenticated") {
    const supabase = await createOperatorSupabaseClient(request);
    const brandCheck = await isBrandAccessible(supabase, brandId);
    if (!brandCheck.ok) {
      return NextResponse.json({ error: brandCheck.message }, { status: brandCheck.status });
    }
    orgId = brandCheck.orgId;

    // Mirror upload-sign: shoots/campaigns workId must belong to this brand.
    if (workType === "shoots" && workId) {
      const { data: shoot, error: shootErr } = await supabase
        .from("shoot_portfolio_view")
        .select("id")
        .eq("id", workId)
        .eq("brand_id", brandId)
        .maybeSingle();
      if (shootErr) {
        console.error("[assets/cloudinary-sign] shoot ownership query failed:", shootErr.message);
        return NextResponse.json({ error: "Internal error" }, { status: 500 });
      }
      if (!shoot) {
        return NextResponse.json({ error: "Shoot does not belong to the requested brand" }, { status: 403 });
      }
    }

    if (workType === "campaigns" && workId) {
      const { data: campaign, error: campaignErr } = await supabase
        .from("campaigns")
        .select("id")
        .eq("id", workId)
        .eq("brand_id", brandId)
        .maybeSingle();
      if (campaignErr) {
        console.error("[assets/cloudinary-sign] campaign ownership query failed:", campaignErr.message);
        return NextResponse.json({ error: "Internal error" }, { status: 500 });
      }
      if (!campaign) {
        return NextResponse.json({ error: "Campaign does not belong to the requested brand" }, { status: 403 });
      }
    }
  } else {
    const devOrg = process.env.DAM_DEV_ORG_ID;
    orgId = typeof devOrg === "string" && UUID_RE.test(devOrg) ? devOrg : null;
  }

  if (!orgId || !UUID_RE.test(orgId)) {
    return NextResponse.json(
      {
        error:
          "Brand has no organization — DAM taxonomy uploads require org_id. Assign the brand to an org first.",
      },
      { status: 400 },
    );
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

  const paramsForSignature = sanitizeWidgetParamsToSign(params, brandId, {
    orgId,
    workType,
    workId,
  });

  const signature = signCloudinaryParams(paramsForSignature, apiSecret);

  return NextResponse.json({
    signature,
    apiKey: process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY,
    uploadPreset: paramsForSignature.upload_preset,
    uploadSignatureTimestamp: paramsForSignature.timestamp,
    folder: paramsForSignature.folder,
    context: paramsForSignature.context,
  });
}
