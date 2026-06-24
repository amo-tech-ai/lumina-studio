import { supabase } from "@/lib/supabase";
import type { BrandScoreRow } from "@/types/brand-intelligence";
import type { Json } from "@/types/supabase";

export type BrandSummary = {
  id: string;
  name: string;
  brand_url: string | null;
  ai_profile: Json;
  created_at: string;
};

export async function listUserBrands(): Promise<BrandSummary[]> {
  const { data, error } = await supabase
    .from("brands")
    .select("id, name, brand_url, ai_profile, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}

export async function getBrandScores(brandId: string): Promise<BrandScoreRow[]> {
  const { data, error } = await supabase
    .from("brand_scores")
    .select("id, score_type, score")
    .eq("brand_id", brandId);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as BrandScoreRow[];
}
