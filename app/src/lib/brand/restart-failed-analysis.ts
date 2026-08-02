import type { SupabaseClient } from "@supabase/supabase-js";

import {
  releaseAnalysisLockIfOwned,
  restoreAnalysisStatusIfOwned,
  tryAcquireAnalysisLock,
} from "@/lib/brand/analysis-lock";
import {
  buildRestartAttemptKey,
  detectRestartStage,
  normalizeAnalysisUrl,
  pickLatestCrawlForUrl,
  urlFingerprint,
} from "@/lib/brand/restart-stage";
import { invokeBrandIntelligence, invokeStartBrandCrawl } from "@/lib/onboarding";

/**
 * IPI-905 · ONB2-INT-001d — protected server recovery for failed Brand Analysis.
 * Stage-aware: reuse active crawl, restart failed crawl, or BI-only after complete crawl.
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

async function recordAttempt(
  supabase: SupabaseClient,
  input: {
    actorId: string;
    brandId: string;
    stage: string;
    attemptKey: string;
    urlFingerprint: string;
    websiteUrl: string;
  },
): Promise<string | null> {
  const { data, error } = await supabase
    .from("ai_agent_logs")
    .insert({
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
    })
    .select("id")
    .maybeSingle();

  if (error) {
    console.error("[restart-failed-analysis] attempt log insert failed", {
      brandId: input.brandId,
      code: error.code,
    });
    return null;
  }
  return data?.id ?? null;
}

async function finalizeAttempt(
  supabase: SupabaseClient,
  logId: string | null,
  output: Record<string, unknown>,
): Promise<void> {
  if (!logId) return;
  try {
    await supabase
      .from("ai_agent_logs")
      .update({ output: { phase: "finished", ...output } })
      .eq("id", logId);
  } catch (err) {
    console.error("[restart-failed-analysis] attempt log finalize failed", {
      logId,
      error: err instanceof Error ? err.message : String(err),
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
      console.error("[restart-failed-analysis] role check failed", roleErr);
      // Role *check* failure ≠ role *denial* (mirror BI start route).
      return fail("provider_unavailable");
    }
    if (!canRestart) return fail("unauthorized");
    return null;
  }
  if (brand.user_id !== actorId) return fail("unauthorized");
  return null;
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
  const normalizedUrl = normalizeAnalysisUrl(rawUrl);
  if (!normalizedUrl) return fail("invalid_url");

  const attemptKey = buildRestartAttemptKey(brandId, normalizedUrl);
  const fp = urlFingerprint(normalizedUrl);

  // Newest-first; pickLatestCrawlForUrl keeps the first URL match.
  const { data: crawlRows, error: crawlErr } = await supabase
    .from("brand_crawls")
    .select("id, job_status, source_url")
    .eq("brand_id", brandId)
    .order("created_at", { ascending: false })
    .limit(20);

  if (crawlErr) {
    console.error("[restart-failed-analysis] crawl lookup failed", {
      brandId,
      code: crawlErr.code,
    });
    return fail("provider_unavailable");
  }

  const latestCrawl = pickLatestCrawlForUrl(crawlRows ?? [], normalizedUrl);
  const decision = detectRestartStage({
    intakeStatus: brand.intake_status,
    latestCrawl,
  });

  if (decision.mode === "already_running") return fail("already_running");
  if (decision.mode === "invalid_state") return fail("invalid_state");

  // --- crawl_reused: no new Firecrawl job; resume Realtime on existing crawl ---
  if (decision.mode === "crawl_reused") {
    const logId = await recordAttempt(supabase, {
      actorId,
      brandId,
      stage: decision.mode,
      attemptKey,
      urlFingerprint: fp,
      websiteUrl: normalizedUrl,
    });

    const { data: resumed, error: resumeErr } = await supabase
      .from("brands")
      .update({ intake_status: "crawl_running" })
      .eq("id", brandId)
      .eq("intake_status", "failed")
      .select("intake_status")
      .maybeSingle();

    if (resumeErr) {
      console.error("[restart-failed-analysis] crawl_reused resume failed", {
        brandId,
        code: resumeErr.code,
      });
      await finalizeAttempt(supabase, logId, { ok: false, code: "provider_unavailable" });
      return fail("provider_unavailable");
    }
    if (!resumed) {
      await finalizeAttempt(supabase, logId, { ok: false, code: "already_running" });
      return fail("already_running");
    }

    await finalizeAttempt(supabase, logId, {
      ok: true,
      mode: "crawl_reused",
      crawlId: decision.crawlId,
    });
    return {
      ok: true,
      mode: "crawl_reused",
      intakeStatus: "crawl_running",
      crawlId: decision.crawlId,
    };
  }

  const acquired = await tryAcquireAnalysisLock(supabase, brandId);
  if (!acquired.ok) {
    return fail("already_running");
  }
  const { runToken, priorStatus } = acquired;

  const logId = await recordAttempt(supabase, {
    actorId,
    brandId,
    stage: decision.mode,
    attemptKey,
    urlFingerprint: fp,
    websiteUrl: normalizedUrl,
  });

  try {
    if (decision.mode === "crawl_restarted") {
      const crawl = await invokeStartBrandCrawl(supabase, brandId, normalizedUrl, {
        idempotencyKey: attemptKey,
      });
      await releaseAnalysisLockIfOwned(supabase, brandId, runToken);
      await finalizeAttempt(supabase, logId, {
        ok: true,
        mode: crawl.reused ? "crawl_reused" : "crawl_restarted",
        crawlId: crawl.crawlId,
      });
      // Edge may have set crawl_running; report the mode we intended unless reused.
      const mode = crawl.reused ? ("crawl_reused" as const) : ("crawl_restarted" as const);
      return {
        ok: true,
        mode,
        intakeStatus: "crawl_running",
        crawlId: crawl.crawlId,
      };
    }

    // bi_restarted — complete crawl exists; do not start another crawl.
    await invokeBrandIntelligence(
      supabase,
      brandId,
      {
        brandName: brand.name ?? "",
        websiteUrl: normalizedUrl,
        instagramHandle: "",
        industry: "",
        goal: "",
      },
      { draftMode: true, crawlResultId: decision.crawlId },
    );

    await releaseAnalysisLockIfOwned(supabase, brandId, runToken);

    const { data: after } = await supabase
      .from("brands")
      .select("intake_status")
      .eq("id", brandId)
      .maybeSingle();

    const intakeStatus =
      typeof after?.intake_status === "string" ? after.intake_status : "analysis_running";

    await finalizeAttempt(supabase, logId, {
      ok: true,
      mode: "bi_restarted",
      crawlId: decision.crawlId,
      intakeStatus,
    });

    return {
      ok: true,
      mode: "bi_restarted",
      intakeStatus,
      crawlId: decision.crawlId,
    };
  } catch (err) {
    console.error("[restart-failed-analysis] provider failed", {
      brandId,
      mode: decision.mode,
      error: err instanceof Error ? err.message : String(err),
    });
    await restoreAnalysisStatusIfOwned(supabase, brandId, priorStatus, runToken);
    await finalizeAttempt(supabase, logId, { ok: false, code: "provider_unavailable" });
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
