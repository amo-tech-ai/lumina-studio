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
