// IPI-46 — onboarding shell + orchestration helpers (pure functions, testable in node)
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

/** Form metadata persisted before edge analysis (merged by edge fn on UPDATE). */
export const buildShellAiProfile = (form: OnboardingForm): Record<string, unknown> => ({
  ...(form.instagramHandle.trim()
    ? { instagram_handle: form.instagramHandle.trim().replace(/^@/, "") }
    : {}),
  industry: form.industry,
  goal: form.goal,
  _lifecycle: "brand_created",
});

const insertOrganization = async (
  supabase: SupabaseClient,
  userId: string,
  form: OnboardingForm,
) => {
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

  if (orgErr || !org?.id) {
    throw new Error(orgErr?.message ?? "Failed to create organization");
  }

  return org.id;
};

const insertBrandShell = async (
  supabase: SupabaseClient,
  userId: string,
  orgId: string,
  form: OnboardingForm,
) => {
  const { data: brand, error: brandErr } = await supabase
    .from("brands")
    .insert({
      name: form.brandName,
      brand_url: form.websiteUrl.trim(),
      user_id: userId,
      org_id: orgId,
      ai_profile: buildShellAiProfile(form),
    })
    .select("id")
    .single();

  if (brandErr || !brand?.id) {
    throw new Error(brandErr?.message ?? "Failed to create brand");
  }

  return brand.id;
};

/** Step 1 of onboarding: org + brand shell only — no edge fn, no score rows. */
export const createOrgAndBrand = async (
  supabase: SupabaseClient,
  userId: string,
  form: OnboardingForm,
): Promise<CreateBrandResult> => {
  const orgId = await insertOrganization(supabase, userId, form);

  try {
    const brandId = await insertBrandShell(supabase, userId, orgId, form);
    return { orgId, brandId };
  } catch (err) {
    await supabase.from("organizations").delete().eq("id", orgId);
    throw err;
  }
};

export type BrandIntelligenceResponse = {
  brandId?: string;
  profile?: Record<string, unknown>;
  scores?: { score_type: string; score: number }[];
};

/** Step 2: invoke edge fn with existing brandId (scores + profile persisted server-side). */
export const invokeBrandIntelligence = async (
  supabase: SupabaseClient,
  brandId: string,
  form: OnboardingForm,
): Promise<BrandIntelligenceResponse> => {
  const { data, error } = await supabase.functions.invoke("brand-intelligence", {
    body: {
      url: form.websiteUrl.trim(),
      brandId,
      brand_name: form.brandName.trim(),
    },
  });

  if (error) {
    throw new Error(error.message || "Brand analysis failed");
  }

  const payload = data as BrandIntelligenceResponse | null;
  if (!payload?.brandId) {
    throw new Error("Brand analysis returned no brandId");
  }
  if (payload.brandId !== brandId) {
    throw new Error("Brand analysis returned mismatched brandId");
  }

  return payload;
};
