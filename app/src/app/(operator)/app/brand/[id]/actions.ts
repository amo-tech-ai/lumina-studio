"use server";

import { revalidatePath } from "next/cache";
import { discardBrandDraft } from "@/lib/brand/discard-draft";
import { processBrandIntelligenceDraftApproval } from "@/app/api/_lib/process-draft-approval-after";
import { promoteBrandDraft } from "@/lib/brand/promote-draft";
import { createSupabaseServerClient } from "@/lib/supabase/server";

// IPI-919 · ONB2-INT-001f — the legacy `reanalyzeBrand` Server Action was
// retired here. It was the only failed-recovery door before IPI-905/918 and
// always started a fresh crawl, even when only Brand Intelligence had failed.
// Recovery now has exactly one door: POST /api/brands/[id]/restart-analysis
// (IPI-905/918), which is stage-aware and reuses a completed crawl. Initial
// onboarding kickoff never used this action — it stays with the onboarding
// flow (kickoffOnboardingCrawl / Mastra brand-intelligence-workflow).

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
    expectedBrandId: brandId,
  });
  if (!result.ok) {
    return {
      ok: false,
      error: result.error.includes("already processed") ? "already_processed" : result.error,
    };
  }

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
    expectedBrandId: brandId,
  });
  if (!result.ok) {
    return {
      ok: false,
      error: result.error.includes("already processed") ? "already_processed" : result.error,
    };
  }

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
