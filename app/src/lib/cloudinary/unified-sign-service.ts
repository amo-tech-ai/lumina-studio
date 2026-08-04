// IPI-XXX — Unified Cloudinary signing service
// Consolidates cloudinary-sign (widget-provided params) and upload-sign (server-generated params)
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  type BrandAccessResult,
  isBrandAccessible,
  parseBrandIdFromCloudinaryContext,
} from "@/lib/assets/brand-access";
import {
  buildUploadParamsToSign,
  isAllowedResourceType,
  sanitizeUploadFilename,
  sanitizeWidgetParamsToSign,
  signCloudinaryParams,
  validateNotificationUrl,
  validateParamsToSign,
} from "@/lib/cloudinary/sign-upload";
import {
  isDamWorkType,
  workTypeWorkIdPairError,
  type WorkType,
} from "@/lib/cloudinary/taxonomy";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const SIGNATURE_TTL_SECONDS = 300;

export type SignMode = "widget" | "server";

export type WidgetSignRequest = {
  mode: "widget";
  paramsToSign: Record<string, unknown>;
  workType?: WorkType;
  workId?: string;
};

export type ServerSignRequest = {
  mode: "server";
  brandId: string;
  resourceType: string;
  filename: string;
  workType?: WorkType;
  workId?: string;
  context?: { shootId?: string; campaignId?: string };
  notificationUrl?: string;
};

export type SignRequest = WidgetSignRequest | ServerSignRequest;

export type SignResult = {
  signature: string;
  apiKey: string;
  cloudName?: string;
  uploadPreset?: string;
  uploadSignatureTimestamp?: number;
  folder?: string;
  context?: string;
  timestamp?: number;
  assetFolder?: string;
  uploadUrl?: string;
  filename?: string;
  expiresAt?: number;
  params?: Record<string, unknown>;
};

export type SignError = {
  error: string;
  status: number;
};

async function resolveOrgIdAndValidateOwnership(
  supabase: SupabaseClient,
  brandId: string,
  workType?: WorkType,
  workId?: string,
  shootId?: string,
  campaignId?: string,
): Promise<{ orgId: string; error?: SignError }> {
  const brandCheck: BrandAccessResult = await isBrandAccessible(supabase, brandId);
  if (!brandCheck.ok) {
    return { orgId: "", error: { error: brandCheck.message, status: brandCheck.status } };
  }
  if (!brandCheck.orgId || !UUID_RE.test(brandCheck.orgId)) {
    return {
      orgId: "",
      error: {
        error: "Brand has no organization — DAM taxonomy uploads require org_id. Assign the brand to an org first.",
        status: 400,
      },
    };
  }

  // Validate shoot/campaign ownership
  if (workType === "shoots" && workId) {
    const { data: shoot, error: shootErr } = await supabase
      .from("shoot_portfolio_view")
      .select("id")
      .eq("id", workId)
      .eq("brand_id", brandId)
      .maybeSingle();
    if (shootErr) {
      console.error("[unified-sign] shoot ownership query failed:", shootErr.message);
      return { orgId: "", error: { error: "Internal error", status: 500 } };
    }
    if (!shoot) {
      return { orgId: "", error: { error: "Shoot does not belong to the requested brand", status: 403 } };
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
      console.error("[unified-sign] campaign ownership query failed:", campaignErr.message);
      return { orgId: "", error: { error: "Internal error", status: 500 } };
    }
    if (!campaign) {
      return { orgId: "", error: { error: "Campaign does not belong to the requested brand", status: 403 } };
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
      console.error("[unified-sign] context shoot ownership query failed:", shootErr.message);
      return { orgId: "", error: { error: "Internal error", status: 500 } };
    }
    if (!shoot) {
      return { orgId: "", error: { error: "Context shoot does not belong to the requested brand", status: 403 } };
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
      console.error("[unified-sign] context campaign ownership query failed:", campaignErr.message);
      return { orgId: "", error: { error: "Internal error", status: 500 } };
    }
    if (!campaign) {
      return { orgId: "", error: { error: "Context campaign does not belong to the requested brand", status: 403 } };
    }
  }

  return { orgId: brandCheck.orgId };
}

export async function signCloudinaryUpload(
  request: SignRequest,
  supabase: SupabaseClient,
  operatorId: string,
): Promise<SignResult | SignError> {
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  if (!apiSecret) {
    console.error("[unified-sign] CLOUDINARY_API_SECRET missing");
    return { error: "Internal error", status: 500 };
  }

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY || process.env.CLOUDINARY_API_KEY;

  if (!apiKey) {
    console.error("[unified-sign] CLOUDINARY_API_KEY missing");
    return { error: "Internal error", status: 500 };
  }

  if (request.mode === "widget") {
    return signWidgetRequest(request, supabase, operatorId, apiSecret, apiKey);
  } else {
    if (!cloudName) {
      console.error("[unified-sign] CLOUDINARY_CLOUD_NAME missing");
      return { error: "Internal error", status: 500 };
    }
    return signServerRequest(request, supabase, operatorId, apiSecret, apiKey, cloudName);
  }
}

