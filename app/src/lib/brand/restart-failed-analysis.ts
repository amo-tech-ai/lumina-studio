import type { SupabaseClient } from "@supabase/supabase-js";

import { createSupabaseAdminClient } from "@/app/api/_lib/supabase-admin";
import {
  releaseAnalysisLockIfOwned,
  restoreAnalysisStatusIfOwned,
  tryAcquireAnalysisLock,
} from "@/lib/brand/analysis-lock";
import {
  buildRestartAttemptKey,
  detectRestartStage,
  normalizeAnalysisUrl,
  pickBestCrawlForUrl,
  urlFingerprint,
} from "@/lib/brand/restart-stage";
import {
  invokeBrandIntelligence,
  invokeStartBrandCrawl,
  waitForCrawlCompletion,
} from "@/lib/onboarding";

/**
 * IPI-905 · ONB2-INT-001d — protected server recovery for failed Brand Analysis.
 * Stage-aware: reuse active crawl, restart failed crawl, or BI-only after complete crawl.
 * Crawl paths wait for completion then continue into Brand Intelligence (webhook has no
 * workflow_id on this path, so BI must be started here).
 */

export type RestartErrorCode =
  | "unauthorized"
  | "not_found"
  | "invalid_state"
  | "invalid_url"
  | "already_running"
  | "provider_unavailable";

export type RestartResult =
  | {
      ok: true;
      mode: "crawl_restarted" | "crawl_reused" | "bi_restarted";
      intakeStatus: string;
      crawlId?: string;
    }
  | {
      ok: false;
      code: RestartErrorCode;
      message: string;
    };

const SAFE: Record<RestartErrorCode, string> = {
  unauthorized: "You must be an organization owner or editor to restart this analysis.",
  not_found: "Brand not found.",
  invalid_state: "This brand isn't in a failed state that can be restarted.",
  invalid_url: "Enter a valid URL starting with http:// or https://.",
  already_running: "Analysis is already in progress.",
  provider_unavailable: "We couldn't restart analysis right now. Try again in a minute.",
};

function fail(code: RestartErrorCode): RestartResult {
  return { ok: false, code, message: SAFE[code] };
}

const AGENT_NAME = "restart-failed-analysis";

type AttemptInput = {
  actorId: string;
  brandId: string;
  stage: string;
  attemptKey: string;
  urlFingerprint: string;
  websiteUrl: string;
};

/** Throws on failure so the caller can restore the analysis lock (audit-before-provider). */
async function recordAttempt(
  supabase: SupabaseClient,
  input: AttemptInput,
): Promise<void> {
  const { error } = await supabase.from("ai_agent_logs").insert({
    agent_name: AGENT_NAME,
    user_id: input.actorId,
    brand_id: input.brandId,
    input: {
      brandId: input.brandId,
      stage: input.stage,
      attemptKey: input.attemptKey,
      urlFingerprint: input.urlFingerprint,
      websiteUrl: input.websiteUrl,
    },
    output: { phase: "started" },
  });
  if (error) {
    console.error("[restart-failed-analysis] attempt log insert failed", {
      brandId: input.brandId,
      code: error.code,
    });
    throw new Error("attempt_log_failed");
  }
}

/** INSERT-only finalize — ai_agent_logs has no UPDATE RLS policy for JWT clients. */
async function recordAttemptResult(
  supabase: SupabaseClient,
  input: AttemptInput,
  output: Record<string, unknown>,
): Promise<void> {
  try {
    const { error } = await supabase.from("ai_agent_logs").insert({
      agent_name: AGENT_NAME,
      user_id: input.actorId,
      brand_id: input.brandId,
      input: {
        brandId: input.brandId,
        stage: input.stage,
        attemptKey: input.attemptKey,
        urlFingerprint: input.urlFingerprint,
        websiteUrl: input.websiteUrl,
      },
      output: { phase: "finished", ...output },
    });
    if (error) {
      console.error("[restart-failed-analysis] attempt result insert failed", {
        brandId: input.brandId,
        code: error.code,
      });
    }
  } catch {
    console.error("[restart-failed-analysis] attempt result insert threw", {
      brandId: input.brandId,
    });
  }
}

