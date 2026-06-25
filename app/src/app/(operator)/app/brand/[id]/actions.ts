"use server";

import { revalidatePath } from "next/cache";
import { invokeBrandIntelligence } from "@/lib/onboarding";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type ReanalyzeResult = { ok: true } | { ok: false; error: string };

export async function reanalyzeBrand(brandId: string): Promise<ReanalyzeResult> {
  if (!brandId) return { ok: false, error: "Brand id is required" };

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser();

  if (authErr || !user) {
    return { ok: false, error: "You must be signed in to re-analyze" };
  }

  const { data: brand, error: brandErr } = await supabase
    .from("brands")
    .select("id, name, brand_url, intake_status")
    .eq("id", brandId)
    .maybeSingle();

  if (brandErr || !brand) {
    return { ok: false, error: "Brand not found" };
  }

  if (!brand.brand_url?.trim()) {
    return { ok: false, error: "Brand has no website URL to analyze" };
  }

  if (brand.intake_status === "crawl_running" || brand.intake_status === "analysis_running") {
    return { ok: false, error: "Analysis already in progress" };
  }

  try {
    await invokeBrandIntelligence(supabase, brandId, {
      brandName: brand.name,
      websiteUrl: brand.brand_url,
      instagramHandle: "",
      industry: "",
      goal: "",
    });

    await supabase
      .from("brands")
      .update({ intake_status: "ready" })
      .eq("id", brandId);

    revalidatePath(`/app/brand/${brandId}`);
    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Re-analyze failed";
    return { ok: false, error: message };
  }
}