async function signWidgetRequest(
  request: WidgetSignRequest,
  supabase: SupabaseClient,
  operatorId: string,
  apiSecret: string,
  apiKey: string,
): Promise<SignResult | SignError> {
  const { paramsToSign, workType, workId } = request;

  // Validate workType/workId pair FIRST - tests expect pair errors even when context is invalid
  if (workType !== undefined && workType !== null && !isDamWorkType(workType)) {
    return { error: "Invalid workType", status: 400 };
  }

  if (workId !== undefined && workId !== null) {
    if (typeof workId !== "string" || !UUID_RE.test(workId)) {
      return { error: "Invalid workId", status: 400 };
    }
  }

  const pairError = workTypeWorkIdPairError(workType, workId);
  if (pairError) {
    return { error: pairError, status: 400 };
  }

  const validationError = validateParamsToSign(paramsToSign);
  if (validationError) {
    return { error: validationError, status: 400 };
  }

  const brandId = parseBrandIdFromCloudinaryContext(paramsToSign.context);
  if (!brandId) {
    return { error: "Invalid brand_id in context", status: 400 };
  }

  let orgId: string | null = null;
  if (operatorId !== "dev-unauthenticated") {
    const result = await resolveOrgIdAndValidateOwnership(supabase, brandId, workType, workId);
    if (result.error) return result.error;
    orgId = result.orgId;
  } else {
    const devOrg = process.env.DAM_DEV_ORG_ID;
    orgId = typeof devOrg === "string" && UUID_RE.test(devOrg) ? devOrg : null;
  }

  // orgId null check moved here - resolveOrgIdAndValidateOwnership handles RLS case
  // but dev-unauthenticated path can still return null
  if (!orgId || !UUID_RE.test(orgId)) {
    return {
      error: "Brand has no organization — DAM taxonomy uploads require org_id. Assign the brand to an org first.",
      status: 400,
    };
  }

  const timestamp =
    typeof paramsToSign.timestamp === "number" ? paramsToSign.timestamp : Number(paramsToSign.timestamp);
  if (!Number.isFinite(timestamp) || timestamp <= 0) {
    return { error: "Invalid timestamp", status: 400 };
  }

  const resourceType =
    typeof paramsToSign.resource_type === "string" && paramsToSign.resource_type.length > 0
      ? paramsToSign.resource_type
      : "image";
  if (!isAllowedResourceType(resourceType)) {
    return { error: "Invalid resource_type", status: 400 };
  }

  const paramsForSignature = sanitizeWidgetParamsToSign(paramsToSign, brandId, {
    orgId,
    workType,
    workId,
  });

  const signature = signCloudinaryParams(paramsForSignature, apiSecret);

  return {
    signature,
    apiKey,
    uploadPreset: paramsForSignature.upload_preset as string | undefined,
    uploadSignatureTimestamp: paramsForSignature.timestamp as number | undefined,
    folder: paramsForSignature.folder as string | undefined,
    context: paramsForSignature.context as string | undefined,
  };
}

async function signServerRequest(
  request: ServerSignRequest,
  supabase: SupabaseClient,
  operatorId: string,
  apiSecret: string,
  apiKey: string,
  cloudName: string | undefined,
): Promise<SignResult | SignError> {
  const { brandId, resourceType, filename, workType, workId, context, notificationUrl } = request;

  if (!brandId || !UUID_RE.test(brandId)) {
    return { error: "Invalid brandId", status: 400 };
  }
  if (!resourceType || !isAllowedResourceType(resourceType)) {
    return { error: "resourceType must be image or video", status: 400 };
  }
  if (!filename || sanitizeUploadFilename(filename).length === 0) {
    return { error: "Invalid filename", status: 400 };
  }

  // Validate workType before other checks
  if (workType !== undefined && workType !== null && !isDamWorkType(workType)) {
    return { error: "Invalid workType", status: 400 };
  }

  const pairError = workTypeWorkIdPairError(workType, workId);
  if (pairError) {
    return { error: pairError, status: 400 };
  }

  if (notificationUrl) {
    const notificationError = validateNotificationUrl(notificationUrl);
    if (notificationError) {
      return { error: notificationError, status: 400 };
    }
  }

  const shootId = context?.shootId && UUID_RE.test(context.shootId) ? context.shootId : undefined;
  const campaignId = context?.campaignId && UUID_RE.test(context.campaignId) ? context.campaignId : undefined;

  let resolvedOrgId: string;
  if (operatorId !== "dev-unauthenticated") {
    const result = await resolveOrgIdAndValidateOwnership(supabase, brandId, workType, workId, shootId, campaignId);
    if (result.error) return result.error;
    resolvedOrgId = result.orgId;
  } else {
    const devOrg = process.env.DAM_DEV_ORG_ID;
    if (typeof devOrg !== "string" || !UUID_RE.test(devOrg)) {
      return { error: "DAM taxonomy uploads require org_id (set DAM_DEV_ORG_ID for local unsigned-dev)", status: 400 };
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

  return {
    signature,
    apiKey,
    cloudName,
    timestamp,
    assetFolder: paramsToSign.asset_folder as string | undefined,
    uploadUrl: cloudName ? `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload` : undefined,
    filename: sanitizeUploadFilename(filename),
    params: paramsToSign,
    expiresAt: timestamp + SIGNATURE_TTL_SECONDS,
  };
}
