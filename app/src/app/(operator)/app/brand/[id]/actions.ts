"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@supabase/supabase-js";
import { invokeBrandIntelligence } from "@/lib/onboarding";
import { getMastra } from "@/mastra";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );
}

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

  const { data: brand, error: selectErr } = await supabase
    .from("brands")
    .select("id, ai_profile_draft, intake_status")
    .eq("id", brandId)
    .maybeSingle();

  if (selectErr) return { ok: false, error: selectErr.message };
  if (!brand?.ai_profile_draft) return { ok: false, error: "No draft to apply" };

  const draft = brand.ai_profile_draft as Record<string, unknown>;

  // Extract draft scores before promoting; strip _draft_scores from the live profile
  const draftScores = Array.isArray(draft._draft_scores)
    ? (draft._draft_scores as Array<Record<string, unknown>>)
    : [];
  const { _draft_scores: _removed, ...cleanDraft } = draft;

  const { data: updated, error } = await supabase
    .from("brands")
    .update({
      ai_profile: cleanDraft,
      ai_profile_draft: null,
      intake_status: "ready",
      ...(typeof cleanDraft.name === "string" ? { name: cleanDraft.name } : {}),
    })
    .eq("id", brandId)
    .eq("intake_status", "draft_ready")
    .select("id")
    .maybeSingle();

  if (error) return { ok: false, error: error.message };
  if (!updated) return { ok: false, error: "Brand is not in draft_ready state" };

  // Upsert scores that were held in the draft
  if (draftScores.length > 0) {
    const scoreRows = draftScores.map((r) => ({ ...r, brand_id: brandId }));
    const { error: scoresErr } = await supabase
      .from("brand_scores")
      .upsert(scoreRows, { onConflict: "brand_id,score_type" });
    // ponytail: promotion already committed; log and accept partial success rather than leaving brand stranded
    if (scoresErr) console.error("brand_scores upsert failed after applyDraft:", scoresErr.message);
  }

  revalidatePath(`/app/brand/${brandId}`);
  return { ok: true };
}

export async function approveWorkflowDraft(brandId: string, runId: string): Promise<{ ok: boolean; error?: string }> {
  if (!brandId || !runId) return { ok: false, error: "brandId and runId required" };

  const supabase = await createSupabaseServerClient();
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) return { ok: false, error: "Not signed in" };

  // TOCTOU guard runs first — prevents double-approve and scopes to this brand
  const admin = adminClient();
  const { data: claimed, error: claimErr } = await admin
    .from("brand_intake_drafts")
    .update({ status: "approved", approved_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq("brand_id", brandId)
    .eq("draft_profile->>_workflow_run_id", runId)
    .eq("status", "pending_approval")
    .select("id")
    .single();
  if (claimErr || !claimed) return { ok: false, error: "already_processed" };

  // Promote draft profile → live; rollback the intake row if this fails so the operator can retry
  const applyResult = await applyDraft(brandId);
  if (!applyResult.ok && applyResult.error !== "Brand is not in draft_ready state") {
    await admin
      .from("brand_intake_drafts")
      .update({ status: "pending_approval", approved_at: null, updated_at: new Date().toISOString() })
      .eq("id", claimed.id);
    return { ok: false, error: applyResult.error };
  }

  // Resume workflow (best-effort — profile already promoted above)
  try {
    const run = await getMastra().getWorkflow("brand-intelligence").createRun({ runId });
    await run.resume({ step: "save-draft-and-wait", resumeData: { approved: true } });
  } catch (e) {
    console.error("[approveWorkflowDraft] resume failed:", e);
  }

  revalidatePath(`/app/brand/${brandId}`);
  return { ok: true };
}

export async function rejectWorkflowDraft(brandId: string, runId: string): Promise<{ ok: boolean; error?: string }> {
  if (!brandId || !runId) return { ok: false, error: "brandId and runId required" };

  const supabase = await createSupabaseServerClient();
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) return { ok: false, error: "Not signed in" };

  // TOCTOU guard — scoped to this brand; fails if already processed
  const admin = adminClient();
  const { data: updated, error: updateErr } = await admin
    .from("brand_intake_drafts")
    .update({ status: "rejected", rejected_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq("brand_id", brandId)
    .eq("draft_profile->>_workflow_run_id", runId)
    .eq("status", "pending_approval")
    .select("id")
    .single();
  if (updateErr || !updated) return { ok: false, error: "already_processed" };

  // Clear ai_profile_draft and restore intake_status; rollback intake row on failure so operator can retry
  const discardResult = await discardDraft(brandId);
  if (!discardResult.ok && discardResult.error !== "Brand is not in draft_ready state") {
    console.error("[rejectWorkflowDraft] discardDraft failed:", discardResult.error);
    await admin
      .from("brand_intake_drafts")
      .update({ status: "pending_approval", rejected_at: null, updated_at: new Date().toISOString() })
      .eq("id", updated.id);
    return { ok: false, error: discardResult.error };
  }

  // Best-effort: resume workflow so it doesn't stay permanently suspended.
  // ponytail: commitOrReject sets intake_status="failed" for rejected runs — acceptable for MVP;
  // will be fixed when commitOrReject is refactored to check for a prior valid live profile.
  try {
    const run = await getMastra().getWorkflow("brand-intelligence").createRun({ runId });
    await run.resume({ step: "save-draft-and-wait", resumeData: { approved: false } });
  } catch (e) {
    console.error("[rejectWorkflowDraft] resume failed:", e);
  }

  revalidatePath(`/app/brand/${brandId}`);
  return { ok: true };
}

export async function discardDraft(brandId: string): Promise<{ ok: boolean; error?: string }> {
  if (!brandId) return { ok: false, error: "Brand id is required" };

  const supabase = await createSupabaseServerClient();
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) return { ok: false, error: "Not signed in" };

  const { data: brand, error: selectErr } = await supabase
    .from("brands")
    .select("id, ai_profile, intake_status")
    .eq("id", brandId)
    .maybeSingle();

  if (selectErr) return { ok: false, error: selectErr.message };
  if (!brand) return { ok: false, error: "Brand not found" };

  // Restore to ready only if a live analyzed profile exists; otherwise back to brand_created
  const priorProfile = brand.ai_profile as Record<string, unknown> | null;
  const restoreStatus = priorProfile?._lifecycle === "scores_complete" ? "ready" : "brand_created";

  const { data: updated, error } = await supabase
    .from("brands")
    .update({ ai_profile_draft: null, intake_status: restoreStatus })
    .eq("id", brandId)
    .eq("intake_status", "draft_ready")
    .select("id")
    .maybeSingle();

  if (error) return { ok: false, error: error.message };
  if (!updated) return { ok: false, error: "Brand is not in draft_ready state" };

  revalidatePath(`/app/brand/${brandId}`);
  return { ok: true };
}
