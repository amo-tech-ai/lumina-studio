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
  answersToOnboardingForm,
  parseDraftAnswers,
  serializeDraftAnswers,
} from "./session-draft";
import {
  FIRST_SCREEN,
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
};

const SAVE_DEBOUNCE_MS = 400;

type Deps = {
  createClient?: () => SupabaseClient;
  getIdempotencyKey?: () => string;
};

/**
 * IPI-835 · B1 — load/create draft session, autosave answers + screen, materialize on commit.
 */
export function useOnboardingSession(deps: Deps = {}): OnboardingSessionState {
  // Mount-only deps — inline `() => client` from tests must not re-run the effect.
  const depsRef = useRef(deps);
  depsRef.current = deps;

  const [bootstrap, setBootstrap] = useState<SessionBootstrap>({ status: "loading" });
  const sessionRef = useRef<OnboardingSession | null>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const supabaseRef = useRef<SupabaseClient | null>(null);

  useEffect(() => {
    let cancelled = false;
    const createClient =
      depsRef.current.createClient ?? createSupabaseBrowserClient;
    const getIdempotencyKey =
      depsRef.current.getIdempotencyKey ?? getOrCreateOnboardingIdempotencyKey;
    const supabase = createClient();
    supabaseRef.current = supabase;

    (async () => {
      try {
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
        setBootstrap({
          status: "ready",
          sessionId: session.id,
          brandId: session.brand_id,
          currentScreen: clampScreen(session.current_screen || FIRST_SCREEN),
          answers: parseDraftAnswers(session.draft_answers),
        });
      } catch (err) {
        if (cancelled) return;
        setBootstrap({
          status: "error",
          message: err instanceof Error ? err.message : "Failed to load onboarding session",
        });
      }
    })();

    return () => {
      cancelled = true;
      if (saveTimerRef.current != null) clearTimeout(saveTimerRef.current);
    };
  }, []);

  const saveDraft = useCallback((screen: number, answers: OnboardingAnswers) => {
    const session = sessionRef.current;
    const supabase = supabaseRef.current;
    if (!session || !supabase) return;
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

    if (saveTimerRef.current != null) {
      clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }
    await updateOnboardingSessionDraft(supabase, session.id, {
      current_screen: 12,
      draft_answers: serializeDraftAnswers(answers),
    });

    const result = await createOrgAndBrand(
      supabase,
      user.id,
      answersToOnboardingForm(answers),
      { idempotencyKey: session.idempotency_key },
    );
    sessionRef.current = {
      ...session,
      status: "materialized",
      brand_id: result.brandId,
      organization_id: result.orgId,
      current_screen: 12,
    };
    setBootstrap((prev) =>
      prev.status === "ready" ? { ...prev, brandId: result.brandId } : prev,
    );
    return result;
  }, []);

  return { ...bootstrap, saveDraft, materialize };
}
