"use server";

import { revalidatePath } from "next/cache";
import { invokeBrandIntelligence } from "@/lib/onboarding";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type ReanalyzeResult =
  | { ok: true; hasDraft: true }
  | { ok: false; error: string };

async function markBrandFailed(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  brandId: string,
) {
  await supabase.from("brands").update({ intake_status: "failed" }).eq("id", brandId);
}

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

  const { data: locked, error: lockErr } = await supabase
    .from("brands")
    .update({ intake_status: "analysis_running" })
    .eq("id", brandId)
    .not("intake_status", "in", "(crawl_running,analysis_running)")
    .select("id")
    .maybeSingle();

  if (lockErr) {
    return { ok: false, error: "Could not start analysis" };
  }
  if (!locked) {
    return { ok: false, error: "Analysis already in progress" };
  }

  try {
    // draft_mode: true → edge fn writes ai_profile_draft, not ai_profile
    await invokeBrandIntelligence(
      supabase,
      brandId,
      { brandName: brand.name, websiteUrl: brand.brand_url, instagramHandle: "", industry: "", goal: "" },
      { draftMode: true },
    );

    revalidatePath(`/app/brand/${brandId}`);
    return { ok: true, hasDraft: true };
  } catch (err) {
    await markBrandFailed(supabase, brandId);
    const message = err instanceof Error ? err.message : "Re-analyze failed";
    return { ok: false, error: message };
  }
}

export async function applyDraft(brandId: string): Promise<{ ok: boolean; error?: string }> {
  if (!brandId) return { ok: false, error: "Brand id is required" };

  const supabase = await createSupabaseServerClient();
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) return { ok: false, error: "Not signed in" };

  const { data: brand } = await supabase
    .from("brands")
    .select("id, ai_profile_draft")
    .eq("id", brandId)
    .maybeSingle();

  if (!brand?.ai_profile_draft) return { ok: false, error: "No draft to apply" };

  const draft = brand.ai_profile_draft as Record<string, unknown>;
  const { error } = await supabase
    .from("brands")
    .update({
      ai_profile: draft,
      ai_profile_draft: null,
      intake_status: "ready",
      ...(typeof draft.name === "string" ? { name: draft.name } : {}),
    })
    .eq("id", brandId);

  if (error) return { ok: false, error: error.message };

  revalidatePath(`/app/brand/${brandId}`);
  return { ok: true };
}

export async function discardDraft(brandId: string): Promise<{ ok: boolean; error?: string }> {
  if (!brandId) return { ok: false, error: "Brand id is required" };

  const supabase = await createSupabaseServerClient();
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) return { ok: false, error: "Not signed in" };

  const { error } = await supabase
    .from("brands")
    .update({ ai_profile_draft: null, intake_status: "ready" })
    .eq("id", brandId);

  if (error) return { ok: false, error: error.message };

  revalidatePath(`/app/brand/${brandId}`);
  return { ok: true };
}
