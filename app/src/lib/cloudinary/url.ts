import { getCldImageUrl } from "next-cloudinary";

export const CLOUDINARY_CLOUD_NAME =
  process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ??
  process.env.CLOUDINARY_CLOUD_NAME ??
  "dzqy2ixl0";

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
type CloudinaryPreset = { width: number; height?: number; crop: "fill" | "thumb" | "limit" };

export const CLOUDINARY_PRESETS: Record<"brand-cover" | "asset-tile" | "asset-masonry", CloudinaryPreset> = {
  "brand-cover": { width: 400, height: 300, crop: "fill" },
  "asset-tile": { width: 120, height: 120, crop: "thumb" },
  "asset-masonry": { width: 600, crop: "limit" },
};

export type CloudinaryPresetName = keyof typeof CLOUDINARY_PRESETS;

/** Named-preset delivery URL — components pass a preset name, never inline transform params. */
export function cloudinaryPresetUrl(publicId: string, preset: CloudinaryPresetName): string {
  const { width, height, crop } = CLOUDINARY_PRESETS[preset];
  return getCldImageUrl(
    {
      src: publicId,
      width,
      height,
      crop,
      gravity: crop === "limit" ? undefined : "auto",
      format: "auto",
      quality: "auto",
    },
    { cloud: { cloudName: CLOUDINARY_CLOUD_NAME } },
  );
}

/** Channel-readiness crop, data-driven from the resolved ChannelSpec (no per-platform preset). */
export function cloudinaryChannelUrl(
  publicId: string,
  spec: { widthPx: number; heightPx: number },
): string {
  return getCldImageUrl(
    {
      src: publicId,
      width: spec.widthPx,
      height: spec.heightPx,
      crop: "fill",
      gravity: "auto",
      format: "auto",
      quality: "auto",
    },
    { cloud: { cloudName: CLOUDINARY_CLOUD_NAME } },
  );
}
