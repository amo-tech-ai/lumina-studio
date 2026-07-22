// IPI-433 / IPI-257 — signed Cloudinary upload params (secret never leaves the server)
import { NextResponse } from "next/server";
import { withOperatorAuth, OperatorAuthError } from "@/lib/operator-gate";
import {
  type BrandAccessResult,
  isBrandAccessible,
} from "@/lib/assets/brand-access";
import {
  buildUploadParamsToSign,
  isAllowedResourceType,
  sanitizeUploadFilename,
  signCloudinaryParams,
  validateNotificationUrl,
} from "@/lib/cloudinary/sign-upload";
import {
  isDamWorkType,
  workTypeWorkIdPairError,
  type WorkType,
} from "@/lib/cloudinary/taxonomy";
import { createOperatorSupabaseClient } from "@/lib/supabase/operator-client";

export const dynamic = "force-dynamic";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const SIGNATURE_TTL_SECONDS = 300;

type UploadSignBody = {
  brandId?: string;
  resourceType?: string;
  filename?: string;
  workType?: string;
  workId?: string;
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

  const { brandId, resourceType, filename, workType: rawWorkType, workId: rawWorkId, notificationUrl } = body;
  if (!brandId || !UUID_RE.test(brandId)) {
    return NextResponse.json({ error: "Invalid brandId" }, { status: 400 });
  }
  if (!resourceType || !isAllowedResourceType(resourceType)) {
    return NextResponse.json({ error: "resourceType must be image or video" }, { status: 400 });
  }
  if (!filename || sanitizeUploadFilename(filename).length === 0) {
    return NextResponse.json({ error: "Invalid filename" }, { status: 400 });
  }

  let workType: WorkType | undefined;
  if (rawWorkType !== undefined && rawWorkType !== null) {
    if (!isDamWorkType(rawWorkType)) {
      return NextResponse.json({ error: "Invalid workType" }, { status: 400 });
    }
    workType = rawWorkType;
  }

  let workId: string | undefined;
  if (rawWorkId !== undefined && rawWorkId !== null) {
    if (typeof rawWorkId !== "string" || !UUID_RE.test(rawWorkId)) {
      return NextResponse.json({ error: "Invalid workId" }, { status: 400 });
    }
    workId = rawWorkId;
  }

  const pairError = workTypeWorkIdPairError(workType, workId);
  if (pairError) {
    return NextResponse.json({ error: pairError }, { status: 400 });
  }

  if (notificationUrl) {
    const notificationError = validateNotificationUrl(notificationUrl);
    if (notificationError) {
      return NextResponse.json({ error: notificationError }, { status: 400 });
    }
  }

  const { shootId, campaignId } = validContextIds(body.context);

  let resolvedOrgId: string;
  if (operator.id !== "dev-unauthenticated") {
    const supabase = await createOperatorSupabaseClient(request);
    const brandCheck: BrandAccessResult = await isBrandAccessible(supabase, brandId);
    if (!brandCheck.ok) {
      return NextResponse.json({ error: brandCheck.message }, { status: brandCheck.status });
    }
    if (!brandCheck.orgId || !UUID_RE.test(brandCheck.orgId)) {
      return NextResponse.json(
        {
          error:
            "Brand has no organization — DAM taxonomy uploads require org_id. Assign the brand to an org first.",
        },
        { status: 400 },
      );
    }
    resolvedOrgId = brandCheck.orgId;

    if (workType === "shoots" && workId) {
      const { data: shoot, error: shootErr } = await supabase
        .from("shoot_portfolio_view")
        .select("id")
        .eq("id", workId)
        .eq("brand_id", brandId)
        .maybeSingle();
      if (shootErr) {
        console.error("[assets/upload-sign] shoot ownership query failed:", shootErr.message);
        return NextResponse.json({ error: "Internal error" }, { status: 500 });
      }
      if (!shoot) {
        return NextResponse.json({ error: "Shoot does not belong to the requested brand" }, { status: 403 });
      }
    }

    if (shootId) {
      const { data: shoot, error: shootErr } = await supabase
        .from("shoot_portfolio_view")
        .select("id")
        .eq("id", shootId)
        .eq("brand_id", brandId)
        .maybeSingle();
      if (shootErr) {
        console.error("[assets/upload-sign] context shoot ownership query failed:", shootErr.message);
        return NextResponse.json({ error: "Internal error" }, { status: 500 });
      }
      if (!shoot) {
        return NextResponse.json({ error: "Context shoot does not belong to the requested brand" }, { status: 403 });
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
        console.error("[assets/upload-sign] campaign ownership query failed:", campaignErr.message);
        return NextResponse.json({ error: "Internal error" }, { status: 500 });
      }
      if (!campaign) {
        return NextResponse.json({ error: "Campaign does not belong to the requested brand" }, { status: 403 });
      }
    }

    if (campaignId) {
      const { data: campaign, error: campaignErr } = await supabase
        .from("campaigns")
        .select("id")
        .eq("id", campaignId)
        .eq("brand_id", brandId)
        .maybeSingle();
      if (campaignErr) {
        console.error("[assets/upload-sign] context campaign ownership query failed:", campaignErr.message);
        return NextResponse.json({ error: "Internal error" }, { status: 500 });
      }
      if (!campaign) {
        return NextResponse.json({ error: "Context campaign does not belong to the requested brand" }, { status: 403 });
      }
    }
  } else {
    const devOrg = process.env.DAM_DEV_ORG_ID;
    if (typeof devOrg !== "string" || !UUID_RE.test(devOrg)) {
      return NextResponse.json(
        { error: "DAM taxonomy uploads require org_id (set DAM_DEV_ORG_ID for local unsigned-dev)" },
        { status: 400 },
      );
    }
    resolvedOrgId = devOrg;
  }

  const timestamp = Math.floor(Date.now() / 1000);
  const paramsToSign = buildUploadParamsToSign({
    brandId,
    resourceType,
    timestamp,
    orgId: resolvedOrgId,
    workType,
    workId,
    shootId,
    campaignId,
    notificationUrl,
  });

  const signature = signCloudinaryParams(paramsToSign, apiSecret);

  return NextResponse.json({
    cloudName,
    apiKey,
    timestamp,
    signature,
    assetFolder: paramsToSign.asset_folder,
    uploadUrl: `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`,
    filename: sanitizeUploadFilename(filename),
    params: paramsToSign,
    expiresAt: timestamp + SIGNATURE_TTL_SECONDS,
  });
}
