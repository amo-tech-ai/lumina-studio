"use server";

import { revalidatePath } from "next/cache";
import { discardBrandDraft } from "@/lib/brand/discard-draft";
import { processBrandIntelligenceDraftApproval } from "@/app/api/_lib/process-draft-approval";
import { promoteBrandDraft } from "@/lib/brand/promote-draft";
import { invokeBrandIntelligence } from "@/lib/onboarding";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type ReanalyzeResult =
  | { ok: true; hasDraft: true }
  | { ok: false; error: string };

async function restoreBrandStatus(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  brandId: string,
  status: string,
) {
  await supabase.from("brands").update({ intake_status: status }).eq("id", brandId);
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

  if (
    brand.intake_status === "crawl_running" ||
    brand.intake_status === "analysis_running" ||
    brand.intake_status === "draft_ready"
  ) {
    return { ok: false, error: "Analysis already in progress" };
  }

  const priorStatus = brand.intake_status ?? "ready";

  const { data: locked, error: lockErr } = await supabase
    .from("brands")
    .update({ intake_status: "analysis_running" })
    .eq("id", brandId)
    .not("intake_status", "in", "(crawl_running,analysis_running,draft_ready)")
    .select("id")
    .maybeSingle();

  if (lockErr) {
    return { ok: false, error: "Could not start analysis" };
  }
  if (!locked) {
    return { ok: false, error: "Analysis already in progress" };
  }

  try {
    // draft_mode: true → edge fn writes ai_profile_draft, not ai_profile; skips scores upsert
    await invokeBrandIntelligence(
      supabase,
      brandId,
      { brandName: brand.name, websiteUrl: brand.brand_url, instagramHandle: "", industry: "", goal: "" },
      { draftMode: true },
    );

    revalidatePath(`/app/brand/${brandId}`);
    return { ok: true, hasDraft: true };
  } catch (err) {
    // Restore prior status so a failed re-analyze doesn't corrupt a healthy brand
    await restoreBrandStatus(supabase, brandId, priorStatus);
    const message = err instanceof Error ? err.message : "Re-analyze failed";
    return { ok: false, error: message };
  }
}

export async function applyDraft(brandId: string): Promise<{ ok: boolean; error?: string }> {
  if (!brandId) return { ok: false, error: "Brand id is required" };

  const supabase = await createSupabaseServerClient();
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) return { ok: false, error: "Not signed in" };

  const result = await promoteBrandDraft(supabase, brandId);
  if (!result.ok) return result;

  revalidatePath(`/app/brand/${brandId}`);
  return { ok: true };
}

export async function approveWorkflowDraft(brandId: string, runId: string): Promise<{ ok: boolean; error?: string }> {
  if (!brandId || !runId) return { ok: false, error: "brandId and runId required" };

  const supabase = await createSupabaseServerClient();
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) return { ok: false, error: "Not signed in" };

  const result = await processBrandIntelligenceDraftApproval({
    runId,
    approved: true,
    operatorId: user.id,
  });
  if (!result.ok) {
    return {
      ok: false,
      error: result.error.includes("already processed") ? "already_processed" : result.error,
    };
  }
  if (result.brandId !== brandId) return { ok: false, error: "Draft does not belong to this brand" };

  revalidatePath(`/app/brand/${brandId}`);
  return { ok: true };
}

export async function rejectWorkflowDraft(brandId: string, runId: string): Promise<{ ok: boolean; error?: string }> {
  if (!brandId || !runId) return { ok: false, error: "brandId and runId required" };

  const supabase = await createSupabaseServerClient();
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) return { ok: false, error: "Not signed in" };

  const result = await processBrandIntelligenceDraftApproval({
    runId,
    approved: false,
    operatorId: user.id,
  });
  if (!result.ok) {
    return {
      ok: false,
      error: result.error.includes("already processed") ? "already_processed" : result.error,
    };
  }
  if (result.brandId !== brandId) return { ok: false, error: "Draft does not belong to this brand" };

  revalidatePath(`/app/brand/${brandId}`);
  return { ok: true };
}

export async function discardDraft(brandId: string): Promise<{ ok: boolean; error?: string }> {
  if (!brandId) return { ok: false, error: "Brand id is required" };

  const supabase = await createSupabaseServerClient();
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) return { ok: false, error: "Not signed in" };

  const result = await discardBrandDraft(supabase, brandId);
  if (!result.ok) return result;

  revalidatePath(`/app/brand/${brandId}`);
  return { ok: true };
}
