// IPI-257 074e — signed delivery URLs for pre-approval Cloudinary assets.
// Assets uploaded via /api/assets/upload-sign are always signed `type: authenticated`
// (see upload-sign/route.ts) until a future approval flow flips them public, so any
// preset/channel delivery URL for a real (non-fixture) asset must be signed or Cloudinary
// returns 401/404. Server-only, and lives under api/_lib (not lib/cloudinary) so
// scripts/check-client-env.mjs's directory-based exemption covers the raw
// CLOUDINARY_API_SECRET read — lib/cloudinary/url.ts stays importable from client
// components and must never pull in the secret-reading `cloudinary` v2 SDK.
import { v2 as cloudinary } from "cloudinary";
import { CLOUDINARY_PRESETS, cropTransformString, type CloudinaryPresetName } from "@/lib/cloudinary/url";

export type CloudinaryResourceType = "image" | "video" | "raw";
export type CloudinaryDeliveryType = "upload" | "authenticated" | "private";

export type CloudinarySignedUrlOptions = {
  resourceType?: CloudinaryResourceType;
  deliveryType?: CloudinaryDeliveryType;
};

function ensureCloudinaryConfig(): void {
  const cloud_name = process.env.CLOUDINARY_CLOUD_NAME;
  const api_key = process.env.CLOUDINARY_API_KEY;
  const api_secret = process.env.CLOUDINARY_API_SECRET;
  if (!cloud_name || !api_key || !api_secret) {
    throw new Error("Cloudinary env vars missing");
  }
  cloudinary.config({ cloud_name, api_key, api_secret });
}

function signedUrl(
  publicId: string,
  options: {
    resourceType: CloudinaryResourceType;
    deliveryType: CloudinaryDeliveryType;
    raw_transformation?: string;
    flags?: string;
  },
): string {
  ensureCloudinaryConfig();
  return cloudinary.url(publicId, {
    resource_type: options.resourceType,
    type: options.deliveryType,
    sign_url: true,
    secure: true,
    ...(options.raw_transformation ? { raw_transformation: options.raw_transformation } : {}),
    ...(options.flags ? { flags: options.flags } : {}),
  });
}

/** Signed named-preset delivery URL for a real (authenticated-type) asset.
 *  Image presets apply only to `resource_type=image`. Video/raw get a signed
 *  original delivery URL (no image crop transforms). */
export function cloudinarySignedPresetUrl(
  publicId: string,
  preset: CloudinaryPresetName,
  options: CloudinarySignedUrlOptions = {},
): string {
  const resourceType = options.resourceType ?? "image";
  const deliveryType = options.deliveryType ?? "authenticated";
  if (resourceType !== "image") {
    return signedUrl(publicId, { resourceType, deliveryType });
  }
  return signedUrl(publicId, {
    resourceType: "image",
    deliveryType,
    raw_transformation: cropTransformString(CLOUDINARY_PRESETS[preset]),
  });
}

/** Signed channel-readiness crop, data-driven from the resolved ChannelSpec. */
export function cloudinarySignedChannelUrl(
  publicId: string,
  spec: { widthPx: number; heightPx: number },
  options: CloudinarySignedUrlOptions = {},
): string {
  const resourceType = options.resourceType ?? "image";
  const deliveryType = options.deliveryType ?? "authenticated";
  if (resourceType !== "image") {
    return signedUrl(publicId, { resourceType, deliveryType });
  }
  return signedUrl(publicId, {
    resourceType: "image",
    deliveryType,
    raw_transformation: cropTransformString({
      width: spec.widthPx,
      height: spec.heightPx,
      crop: "fill",
    }),
  });
}

/**
 * Download URL for the original asset (not a preview transform).
 * Prefer Cloudinary's private_download endpoint when a format is known;
 * otherwise fall back to a signed `fl_attachment` delivery URL.
 */
export function cloudinarySignedDownloadUrl(
  publicId: string,
  options: CloudinarySignedUrlOptions & { format?: string | null } = {},
): string {
  ensureCloudinaryConfig();
  const resourceType = options.resourceType ?? "image";
  const deliveryType = options.deliveryType ?? "authenticated";
  const format = options.format?.trim().replace(/^\./, "") || null;

  if (format) {
    return cloudinary.utils.private_download_url(publicId, format, {
      resource_type: resourceType,
      type: deliveryType,
      attachment: true,
    });
  }

  return signedUrl(publicId, {
    resourceType,
    deliveryType,
    flags: "attachment",
  });
}