async function assertCanRestart(
  supabase: SupabaseClient,
  actorId: string,
  brand: { org_id: string | null; user_id: string | null },
): Promise<RestartResult | null> {
  if (brand.org_id) {
    const { data: canRestart, error: roleErr } = await supabase.rpc("is_org_editor_or_above", {
      p_org_id: brand.org_id,
    });
    if (roleErr) {
      console.error("[restart-failed-analysis] role check failed", {
        code: roleErr.code,
      });
      return fail("provider_unavailable");
    }
    if (!canRestart) return fail("unauthorized");
    return null;
  }
  if (brand.user_id !== actorId) return fail("unauthorized");
  return null;
}

async function loadCrawlEvidence(
  admin: SupabaseClient,
  brandId: string,
  normalizedUrl: string,
): Promise<{ ok: true; crawl: ReturnType<typeof pickBestCrawlForUrl> } | { ok: false }> {
  // brand_crawls SELECT RLS is org-member-only (no personal-owner branch).
  // Authz already passed on the user client; use service role for discovery + wait.
  const { data: crawlRows, error: crawlErr } = await admin
    .from("brand_crawls")
    .select("id, job_status, source_url")
    .eq("brand_id", brandId)
    .order("created_at", { ascending: false });

  if (crawlErr) {
    console.error("[restart-failed-analysis] crawl lookup failed", {
      brandId,
      code: crawlErr.code,
    });
    return { ok: false };
  }

  return { ok: true, crawl: pickBestCrawlForUrl(crawlRows ?? [], normalizedUrl) };
}

async function persistBrandUrlIfChanged(
  supabase: SupabaseClient,
  brandId: string,
  currentUrl: string | null,
  normalizedUrl: string,
): Promise<void> {
  const currentNorm = currentUrl ? normalizeAnalysisUrl(currentUrl) : null;
  if (currentNorm === normalizedUrl) return;
  const { error } = await supabase
    .from("brands")
    .update({ brand_url: normalizedUrl })
    .eq("id", brandId);
  if (error) {
    console.error("[restart-failed-analysis] brand_url persist failed", {
      brandId,
      code: error.code,
    });
  }
}

async function runBrandIntelligence(
  supabase: SupabaseClient,
  brandId: string,
  brandName: string,
  normalizedUrl: string,
  crawlId: string,
): Promise<string> {
  await invokeBrandIntelligence(
    supabase,
    brandId,
    {
      brandName,
      websiteUrl: normalizedUrl,
      instagramHandle: "",
      industry: "",
      goal: "",
    },
    { draftMode: true, crawlResultId: crawlId },
  );

  const { data: after } = await supabase
    .from("brands")
    .select("intake_status")
    .eq("id", brandId)
    .maybeSingle();

  return typeof after?.intake_status === "string" ? after.intake_status : "analysis_running";
}

