/** Curated Cloudinary pool — `services/` folder on dzqy2ixl0 (DC ph() aligned). */
export const SAMPLE_IMAGE_POOL = [
  "5-fashionos_wc2p1c",
  "8-fashionos_o0m6yc",
  "9-fashionos_ddj5jx",
  "36-fashionos_zvz7o5",
  "39-fashionos_koxmek",
  "40-fashionos_ub4ajn",
  "47-fashionos_jgopjh",
  "48-fashionos_qj0z9e",
] as const;

export type SampleImageKey =
  | "char"
  | "slate"
  | "sand"
  | "clay"
  | "denim"
  | "olive"
  | "blush"
  | "sage";

export const SAMPLE_IMAGE_KEYS: readonly SampleImageKey[] = [
  "char",
  "slate",
  "sand",
  "clay",
  "denim",
  "olive",
  "blush",
  "sage",
] as const;

import { cloudinaryImageUrl } from "@/lib/cloudinary/url";
export { cloudinaryImageUrl };

export function hashIndex(id: string, mod: number): number {
  let hash = 0;
  for (let i = 0; i < id.length; i += 1) {
    hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  }
  return hash % mod;
}

export function heroFallbackForBrand(brandId: string): string {
  const idx = hashIndex(brandId, SAMPLE_IMAGE_POOL.length);
  return cloudinaryImageUrl(SAMPLE_IMAGE_POOL[idx], { w: 208, h: 208 });
}

/** 16:9 card cover for brand list grid (IPI-272). TODO: replace with crawl/OG cover when schema adds cover_url. */
export function brandListCoverForBrand(brandId: string): string {
  const idx = hashIndex(brandId, SAMPLE_IMAGE_POOL.length);
  return cloudinaryImageUrl(SAMPLE_IMAGE_POOL[idx], { w: 640, h: 360 });
}

export function recentFallbackForShoot(shootId: string, index: number): string {
  const base = hashIndex(shootId, SAMPLE_IMAGE_POOL.length);
  const idx = (base + index) % SAMPLE_IMAGE_POOL.length;
  return cloudinaryImageUrl(SAMPLE_IMAGE_POOL[idx], { w: 276, h: 345 });
}

/** 4:3 decorative fallback for shoots-list cards with no `cover_url` (IPI-372/IPI-426).
 *  Real moodboard covers now come from `shoot_portfolio_view.cover_url`; this is fallback-only. */
export function shootListCoverForShoot(shootId: string): string {
  const idx = hashIndex(shootId, SAMPLE_IMAGE_POOL.length);
  return cloudinaryImageUrl(SAMPLE_IMAGE_POOL[idx], { w: 480, h: 360 });
}

export function approvalPreviewUrl(): string {
  return cloudinaryImageUrl(SAMPLE_IMAGE_POOL[6], { w: 472, h: 590 });
}

export function emptyStatePreviewUrl(): string {
  return cloudinaryImageUrl("103-fashionos_gawzdu", { w: 400, h: 300 });
}

/** DC empty-state fan — three tilted 16:10 previews (Brand List.v2.image-first.dc.html). */
export function brandListEmptyPreviewUrls(): string[] {
  return [SAMPLE_IMAGE_POOL[0], SAMPLE_IMAGE_POOL[1], SAMPLE_IMAGE_POOL[2]].map((id) =>
    cloudinaryImageUrl(id, { w: 300, h: 192 }),
  );
}

/** DC empty-state stacked pair — two tilted 120x150 previews (Shoots List.v2.image-first.dc.html). */
export function shootsListEmptyPreviewUrls(): string[] {
  return [SAMPLE_IMAGE_POOL[3], SAMPLE_IMAGE_POOL[4]].map((id) =>
    cloudinaryImageUrl(id, { w: 240, h: 300 }),
  );
}

/** DC asset moodboard strip (Brand Detail workspace). */
export function brandDetailAssetUrls(brandId: string, count = 8): string[] {
  return Array.from({ length: count }, (_, index) => {
    const idx = (hashIndex(brandId, SAMPLE_IMAGE_POOL.length) + index) % SAMPLE_IMAGE_POOL.length;
    return cloudinaryImageUrl(SAMPLE_IMAGE_POOL[idx], { w: 160, h: 160 });
  });
}
