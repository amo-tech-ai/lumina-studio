// IPI-46 / IPI-832 — onboarding shell + orchestration helpers (pure functions, testable in node)
import type { SupabaseClient } from "@supabase/supabase-js";

import {
  materializeResultSchema,
  type OnboardingForm,
  type OnboardingSession,
} from "./schema";

export { validateUrl } from "./validate-url";
export {
  onboardingFormSchema,
  onboardingSessionSchema,
  onboardingSessionStatusSchema,
  materializeResultSchema,
  type OnboardingForm,
  type OnboardingSession,
  type OnboardingSessionStatus,
  type MaterializeResult,
} from "./schema";

/**
 * Deterministic slug helper (tests + non-RPC callers).
 * Materialize RPC builds its own slug from the pre-generated org UUID — no Math.random.
 */
export const slugify = (s: string, uniqueSuffix = ""): string => {
  const base = s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 50);
  return uniqueSuffix ? `${base}-${uniqueSuffix}` : base;
};

export type CreateBrandResult = { orgId: string; brandId: string };

/** Form metadata persisted before edge analysis (merged by edge fn on UPDATE). */
export const buildShellAiProfile = (form: OnboardingForm): Record<string, unknown> => ({
  ...(form.instagramHandle.trim()
    ? { instagram_handle: form.instagramHandle.trim().replace(/^@/, "") }
    : {}),
  industry: form.industry,
  goal: form.goal,
  _lifecycle: "brand_created",
});

/**
 * Get-or-create a draft session for a stable browser idempotency_key.
 * Prefer one key per browser (localStorage) so refresh resumes the same draft.
 */
export const getOrCreateOnboardingSession = async (
  supabase: SupabaseClient,
  userId: string,
  idempotencyKey: string,
): Promise<OnboardingSession> => {
  const { data: existing, error: selectErr } = await supabase
    .from("onboarding_sessions")
    .select(
      "id, user_id, idempotency_key, status, current_screen, draft_answers, organization_id, brand_id",
    )
    .eq("user_id", userId)
    .eq("idempotency_key", idempotencyKey)
    .maybeSingle();

  if (selectErr) {
    throw new Error(selectErr.message ?? "Failed to load onboarding session");
  }
  if (existing) {
    return existing as OnboardingSession;
  }

  const { data: created, error: insertErr } = await supabase
    .from("onboarding_sessions")
    .insert({
      user_id: userId,
      idempotency_key: idempotencyKey,
      status: "draft",
      current_screen: 1,
      draft_answers: {},
    })
    .select(
      "id, user_id, idempotency_key, status, current_screen, draft_answers, organization_id, brand_id",
    )
    .single();

  if (insertErr || !created) {
    // Concurrent insert: unique (user_id, idempotency_key) — re-select.
    if (insertErr?.code === "23505") {
      const { data: raced, error: raceErr } = await supabase
        .from("onboarding_sessions")
        .select(
          "id, user_id, idempotency_key, status, current_screen, draft_answers, organization_id, brand_id",
        )
        .eq("user_id", userId)
        .eq("idempotency_key", idempotencyKey)
        .single();
      if (raceErr || !raced) {
        throw new Error(raceErr?.message ?? "Failed to load onboarding session after conflict");
      }
      return raced as OnboardingSession;
    }
    throw new Error(insertErr?.message ?? "Failed to create onboarding session");
  }

  return created as OnboardingSession;
};

/** Thin autosave for draft_answers + current_screen (IPI-835 resume depends on this). */
export const updateOnboardingSessionDraft = async (
  supabase: SupabaseClient,
  sessionId: string,
  patch: { current_screen?: number; draft_answers?: Record<string, unknown> },
): Promise<void> => {
  const { error } = await supabase
    .from("onboarding_sessions")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("id", sessionId);

  if (error) {
    throw new Error(error.message ?? "Failed to update onboarding session");
  }
};

/**
 * Step 1 of onboarding: ensure draft session, then materialize org+brand via one INVOKER RPC.
 * Callers must pass a stable idempotencyKey (browser localStorage / in-memory for the attempt).
 */
export const createOrgAndBrand = async (
  supabase: SupabaseClient,
  userId: string,
  form: OnboardingForm,
  options: { idempotencyKey: string },
): Promise<CreateBrandResult> => {
  await getOrCreateOnboardingSession(supabase, userId, options.idempotencyKey);

  const { data, error } = await supabase.rpc("materialize_onboarding_session", {
    p_idempotency_key: options.idempotencyKey,
    p_brand_name: form.brandName,
    p_brand_url: form.websiteUrl.trim(),
  });

  if (error) {
    throw new Error(error.message ?? "Failed to materialize onboarding session");
  }

  const parsed = materializeResultSchema.safeParse(data);
  if (!parsed.success) {
    throw new Error("materialize_onboarding_session returned an unexpected payload");
  }

  return { orgId: parsed.data.organization_id, brandId: parsed.data.brand_id };
};

