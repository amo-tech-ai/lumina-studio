import type { SupabaseClient } from "@supabase/supabase-js";
import { isRpcNotFoundError } from "./rpc-errors";

/** Normalized row from get_brand_assets — platform vs shoot schema unified. */
export type BrandAssetRow = {
  id: string;
  source: "platform" | "shoot";
  shoot_id: string | null;
  url: string;
  thumbnail_url: string | null;
  dna_score: number | null;
  dna_status: string | null;
  status: string | null;
  created_at: string;
};

export type GetBrandAssetsResult =
  | { ok: true; data: BrandAssetRow[] }
  | { ok: false; status: 404 | 500; error: string };

export async function getBrandAssets(
  userSb: SupabaseClient,
  brandId: string,
  shootId?: string | null,
): Promise<GetBrandAssetsResult> {
  const { data, error } = await userSb.rpc("get_brand_assets", {
    p_brand_id: brandId,
    p_shoot_id: shootId ?? null,
  });

  if (error) {
    if (isRpcNotFoundError(error)) {
      return { ok: false, status: 404, error: "Brand or shoot not found" };
    }
    console.error("[get_brand_assets]", error.message);
    return { ok: false, status: 500, error: "Failed to load assets" };
  }

  if (!Array.isArray(data)) {
    return { ok: true, data: [] };
  }

  return { ok: true, data: data as BrandAssetRow[] };
}
