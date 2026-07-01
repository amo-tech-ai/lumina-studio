import { describe, expect, it } from "vitest";

import {
  SAMPLE_IMAGE_POOL,
  cloudinaryImageUrl,
  heroFallbackForBrand,
  recentFallbackForShoot,
} from "./sample-images";

describe("sample-images", () => {
  it("builds Cloudinary URL with transforms", () => {
    const url = cloudinaryImageUrl("5-fashionos_wc2p1c", { w: 208, h: 208 });
    expect(url).toMatch(/^https:\/\/res\.cloudinary\.com\//);
    expect(url).toContain("c_fill,w_208,h_208");
    expect(url).toContain("5-fashionos_wc2p1c");
  });

  it("returns deterministic hero fallback for same brandId", () => {
    const a = heroFallbackForBrand("brand-abc");
    const b = heroFallbackForBrand("brand-abc");
    expect(a).toBe(b);
    expect(SAMPLE_IMAGE_POOL.some((id) => a.includes(id))).toBe(true);
  });

  it("returns distinct recent fallbacks for adjacent indices when pool allows", () => {
    const urls = [0, 1, 2, 3, 4].map((i) => recentFallbackForShoot("shoot-x", i));
    expect(new Set(urls).size).toBeGreaterThan(1);
  });

  it("exposes 8 unique public_ids in pool", () => {
    expect(new Set(SAMPLE_IMAGE_POOL).size).toBe(8);
  });
});
