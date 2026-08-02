"use server";

import { randomUUID } from "node:crypto";

import { createSupabaseAdminClient } from "@/app/api/_lib/supabase-admin";
import {
  stripBrandProfileMeta,
  validateBrandProfilePayload,
} from "@/lib/brand/brand-profile-contract";
import { parseAiProfile } from "@/lib/brand-hub";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type OnboardingDnaPillar = {
  title: string;
  value: string;
  hint: string;
};

export type EnsureOnboardingIntakeDraftResult =
  | {
      ok: true;
      intakeStatus: string;
      runId: string | null;
      brandName: string | null;
      pillars: OnboardingDnaPillar[];
    }
  | { ok: false; error: string };

const SAFE_LOAD_ERROR = "We couldn’t load your Brand DNA. Please try again.";

function pillarsFromDraft(draft: Record<string, unknown> | null): OnboardingDnaPillar[] {
  const profile = parseAiProfile(draft ?? {});
  const palette =
    profile.visualIdentity?.colors?.slice(0, 3).join(" · ") ||
    profile.visualIdentity?.mood ||
    "—";
  return [
    {
      title: "Voice",
      hint: "How your brand sounds",
      value: profile.brandVoice || profile.tagline || "—",
    },
    {
      title: "Palette",
      hint: "The colours you own",
      value: palette,
    },
    {
      title: "Audience",
      hint: "Who you speak to",
      value: profile.targetAudience || "—",
    },
    {
      title: "Positioning",
      hint: "Where you sit in the market",
      value: profile.positioning || profile.uvp || profile.category || "—",
    },
  ];
}

function runIdFromDraftProfile(draftProfile: unknown): string | null {
  if (!draftProfile || typeof draftProfile !== "object" || Array.isArray(draftProfile)) {
    return null;
  }
  const runId = (draftProfile as Record<string, unknown>)._workflow_run_id;
  return typeof runId === "string" && runId.length > 0 ? runId : null;
}

/**
 * IPI-835 · D — ensure a pending `brand_intake_drafts` row exists for onboarding
 * edge BI (`draft_mode`), so screen 13 can call the existing approve route.
 *
 * Edge draft_mode writes `ai_profile_draft` + `draft_ready` but does not create
 * the intake-draft / `_workflow_run_id` the approve path needs. Mastra workflow
 * start cannot run after Slice C already claimed crawl_running/crawl_complete.
 *
 * Admin upsert is required (table has SELECT RLS only). Writes are gated by:
 * 1) user JWT brand SELECT (RLS), 2) owner/editor authZ, 3) no steal of another
 * operator's pending draft, 4) upsert bound only to the RLS-validated brand id.
 */
