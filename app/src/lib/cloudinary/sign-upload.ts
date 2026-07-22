import { v2 as cloudinary } from "cloudinary";

import {
  CLOUDINARY_EAGER_PRESETS,
  CLOUDINARY_UPLOAD_PRESET,
  presetTransformString,
  CLOUDINARY_METADATA_SCHEMA_VERSION,
} from "@/lib/cloudinary/url";
import { parseBrandIdFromCloudinaryContext } from "@/lib/assets/brand-access";
import {
  assetFolderFor as taxonomyFolderFor,
  damContextString,
  ALLOWED_UPLOAD_FORMATS,
  DELIVERY_TYPE,
  detectEnv,
  type DamEnv,
  type WorkType,
} from "@/lib/cloudinary/taxonomy";

const RESOURCE_TYPES = new Set(["image", "video"]);

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

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
  orgId: string;
  env?: DamEnv;
  workType?: WorkType;
  workId?: string;
  shootId?: string;
  campaignId?: string;
  folder?: string;
  notificationUrl?: string;
}): Record<string, string | number> {
  const env = input.env ?? detectEnv();
  const workType = input.workType ?? undefined;

  const assetFolder =
    input.folder ??
    taxonomyFolderFor({
      env,
      orgId: input.orgId,
      brandId: input.brandId,
      workType,
      workId: input.workId,
    });

  const context = damContextString({
    env,
    orgId: input.orgId,
    brandId: input.brandId,
    workType,
    workId: input.workId,
    shootId: input.shootId,
    campaignId: input.campaignId,
  });

  const params: Record<string, string | number> = {
    timestamp: input.timestamp,
    upload_preset: CLOUDINARY_UPLOAD_PRESET,
    asset_folder: assetFolder,
    type: DELIVERY_TYPE,
    allowed_formats: ALLOWED_UPLOAD_FORMATS,
    unique_filename: "true",
    use_filename: "true",
    context,
  };

  if (input.resourceType === "image") {
    params.eager = CLOUDINARY_EAGER_PRESETS.map(presetTransformString).join("|");
  }
  if (input.notificationUrl) {
    params.notification_url = input.notificationUrl;
  }
  if (input.folder) {
    params.public_id_prefix = input.folder;
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

// Comma-separated hostname allowlist for Cloudinary upload notification
// callbacks. Unset (the default — no caller uses notificationUrl today) means
// deny all, not "allow all": fail closed until a host is explicitly approved.
const NOTIFICATION_ALLOWED_HOSTS_ENV = "CLOUDINARY_NOTIFICATION_ALLOWED_HOSTS";

function isPrivateOrLoopbackHost(hostname: string): boolean {
  const h = hostname.toLowerCase();
  if (h === "localhost" || h.endsWith(".localhost") || h === "0.0.0.0" || h === "::1" || h === "::") {
    return true;
  }
  const ipv4 = h.match(/^(\d{1,3})\.(\d{1,3})\.\d{1,3}\.\d{1,3}$/);
  if (ipv4) {
    const a = Number(ipv4[1]);
    const b = Number(ipv4[2]);
    if (a === 127 || a === 10 || a === 0) return true; // loopback / private / "this network"
    if (a === 172 && b >= 16 && b <= 31) return true; // private
    if (a === 192 && b === 168) return true; // private
    if (a === 169 && b === 254) return true; // link-local (incl. cloud metadata endpoint)
    return false;
  }
  // IPv6 unique-local (fc00::/7) and link-local (fe80::/10)
  if (/^f[cd][0-9a-f]{0,2}:/i.test(h) || h.startsWith("fe80:")) return true;
  return false;
}

/** Returns null when valid, or a user-facing error string. */
export function validateNotificationUrl(raw: string): string | null {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return "notificationUrl must be a valid URL";
  }
  if (url.protocol !== "https:") {
    return "notificationUrl must use https";
  }
  if (url.username || url.password) {
    return "notificationUrl must not contain embedded credentials";
  }
  if (isPrivateOrLoopbackHost(url.hostname)) {
    return "notificationUrl host is not allowed";
  }

  const allowed = (process.env[NOTIFICATION_ALLOWED_HOSTS_ENV] ?? "")
    .split(",")
    .map((h) => h.trim().toLowerCase())
    .filter(Boolean);
  if (!allowed.includes(url.hostname.toLowerCase())) {
    return "notificationUrl host is not on the approved allowlist";
  }
  return null;
}

const WIDGET_SIGN_ALLOWLIST = new Set([
  "timestamp",
  "upload_preset",
  "folder",
  "context",
  "source",
  "format",
]);

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
  "resource_type",
]);

/**
 * Sanitize widget paramsToSign then sign taxonomy folder + context.
 * Requires server-resolved `opts.orgId` (UUID) — never trusts client context for org,
 * and never writes "null"/"unknown" into folder paths.
 */
export function sanitizeWidgetParamsToSign(
  clientParams: Record<string, unknown>,
  brandId: string,
  opts: {
    orgId: string;
    env?: DamEnv;
    workType?: WorkType;
    workId?: string;
  },
): Record<string, string | number> {
  if (!UUID_RE.test(opts.orgId)) {
    throw new Error("sanitizeWidgetParamsToSign: orgId must be a UUID");
  }

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

  const env = opts.env ?? detectEnv();
  const workType = opts.workType;

  out.upload_preset = CLOUDINARY_UPLOAD_PRESET;
  out.folder = taxonomyFolderFor({
    env,
    orgId: opts.orgId,
    brandId,
    workType,
    workId: opts.workId,
  });
  out.context = damContextString({
    env,
    orgId: opts.orgId,
    brandId,
    workType,
    workId: opts.workId,
  });

  return out;
}

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
