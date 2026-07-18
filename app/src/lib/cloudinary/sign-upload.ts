import { v2 as cloudinary } from "cloudinary";

import {
  CLOUDINARY_EAGER_PRESETS,
  CLOUDINARY_UPLOAD_PRESET,
  presetTransformString,
} from "@/lib/cloudinary/url";

const RESOURCE_TYPES = new Set(["image", "video"]);
const ALLOWED_FORMATS = "jpg,png,webp,mp4,mov";

export function assetFolderFor(brandId: string, shootId?: string, campaignId?: string): string {
  if (shootId) return `ipix/shoots/${shootId}/raw`;
  if (campaignId) return `ipix/campaigns/${campaignId}`;
  return `ipix/brands/${brandId}/products`;
}

export function sanitizeUploadFilename(filename: string): string {
  return filename.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 200);
}

export function buildUploadParamsToSign(input: {
  brandId: string;
  resourceType: string;
  timestamp: number;
  shootId?: string;
  campaignId?: string;
  folder?: string;
  notificationUrl?: string;
}): Record<string, string | number> {
  const assetFolder = input.folder ?? assetFolderFor(input.brandId, input.shootId, input.campaignId);
  const contextParts = [`brand_id=${input.brandId}`];
  if (input.shootId) contextParts.push(`shoot_id=${input.shootId}`);
  if (input.campaignId) contextParts.push(`campaign_id=${input.campaignId}`);

  const params: Record<string, string | number> = {
    timestamp: input.timestamp,
    upload_preset: CLOUDINARY_UPLOAD_PRESET,
    asset_folder: assetFolder,
    type: "authenticated",
    allowed_formats: ALLOWED_FORMATS,
    unique_filename: "true",
    use_filename: "true",
    context: contextParts.join("|"),
  };

  if (input.resourceType === "image") {
    params.eager = CLOUDINARY_EAGER_PRESETS.map(presetTransformString).join("|");
  }
  if (input.notificationUrl) {
    params.notification_url = input.notificationUrl;
  }
  if (input.folder) {
    params.folder = input.folder;
  }

  return params;
}

export function signCloudinaryParams(
  paramsToSign: Record<string, string | number>,
  apiSecret: string,
): string {
  return cloudinary.utils.api_sign_request(paramsToSign, apiSecret);
}

export function isAllowedResourceType(value: string): boolean {
  return RESOURCE_TYPES.has(value);
}

/** Guard widget/server params before signing — preset and type must stay authenticated. */
export function validateParamsToSign(params: Record<string, unknown>): string | null {
  if (params.upload_preset !== CLOUDINARY_UPLOAD_PRESET) {
    return "upload_preset must be ipix-signed-upload";
  }
  if (params.type !== "authenticated") {
    return "type must be authenticated";
  }
  const brandId = typeof params.context === "string" ? params.context : "";
  if (!brandId.includes("brand_id=")) {
    return "context must include brand_id";
  }
  return null;
}
