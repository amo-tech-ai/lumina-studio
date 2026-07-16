import { getCldImageUrl } from "next-cloudinary";

// Resolve from the PUBLIC var only. The cloud name is inherently public (it's in
// every browser image URL), and `isDeliverableCover` runs client-side where a
// server-only `CLOUDINARY_CLOUD_NAME` is undefined — mixing the two would let the
// client guard and next/image remotePatterns disagree and silently reject covers.
export const CLOUDINARY_CLOUD_NAME =
  process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ?? "dzqy2ixl0";

/** True when `url` is a delivery URL under our configured cloud — i.e. next/image's
 *  remotePatterns will allow it. Cover URLs come from free-form `mood_board_urls`;
 *  one pointing at another host must fall back, since next/image THROWS (not degrades)
 *  on an un-allowed host. */
export function isDeliverableCover(url: string | null | undefined): url is string {
  return (
    typeof url === "string" &&
    url.startsWith(`https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload/`)
  );
}

/** Shared Cloudinary delivery URL builder — wraps next-cloudinary's getCldImageUrl. */
export function cloudinaryImageUrl(
  publicId: string,
  { w, h, crop = "fill" }: { w: number; h: number; crop?: "fill" | "thumb" },
): string {
  return getCldImageUrl(
    { src: publicId, width: w, height: h, crop, gravity: "auto" },
    { cloud: { cloudName: CLOUDINARY_CLOUD_NAME } },
  );
}

// IPI-257 074e / IPI-430 — transform presets (single source of truth per MEDIA-MAP §5).
// Dashboard named transforms: asset-masonry, asset-review, asset-detail.
// `hitl-diff` is intentionally not modeled here: its spec is "side-by-side derivative
// URLs" (not a crop transform) and its only consumer (Approval/EvidenceBlock UI) is
// out of scope for IPI-257.
export type CropTransform = { width: number; height?: number; crop: "fill" | "thumb" | "limit" };

export const CLOUDINARY_UPLOAD_PRESET = "ipix-signed-upload";

/** Schema version mirrored into Cloudinary structured metadata (`ipix_schema_version`). */
export const CLOUDINARY_METADATA_SCHEMA_VERSION = "1";

export const CLOUDINARY_PRESETS: Record<
  "brand-cover" | "asset-tile" | "asset-masonry" | "asset-review" | "asset-detail",
  CropTransform
> = {
  "brand-cover": { width: 400, height: 300, crop: "fill" },
  "asset-tile": { width: 120, height: 120, crop: "thumb" },
  "asset-masonry": { width: 600, crop: "limit" },
  "asset-review": { width: 1200, crop: "limit" },
  "asset-detail": { width: 1600, crop: "limit" },
};

/** Eager transforms generated on every image upload (IPI-430). */
export const CLOUDINARY_EAGER_PRESETS = ["asset-masonry", "asset-review", "asset-detail"] as const;

export type CloudinaryPresetName = keyof typeof CLOUDINARY_PRESETS;

/**
 * Raw Cloudinary transformation string (e.g. "c_thumb,w_120,h_120,g_auto,f_auto,q_auto").
 * Single source of truth for both eager upload pregeneration (upload-sign/route.ts) and
 * signed delivery URLs (signed-url.ts) so the two can never drift out of sync.
 */
export function cropTransformString({ width, height, crop }: CropTransform): string {
  const parts = [`c_${crop}`, `w_${width}`];
  if (height) parts.push(`h_${height}`);
  if (crop !== "limit") parts.push("g_auto");
  parts.push("f_auto", "q_auto");
  return parts.join(",");
}

export function presetTransformString(preset: CloudinaryPresetName): string {
  return cropTransformString(CLOUDINARY_PRESETS[preset]);
}

/**
 * Injects a preset's transform string into a raw Cloudinary delivery URL already
 * stored verbatim (e.g. `assets.url`/`assets.thumbnail_url` — no `public_id` column
 * is populated yet, so `cloudinaryImageUrl`'s public-id builder doesn't apply here).
 * Only call after `isDeliverableCover(url)` confirms the '/image/upload/' marker exists;
 * otherwise returns the URL unchanged.
 */
export function withCloudinaryPreset(url: string, preset: CloudinaryPresetName): string {
  const marker = "/image/upload/";
  const idx = url.indexOf(marker);
  if (idx === -1) return url;
  const insertAt = idx + marker.length;
  return `${url.slice(0, insertAt)}${presetTransformString(preset)}/${url.slice(insertAt)}`;
}