export type BrandIntelligenceResponse = {
  brandId?: string;
  profile?: Record<string, unknown>;
  scores?: { score_type: string; score: number }[];
};

export type StartBrandCrawlResponse = {
  crawlId: string;
  firecrawlJobId?: string | null;
  requestId?: string;
  reused?: boolean;
};

/** Step 2a (IPI-24): start async Firecrawl crawl on existing brand shell. */
export const invokeStartBrandCrawl = async (
  supabase: SupabaseClient,
  brandId: string,
  websiteUrl: string,
  options?: { idempotencyKey?: string; workflowId?: string; requestId?: string },
): Promise<StartBrandCrawlResponse> => {
  const { data, error } = await supabase.functions.invoke("start-brand-crawl", {
    body: {
      brandId,
      websiteUrl: websiteUrl.trim(),
      idempotencyKey: options?.idempotencyKey,
      workflowId: options?.workflowId,
      requestId: options?.requestId,
    },
  });

  if (error) {
    throw new Error(error.message || "Failed to start brand crawl");
  }

  const payload = data as { ok?: boolean; data?: StartBrandCrawlResponse; error?: { message?: string } } | null;
  if (payload?.ok === false) {
    throw new Error(payload.error?.message ?? "Failed to start brand crawl");
  }

  const inner = payload?.data ?? (data as StartBrandCrawlResponse | null);
  if (!inner?.crawlId) {
    throw new Error("start-brand-crawl returned no crawlId");
  }

  return inner;
};

export type WaitForCrawlResult = "complete" | "failed" | "timeout";

/**
 * Step 2b (IPI-738): poll a brand_crawls row until Firecrawl's webhook marks it
 * complete/failed, or timeoutMs elapses. Groq brand-intelligence hard-requires
 * crawl content (see supabase/functions/_shared/bi-groq-guards.ts); calling it
 * before the crawl lands 422s immediately. Gemini doesn't strictly need this,
 * but crawl content only enriches its prompt — waiting is harmless there too.
 */
export const waitForCrawlCompletion = async (
  supabase: SupabaseClient,
  crawlId: string,
  options?: { pollIntervalMs?: number; timeoutMs?: number },
): Promise<WaitForCrawlResult> => {
  const pollIntervalMs = options?.pollIntervalMs ?? 2500;
  const timeoutMs = options?.timeoutMs ?? 50_000;
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    const { data, error } = await supabase
      .from("brand_crawls")
      .select("job_status")
      .eq("id", crawlId)
      .maybeSingle();

    if (!error && data?.job_status === "complete") return "complete";
    if (!error && data?.job_status === "failed") return "failed";

    await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
  }

  return "timeout";
};

/** Step 2: invoke edge fn with existing brandId (scores + profile persisted server-side). */
export const invokeBrandIntelligence = async (
  supabase: SupabaseClient,
  brandId: string,
  form: OnboardingForm,
  options?: { crawlResultId?: string; draftMode?: boolean },
): Promise<BrandIntelligenceResponse> => {
  const { data, error } = await supabase.functions.invoke("brand-intelligence", {
    body: {
      url: form.websiteUrl.trim(),
      brandId,
      brand_name: form.brandName.trim(),
      ...(options?.crawlResultId ? { crawlResultId: options.crawlResultId } : {}),
      ...(options?.draftMode ? { draft_mode: true } : {}),
    },
  });

  if (error) {
    throw new Error(error.message || "Brand analysis failed");
  }

  const payload = data as
    | { ok?: boolean; data?: BrandIntelligenceResponse; error?: { message?: string } }
    | BrandIntelligenceResponse
    | null;
  if (payload && typeof payload === "object" && "ok" in payload && payload.ok === false) {
    throw new Error(payload.error?.message ?? "Brand analysis failed");
  }

  const inner =
    payload && typeof payload === "object" && "data" in payload && payload.data
      ? payload.data
      : (payload as BrandIntelligenceResponse | null);
  if (!inner?.brandId) {
    throw new Error("Brand analysis returned no brandId");
  }
  if (inner.brandId !== brandId) {
    throw new Error("Brand analysis returned mismatched brandId");
  }

  return inner;
};
