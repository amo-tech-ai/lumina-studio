import { getCldImageUrl } from "next-cloudinary";

export const CLOUDINARY_CLOUD_NAME =
  process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ??
  process.env.CLOUDINARY_CLOUD_NAME ??
  "dzqy2ixl0";

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

// IPI-257 074e — named transform presets (single source of truth per MEDIA-MAP §5).
// `hitl-diff` is intentionally not modeled here: its spec is "side-by-side derivative
// URLs" (not a crop transform) and its only consumer (Approval/EvidenceBlock UI) is
// out of scope for IPI-257.
export type CropTransform = { width: number; height?: number; crop: "fill" | "thumb" | "limit" };

export const CLOUDINARY_PRESETS: Record<"brand-cover" | "asset-tile" | "asset-masonry", CropTransform> = {
  "brand-cover": { width: 400, height: 300, crop: "fill" },
  "asset-tile": { width: 120, height: 120, crop: "thumb" },
  "asset-masonry": { width: 600, crop: "limit" },
};

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
