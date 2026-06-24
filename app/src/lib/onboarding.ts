// IPI-11 — shared onboarding logic (pure functions, testable in node)
import type { SupabaseClient } from "@supabase/supabase-js";

export const validateUrl = (url: string): string | null => {
  if (!url.trim()) return "Website URL is required";
  if (!/^https?:\/\/.+\..+/.test(url.trim()))
    return "Enter a valid URL starting with http:// or https://";
  return null;
};

export const slugify = (s: string): string =>
  `${s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 50)}-${Math.random().toString(36).slice(2, 7)}`;

export type OnboardingForm = {
  brandName: string;
  websiteUrl: string;
  instagramHandle: string;
  industry: string;
  goal: string;
};

export type CreateBrandResult = { orgId: string; brandId: string };

export const createOrgAndBrand = async (
  supabase: SupabaseClient,
  userId: string,
  form: OnboardingForm,
  aiProfile: Record<string, unknown> | null,
): Promise<CreateBrandResult> => {
  const { data: org, error: orgErr } = await supabase
    .from("organizations")
    .insert({
      name: form.brandName,
      slug: slugify(form.brandName),
      owner_id: userId,
      type: "brand",
    })
    .select("id")
    .single();

  if (orgErr || !org?.id) throw new Error(orgErr?.message ?? "Failed to create organization");

  const { data: brand, error: brandErr } = await supabase
    .from("brands")
    .insert({
      name: form.brandName,
      user_id: userId,
      org_id: org.id,
      ai_profile: {
        ...(aiProfile ?? {}),
        ...(form.instagramHandle ? { instagram_handle: form.instagramHandle } : {}),
        industry: form.industry,
        goal: form.goal,
      },
    })
    .select("id")
    .single();

  if (brandErr || !brand?.id) {
    // ponytail: best-effort orphan cleanup — org was committed, brand failed
    void supabase.from("organizations").delete().eq("id", org.id);
    throw new Error(brandErr?.message ?? "Failed to create brand");
  }

  const rawScore = (aiProfile ?? {}).score;
  const score = typeof rawScore === "number" ? rawScore : 0;
  const { error: scoreErr } = await supabase.from("brand_scores").insert({
    brand_id: brand.id,
    score_type: "dna_readiness",
    score,
  });
  // ponytail: score write is intentionally non-blocking — brand is already created
  if (scoreErr) console.warn("brand_scores insert failed (non-blocking):", scoreErr.message);

  return { orgId: org.id, brandId: brand.id };
};
