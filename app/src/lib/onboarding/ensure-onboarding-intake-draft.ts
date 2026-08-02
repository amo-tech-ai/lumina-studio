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
      .select("id, name, brand_url, intake_status, ai_profile, ai_profile_draft")
      .eq("id", brandId)
      .maybeSingle();
    if (brandErr) {
      console.error("[ensureOnboardingIntakeDraft] brand lookup", brandErr);
      return { ok: false, error: SAFE_LOAD_ERROR };
    }
    if (!brand) return { ok: false, error: "Brand not found" };

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
    const { data: existing } = await admin
      .from("brand_intake_drafts")
      .select("id, status, user_id, draft_profile")
      .eq("brand_id", brandId)
      .maybeSingle();

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

    const runId = existingRunId ?? randomUUID();
    const draftScores = Array.isArray(draftRaw._draft_scores) ? draftRaw._draft_scores : [];
    const cleanDraftProfile = Object.fromEntries(
      Object.entries(draftRaw).filter(([key]) => key !== "_draft_scores"),
    );

    const { error: upsertErr } = await admin.from("brand_intake_drafts").upsert(
      {
        brand_id: brandId,
        user_id: user.id,
        source_url: brand.brand_url ?? "",
        status: "pending_approval",
        approved_at: null,
        rejected_at: null,
        expires_at: null,
        draft_profile: {
          ...cleanDraftProfile,
          _workflow_run_id: runId,
        },
        draft_scores: draftScores,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "brand_id" },
    );

    if (upsertErr) {
      console.error("[ensureOnboardingIntakeDraft] upsert", upsertErr);
      return { ok: false, error: SAFE_LOAD_ERROR };
    }

    return {
      ok: true,
      intakeStatus,
      runId,
      brandName: brand.name ?? null,
      pillars,
    };
  } catch (err) {
    console.error("[ensureOnboardingIntakeDraft]", err);
    return { ok: false, error: SAFE_LOAD_ERROR };
  }
}
