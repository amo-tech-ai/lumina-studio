import { v2 as cloudinary } from "cloudinary";

import {
  CLOUDINARY_EAGER_PRESETS,
  CLOUDINARY_UPLOAD_PRESET,
  presetTransformString,
} from "@/lib/cloudinary/url";
import { parseBrandIdFromCloudinaryContext } from "@/lib/assets/brand-access";

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

/** Keys the Upload Widget may include in paramsToSign (Cloudinary signs only these). */
const WIDGET_SIGN_ALLOWLIST = new Set([
  "timestamp",
  "upload_preset",
  "folder",
  "context",
  "source",
  "format",
]);

/** Never sign client-supplied overrides for these — server/preset owns them. */
const WIDGET_SIGN_BLOCKLIST = new Set([
  "public_id",
  "overwrite",
  "invalidate",
  "api_key",
  "api_secret",
  "notification_url",
  "asset_folder",
  "allowed_formats",
  "unique_filename",
  "use_filename",
  "eager",
  "type",
  // Widget sends resource_type in paramsToSign, but /image/upload and /video/upload
  // omit it from the signature string Cloudinary validates.
  "resource_type",
]);

function contextStringForSigning(context: unknown, brandId: string): string {
  const parsed = parseBrandIdFromCloudinaryContext(context);
  return `brand_id=${parsed ?? brandId}`;
}

/**
 * Sanitize widget paramsToSign then sign exactly those fields — Cloudinary validates
 * the signature against the params the widget uploads, not a server-rebuilt superset.
 */
export function sanitizeWidgetParamsToSign(
  clientParams: Record<string, unknown>,
  brandId: string,
): Record<string, string | number> {
  const out: Record<string, string | number> = {};

  for (const [key, value] of Object.entries(clientParams)) {
    if (WIDGET_SIGN_BLOCKLIST.has(key) || !WIDGET_SIGN_ALLOWLIST.has(key)) continue;
    if (value === undefined || value === null) continue;
    if (key === "context") continue;
    if (typeof value === "string" || typeof value === "number") {
      out[key] = value;
    } else if (typeof value === "boolean") {
      out[key] = value ? "true" : "false";
    }
  }

  const timestamp =
    typeof clientParams.timestamp === "number"
      ? clientParams.timestamp
      : Number(clientParams.timestamp);
  if (Number.isFinite(timestamp) && timestamp > 0) {
    out.timestamp = timestamp;
  }

  out.upload_preset = CLOUDINARY_UPLOAD_PRESET;
  out.folder = assetFolderFor(brandId);
  out.context = contextStringForSigning(clientParams.context, brandId);

  return out;
}

/** Guard widget/server params before signing — preset and brand context are required client-side. */
export function validateParamsToSign(params: Record<string, unknown>): string | null {
  if (params.upload_preset !== CLOUDINARY_UPLOAD_PRESET) {
    return "upload_preset must be ipix-signed-upload";
  }
  const brandId = parseBrandIdFromCloudinaryContext(params.context);
  if (!brandId) {
    return "context must include brand_id";
  }
  return null;
}