export async function restartFailedBrandAnalysis(params: {
  supabase: SupabaseClient;
  actorId: string;
  brandId: string;
  websiteUrl?: string;
}): Promise<RestartResult> {
  const { supabase, actorId, brandId } = params;

  const { data: brand, error: brandErr } = await supabase
    .from("brands")
    .select("id, name, brand_url, org_id, user_id, intake_status")
    .eq("id", brandId)
    .maybeSingle();

  if (brandErr) {
    console.error("[restart-failed-analysis] brand lookup failed", {
      brandId,
      code: brandErr.code,
    });
    return fail("provider_unavailable");
  }
  if (!brand) return fail("not_found");

  const denied = await assertCanRestart(supabase, actorId, brand);
  if (denied) return denied;

  const rawUrl = (params.websiteUrl?.trim() || brand.brand_url || "").trim();
  if (!rawUrl) return fail("invalid_url");

  const normalizedUrl = normalizeAnalysisUrl(rawUrl);
  if (!normalizedUrl) return fail("invalid_url");

  const attemptKey = buildRestartAttemptKey(brandId, normalizedUrl);
  const fp = urlFingerprint(normalizedUrl);
  const attemptBase: AttemptInput = {
    actorId,
    brandId,
    stage: "pending",
    attemptKey,
    urlFingerprint: fp,
    websiteUrl: normalizedUrl,
  };

  let admin: SupabaseClient;
  try {
    admin = createSupabaseAdminClient();
  } catch {
    console.error("[restart-failed-analysis] admin client unavailable");
    return fail("provider_unavailable");
  }

  const evidence = await loadCrawlEvidence(admin, brandId, normalizedUrl);
  if (!evidence.ok) return fail("provider_unavailable");

  const decision = detectRestartStage({
    intakeStatus: brand.intake_status,
    latestCrawl: evidence.crawl,
  });

  if (decision.mode === "already_running") return fail("already_running");
  if (decision.mode === "invalid_state") return fail("invalid_state");

  attemptBase.stage = decision.mode;

  const acquired = await tryAcquireAnalysisLock(supabase, brandId);
  if (!acquired.ok) {
    if (acquired.error === "Analysis already in progress") {
      return fail("already_running");
    }
    return fail("provider_unavailable");
  }
  const { runToken, priorStatus } = acquired;

  try {
    await recordAttempt(supabase, attemptBase);
  } catch {
    await restoreAnalysisStatusIfOwned(supabase, brandId, priorStatus, runToken);
    return fail("provider_unavailable");
  }

  try {
    let crawlId: string;
    let mode: "crawl_restarted" | "crawl_reused" | "bi_restarted" = decision.mode;

    if (decision.mode === "bi_restarted") {
      crawlId = decision.crawlId;
    } else if (decision.mode === "crawl_reused") {
      crawlId = decision.crawlId;
    } else {
      const crawl = await invokeStartBrandCrawl(supabase, brandId, normalizedUrl, {
        idempotencyKey: attemptKey,
      });
      crawlId = crawl.crawlId;
      if (crawl.reused) mode = "crawl_reused";
    }

    if (decision.mode !== "bi_restarted") {
      // Admin client: personal brands cannot SELECT brand_crawls under RLS.
      const crawlOutcome = await waitForCrawlCompletion(admin, crawlId);
      if (crawlOutcome === "failed" || crawlOutcome === "timeout") {
        await restoreAnalysisStatusIfOwned(supabase, brandId, priorStatus, runToken);
        await recordAttemptResult(supabase, attemptBase, {
          ok: false,
          code: "provider_unavailable",
          crawlOutcome,
        });
        return fail("provider_unavailable");
      }
    }

    const intakeStatus = await runBrandIntelligence(
      supabase,
      brandId,
      brand.name ?? "",
      normalizedUrl,
      crawlId,
    );

    await releaseAnalysisLockIfOwned(supabase, brandId, runToken);
    await persistBrandUrlIfChanged(supabase, brandId, brand.brand_url, normalizedUrl);
    await recordAttemptResult(supabase, attemptBase, {
      ok: true,
      mode,
      crawlId,
      intakeStatus,
    });

    return { ok: true, mode, intakeStatus, crawlId };
  } catch (err) {
    console.error("[restart-failed-analysis] provider failed", {
      brandId,
      mode: decision.mode,
      name: err instanceof Error ? err.name : "Error",
    });
    await restoreAnalysisStatusIfOwned(supabase, brandId, priorStatus, runToken);
    await recordAttemptResult(supabase, attemptBase, {
      ok: false,
      code: "provider_unavailable",
    });
    return fail("provider_unavailable");
  }
}

/** Map RestartResult to HTTP status for the Route Handler. */
export function restartHttpStatus(result: RestartResult): number {
  if (result.ok) return 200;
  switch (result.code) {
    case "unauthorized":
      return 403;
    case "not_found":
      return 404;
    case "invalid_url":
    case "invalid_state":
      return 400;
    case "already_running":
      return 409;
    case "provider_unavailable":
      return 503;
    default:
      return 500;
  }
}
