"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import {
  createOrgAndBrand,
  getOrCreateOnboardingSession,
  updateOnboardingSessionDraft,
  type OnboardingSession,
} from "@/lib/onboarding";
import { getOrCreateOnboardingIdempotencyKey } from "./idempotency-key";
import {
  ONBOARDING_BRAND_NAME_REQUIRED,
  toUserFacingOnboardingError,
} from "./onboarding-errors";
import {
  answersToOnboardingForm,
  parseDraftAnswers,
  serializeDraftAnswers,
} from "./session-draft";
import { isAnalysisReviewable } from "./kickoff-onboarding-analysis";
import {
  ANALYSIS_SCREEN,
  FIRST_SCREEN,
  LAST_SCREEN,
  clampScreen,
  type OnboardingAnswers,
} from "./navigation";

type SessionBootstrap =
  | { status: "loading" }
  | { status: "error"; message: string }
  | {
      status: "ready";
      sessionId: string;
      brandId: string | null;
      currentScreen: number;
      answers: OnboardingAnswers;
    };

export type OnboardingSessionState = SessionBootstrap & {
  saveDraft: (screen: number, answers: OnboardingAnswers) => void;
  materialize: (answers: OnboardingAnswers) => Promise<{ orgId: string; brandId: string }>;
  /** Re-run bootstrap after a load error. */
  retry: () => void;
};

const SAVE_DEBOUNCE_MS = 400;

type Deps = {
  createClient?: () => SupabaseClient;
  getIdempotencyKey?: () => string;
};

/**
 * IPI-835 · B1 / IPI-903 — load/create draft session, autosave, materialize on commit.
 */
export function useOnboardingSession(deps: Deps = {}): OnboardingSessionState {
  // Mount-only deps — inline `() => client` from tests must not re-run the effect.
  const depsRef = useRef(deps);
  depsRef.current = deps;

  const [bootstrap, setBootstrap] = useState<SessionBootstrap>({ status: "loading" });
  const [retryTick, setRetryTick] = useState(0);
  const sessionRef = useRef<OnboardingSession | null>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const supabaseRef = useRef<SupabaseClient | null>(null);

  useEffect(() => {
    let cancelled = false;
    const getIdempotencyKey =
      depsRef.current.getIdempotencyKey ?? getOrCreateOnboardingIdempotencyKey;
    setBootstrap({ status: "loading" });
    sessionRef.current = null;

    (async () => {
      try {
        // Reuse one browser client across retries — createBrowserClient is not a singleton,
        // and a second GoTrueClient per retry races auth storage. Create inside try so a
        // missing-env throw becomes the same retryable error state as auth/RPC failures.
        if (!supabaseRef.current) {
          const createClient =
            depsRef.current.createClient ?? createSupabaseBrowserClient;
          supabaseRef.current = createClient();
        }
        const supabase = supabaseRef.current;
        const {
          data: { user },
          error: authErr,
        } = await supabase.auth.getUser();
        if (authErr || !user) {
          throw new Error(authErr?.message ?? "Not authenticated");
        }
        const key = getIdempotencyKey();
        const session = await getOrCreateOnboardingSession(supabase, user.id, key);
        if (cancelled) return;
        sessionRef.current = session;

        // Materialized sessions cannot autosave current_screen (RLS). Derive
        // resume screen from brand intake so refresh on DNA review lands on 13.
        let currentScreen = clampScreen(session.current_screen || FIRST_SCREEN);
        if (session.brand_id && session.status === "materialized") {
          const { data: brand, error: brandErr } = await supabase
            .from("brands")
            .select("intake_status")
            .eq("id", session.brand_id)
            .maybeSingle();
          if (cancelled) return;
          if (brandErr) {
            console.error("[useOnboardingSession] brand intake_status", brandErr);
            throw brandErr;
          }
          const intake =
            typeof brand?.intake_status === "string" ? brand.intake_status : null;
          if (isAnalysisReviewable(intake)) {
            currentScreen = LAST_SCREEN;
          } else if (
            intake === "brand_created" ||
            intake === "crawl_running" ||
            intake === "crawl_complete" ||
            intake === "analysis_running" ||
            intake === "failed"
          ) {
            currentScreen = ANALYSIS_SCREEN;
          }
        }

        if (cancelled) return;
        setBootstrap({
          status: "ready",
          sessionId: session.id,
          brandId: session.brand_id,
          currentScreen,
          answers: parseDraftAnswers(session.draft_answers),
        });
      } catch (err) {
        if (cancelled) return;
        setBootstrap({
          status: "error",
          message: toUserFacingOnboardingError(err, "session"),
        });
      }
    })();

    return () => {
      cancelled = true;
      if (saveTimerRef.current != null) clearTimeout(saveTimerRef.current);
    };
  }, [retryTick]);

  const retry = useCallback(() => {
    setRetryTick((n) => n + 1);
  }, []);

  const saveDraft = useCallback((screen: number, answers: OnboardingAnswers) => {
    const session = sessionRef.current;
    const supabase = supabaseRef.current;
    if (!session || !supabase) return;
    // Materialized sessions cannot be updated via draft RLS — skip.
    if (session.status === "materialized") return;
    if (saveTimerRef.current != null) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      void updateOnboardingSessionDraft(supabase, session.id, {
        current_screen: clampScreen(screen),
        draft_answers: serializeDraftAnswers(answers),
      }).catch(() => {
        // Autosave is best-effort — materialize still has brand fields from local state.
      });
    }, SAVE_DEBOUNCE_MS);
  }, []);

  const materialize = useCallback(async (answers: OnboardingAnswers) => {
    const session = sessionRef.current;
    const supabase = supabaseRef.current;
    if (!session || !supabase) throw new Error("Onboarding session not loaded");
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    if (!answers.brandName.trim()) {
      throw new Error(ONBOARDING_BRAND_NAME_REQUIRED);
    }

    if (saveTimerRef.current != null) {
      clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }

    // Flush answers only — do not advance stored screen until materialize succeeds.
    // Writing ANALYSIS_SCREEN here would strand resume on 12 if the RPC fails.
    if (session.status === "draft") {
      await updateOnboardingSessionDraft(supabase, session.id, {
        draft_answers: serializeDraftAnswers(answers),
      });
    }

    const result = await createOrgAndBrand(
      supabase,
      user.id,
      answersToOnboardingForm(answers),
      { idempotencyKey: session.idempotency_key },
    );

    // RPC persists current_screen = ANALYSIS_SCREEN atomically (IPI-903 migration).
    // Screen 13 (payoff) remains local-only until a later authorized write path.
    sessionRef.current = {
      ...session,
      status: "materialized",
      brand_id: result.brandId,
      organization_id: result.orgId,
      current_screen: ANALYSIS_SCREEN,
    };
    setBootstrap((prev) =>
      prev.status === "ready"
        ? { ...prev, brandId: result.brandId, currentScreen: ANALYSIS_SCREEN }
        : prev,
    );
    return result;
  }, []);

  return { ...bootstrap, saveDraft, materialize, retry };
}
