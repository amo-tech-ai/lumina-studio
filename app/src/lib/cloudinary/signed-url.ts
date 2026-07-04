// IPI-257 074e — signed delivery URLs for pre-approval Cloudinary assets.
// Assets uploaded via /api/assets/upload-sign are always signed `type: authenticated`
// (see upload-sign/route.ts) until a future approval flow flips them public, so any
// preset/channel delivery URL for a real (non-fixture) asset must be signed or Cloudinary
// returns 401/404. Server-only: the `cloudinary` v2 SDK needs the API secret and pulls in
// Node built-ins, so this stays out of ./url.ts, which client components also import.
import { v2 as cloudinary } from "cloudinary";
import { CLOUDINARY_PRESETS, cropTransformString, type CloudinaryPresetName } from "./url";

function signedUrl(publicId: string, raw_transformation: string): string {
  const cloud_name = process.env.CLOUDINARY_CLOUD_NAME;
  const api_key = process.env.CLOUDINARY_API_KEY;
  const api_secret = process.env.CLOUDINARY_API_SECRET;
  if (!cloud_name || !api_key || !api_secret) {
    throw new Error("Cloudinary env vars missing");
  }
  cloudinary.config({ cloud_name, api_key, api_secret });
  return cloudinary.url(publicId, {
    type: "authenticated",
    sign_url: true,
    secure: true,
    raw_transformation,
  });
}

/** Signed named-preset delivery URL for a real (authenticated-type) asset. */
export function cloudinarySignedPresetUrl(publicId: string, preset: CloudinaryPresetName): string {
  return signedUrl(publicId, cropTransformString(CLOUDINARY_PRESETS[preset]));
}

/** Signed channel-readiness crop, data-driven from the resolved ChannelSpec. */
export function cloudinarySignedChannelUrl(
  publicId: string,
  spec: { widthPx: number; heightPx: number },
): string {
  return signedUrl(publicId, cropTransformString({ width: spec.widthPx, height: spec.heightPx, crop: "fill" }));
}
