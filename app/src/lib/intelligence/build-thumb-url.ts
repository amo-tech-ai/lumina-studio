/** Cloudinary thumbnail for asset grid / panel previews. */
export function buildThumbUrl(publicId: string): string {
  const cloud = process.env.CLOUDINARY_CLOUD_NAME ?? "dzqy2ixl0";
  return `https://res.cloudinary.com/${cloud}/image/upload/c_thumb,w_120,h_120,g_auto/${publicId}`;
}
