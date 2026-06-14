import { supabase } from "@/lib/supabase";
import type { BrandScoreRow } from "@/types/brand-intelligence";

export type BrandRecord = {
  id: string;
  name: string;
  brand_url: string | null;
  ai_profile: Record<string, unknown>;
  updated_at: string;
};

export async function fetchLatestBrand(): Promise<BrandRecord | null> {
  const { data, error } = await supabase
    .from("brands")
    .select("id, name, brand_url, ai_profile, updated_at")
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

/** Latest score row per score_type for a brand. */
export async function fetchBrandScores(brandId: string): Promise<BrandScoreRow[]> {
  const { data, error } = await supabase
    .from("brand_scores")
    .select("id, score_type, score, created_at")
    .eq("brand_id", brandId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  const seen = new Set<string>();
  const latest: BrandScoreRow[] = [];

  for (const row of data ?? []) {
    if (seen.has(row.score_type)) continue;
    seen.add(row.score_type);
    latest.push({
      id: row.id,
      score_type: row.score_type,
      score: Number(row.score),
    });
  }

  return latest;
}
