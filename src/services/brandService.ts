import { supabase } from "@/lib/supabase";
import type { BrandScoreRow } from "@/types/brand-intelligence";

export type AiProfile = {
  name: string;
  tagline: string;
  category: string;
  visualIdentity: { colors: string[]; mood: string };
  targetAudience: string;
  sourceUrl: string;
  analyzedAt: string;
  contentPillars?: string[];
  brandVoice?: string;
  recommendedServices?: string[];
  productionReadiness?: number;
};

export type BrandWithScores = {
  id: string;
  name: string;
  brand_url: string | null;
  ai_profile: AiProfile | null;
  brand_scores: BrandScoreRow[];
};

export async function getMyBrand(userId: string): Promise<BrandWithScores | null> {
  const { data, error } = await supabase
    .from("brands")
    .select("id, name, brand_url, ai_profile, brand_scores(*)")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data as BrandWithScores | null;
}
