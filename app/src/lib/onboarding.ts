// IPI-11 — shared onboarding logic (pure functions, testable in node)

export function validateUrl(url: string): string | null {
  if (!url.trim()) return "Website URL is required";
  if (!/^https?:\/\/.+\..+/.test(url.trim())) return "Enter a valid URL starting with http:// or https://";
  return null;
}

export function slugify(s: string): string {
  return (
    s
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 50) +
    "-" +
    Math.random().toString(36).slice(2, 7)
  );
}

export type OnboardingForm = {
  brandName: string;
  websiteUrl: string;
  instagramHandle: string;
  industry: string;
  goal: string;
};

export type CreateBrandResult = { orgId: string; brandId: string };

export async function createOrgAndBrand(
  supabase: any,
  userId: string,
  form: OnboardingForm,
  aiProfile: Record<string, unknown> | null,
): Promise<CreateBrandResult> {
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
      ai_profile: aiProfile ?? {},
    })
    .select("id")
    .single();

  if (brandErr || !brand?.id) throw new Error(brandErr?.message ?? "Failed to create brand");

  const score = (aiProfile as any)?.score ?? 0;
  await supabase.from("brand_scores").insert({
    brand_id: brand.id,
    score_type: "dna_readiness",
    score,
  });

  return { orgId: org.id, brandId: brand.id };
}