export async function ensureOnboardingIntakeDraft(
  brandId: string,
): Promise<EnsureOnboardingIntakeDraftResult> {
  if (!brandId) return { ok: false, error: SAFE_LOAD_ERROR };

  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
      error: authErr,
    } = await supabase.auth.getUser();
    if (authErr || !user) return { ok: false, error: "Not signed in" };

    // Visibility via RLS — non-members get not-found, not a draft leak.
    const { data: brand, error: brandErr } = await supabase
      .from("brands")
      .select("id, name, brand_url, intake_status, ai_profile, ai_profile_draft, org_id, user_id")
      .eq("id", brandId)
      .maybeSingle();
    if (brandErr) {
      console.error("[ensureOnboardingIntakeDraft] brand lookup", brandErr);
      return { ok: false, error: SAFE_LOAD_ERROR };
    }
    if (!brand) return { ok: false, error: "Brand not found" };

    // Viewers can SELECT brands but must not register an approvable draft.
    if (brand.org_id) {
      const { data: canEdit, error: roleErr } = await supabase.rpc("is_org_editor_or_above", {
        p_org_id: brand.org_id,
      });
      if (roleErr) {
        console.error("[ensureOnboardingIntakeDraft] role check", roleErr);
        return { ok: false, error: SAFE_LOAD_ERROR };
      }
      if (!canEdit) return { ok: false, error: "Forbidden" };
    } else if (brand.user_id !== user.id) {
      return { ok: false, error: "Forbidden" };
    }

    // Only ever write against the id that passed the user-scoped SELECT.
    const trustedBrandId = brand.id as string;

    const intakeStatus =
      typeof brand.intake_status === "string" ? brand.intake_status : "brand_created";
    const draftRaw = (brand.ai_profile_draft as Record<string, unknown> | null) ?? null;
    const liveRaw = (brand.ai_profile as Record<string, unknown> | null) ?? null;

    // Already past HITL (ready) or legacy edge live-write (scores_complete).
    if (intakeStatus === "ready" || intakeStatus === "scores_complete") {
      return {
        ok: true,
        intakeStatus,
        runId: null,
        brandName: brand.name ?? null,
        pillars: pillarsFromDraft(liveRaw ?? draftRaw),
      };
    }

    const pillars = pillarsFromDraft(draftRaw);

    if (intakeStatus !== "draft_ready" || !draftRaw) {
      return {
        ok: true,
        intakeStatus,
        runId: null,
        brandName: brand.name ?? null,
        pillars,
      };
    }

    const contractPayload = stripBrandProfileMeta(draftRaw);
    if (!contractPayload || validateBrandProfilePayload(contractPayload) !== null) {
      return { ok: false, error: "Brand DNA is incomplete or invalid" };
    }

    const admin = createSupabaseAdminClient();
    const { data: existing, error: existingErr } = await admin
      .from("brand_intake_drafts")
      .select("id, status, user_id, draft_profile")
      .eq("brand_id", trustedBrandId)
      .maybeSingle();
    if (existingErr) {
      console.error("[ensureOnboardingIntakeDraft] draft lookup", existingErr);
      return { ok: false, error: SAFE_LOAD_ERROR };
    }

    // Admin upsert bypasses RLS — never rewrite another operator's row.
    if (existing?.user_id && existing.user_id !== user.id) {
      return { ok: false, error: "Forbidden" };
    }

    // Another tab may have approved already — do not demote approved → pending.
    if (existing?.status === "approved") {
      return {
        ok: true,
        intakeStatus,
        runId: runIdFromDraftProfile(existing.draft_profile),
        brandName: brand.name ?? null,
        pillars,
      };
    }

    const existingRunId =
      existing?.status === "pending_approval" ? runIdFromDraftProfile(existing.draft_profile) : null;

    if (existingRunId && existing?.user_id === user.id) {
      return {
        ok: true,
        intakeStatus,
        runId: existingRunId,
        brandName: brand.name ?? null,
        pillars,
      };
    }

    // Race: brand may have been promoted between the first SELECT and this write.
    const { data: brandNow, error: brandNowErr } = await supabase
      .from("brands")
      .select("intake_status")
      .eq("id", trustedBrandId)
      .maybeSingle();
    if (brandNowErr) {
      console.error("[ensureOnboardingIntakeDraft] brand re-check", brandNowErr);
      return { ok: false, error: SAFE_LOAD_ERROR };
    }
    const intakeNow =
      typeof brandNow?.intake_status === "string" ? brandNow.intake_status : intakeStatus;
    if (intakeNow === "ready" || intakeNow === "scores_complete") {
      return {
        ok: true,
        intakeStatus: intakeNow,
        runId: null,
        brandName: brand.name ?? null,
        pillars: pillarsFromDraft(liveRaw ?? draftRaw),
      };
    }
    if (intakeNow !== "draft_ready") {
      return {
        ok: true,
        intakeStatus: intakeNow,
        runId: null,
        brandName: brand.name ?? null,
        pillars,
      };
    }

    // Final draft CAS — close the TOCTOU window before any write so we never
    // demote an `approved` row back to `pending_approval`.
    const { data: draftNow, error: draftNowErr } = await admin
      .from("brand_intake_drafts")
      .select("id, status, user_id, draft_profile")
      .eq("brand_id", trustedBrandId)
      .maybeSingle();
    if (draftNowErr) {
      console.error("[ensureOnboardingIntakeDraft] draft CAS lookup", draftNowErr);
      return { ok: false, error: SAFE_LOAD_ERROR };
    }
    if (draftNow?.user_id && draftNow.user_id !== user.id) {
      return { ok: false, error: "Forbidden" };
    }
    if (draftNow?.status === "approved") {
      return {
        ok: true,
        intakeStatus: intakeNow,
        runId: runIdFromDraftProfile(draftNow.draft_profile),
        brandName: brand.name ?? null,
        pillars,
      };
    }
    const casRunId =
      draftNow?.status === "pending_approval"
        ? runIdFromDraftProfile(draftNow.draft_profile)
        : null;
    if (casRunId && draftNow?.user_id === user.id) {
      return {
        ok: true,
        intakeStatus: intakeNow,
        runId: casRunId,
        brandName: brand.name ?? null,
        pillars,
      };
    }

    const runId = casRunId ?? existingRunId ?? randomUUID();
    const draftScores = Array.isArray(draftRaw._draft_scores) ? draftRaw._draft_scores : [];
    const cleanDraftProfile = Object.fromEntries(
      Object.entries(draftRaw).filter(([key]) => key !== "_draft_scores"),
    );
    const writeRow = {
      brand_id: trustedBrandId,
      user_id: user.id,
      source_url: brand.brand_url ?? "",
      status: "pending_approval" as const,
      approved_at: null,
      rejected_at: null,
      expires_at: null,
      draft_profile: {
        ...cleanDraftProfile,
        _workflow_run_id: runId,
      },
      draft_scores: draftScores,
      updated_at: new Date().toISOString(),
    };

    if (draftNow?.id) {
      // CAS update — skip rows that flipped to approved between reads.
      const { data: updated, error: updateErr } = await admin
        .from("brand_intake_drafts")
        .update(writeRow)
        .eq("id", draftNow.id)
        .neq("status", "approved")
        .select("id")
        .maybeSingle();
      if (updateErr) {
        console.error("[ensureOnboardingIntakeDraft] CAS update", updateErr);
        return { ok: false, error: SAFE_LOAD_ERROR };
      }
      if (!updated) {
        const { data: afterRace } = await admin
          .from("brand_intake_drafts")
          .select("status, draft_profile, user_id")
          .eq("brand_id", trustedBrandId)
          .maybeSingle();
        if (afterRace?.status === "approved") {
          return {
            ok: true,
            intakeStatus: intakeNow,
            runId: runIdFromDraftProfile(afterRace.draft_profile),
            brandName: brand.name ?? null,
            pillars,
          };
        }
        return { ok: false, error: SAFE_LOAD_ERROR };
      }
    } else {
      const { error: insertErr } = await admin.from("brand_intake_drafts").insert(writeRow);
      if (insertErr) {
        // Unique race: another tab inserted (and may have approved). Never upsert-overwrite.
        console.error("[ensureOnboardingIntakeDraft] insert", insertErr);
        const { data: afterInsert, error: afterErr } = await admin
          .from("brand_intake_drafts")
          .select("status, draft_profile, user_id")
          .eq("brand_id", trustedBrandId)
          .maybeSingle();
        if (afterErr) {
          return { ok: false, error: SAFE_LOAD_ERROR };
        }
        if (afterInsert?.user_id && afterInsert.user_id !== user.id) {
          return { ok: false, error: "Forbidden" };
        }
        if (afterInsert?.status === "approved") {
          return {
            ok: true,
            intakeStatus: intakeNow,
            runId: runIdFromDraftProfile(afterInsert.draft_profile),
            brandName: brand.name ?? null,
            pillars,
          };
        }
        const pendingRun =
          afterInsert?.status === "pending_approval"
            ? runIdFromDraftProfile(afterInsert.draft_profile)
            : null;
        if (pendingRun) {
          return {
            ok: true,
            intakeStatus: intakeNow,
            runId: pendingRun,
            brandName: brand.name ?? null,
            pillars,
          };
        }
        return { ok: false, error: SAFE_LOAD_ERROR };
      }
    }

    return {
      ok: true,
      intakeStatus: intakeNow,
      runId,
      brandName: brand.name ?? null,
      pillars,
    };
  } catch (err) {
    console.error("[ensureOnboardingIntakeDraft]", err);
    return { ok: false, error: SAFE_LOAD_ERROR };
  }
}
