import { createHash } from "node:crypto";

import { normalizeBrandUrl } from "./brand-url.ssot";

/**
 * IPI-905 · ONB2-INT-001d — pure stage detection + URL identity for failed
 * brand analysis restart. No I/O — table-tested in restart-stage.test.ts.
 *
 * IPI-920 · ONB2-INT-001g — URL identity now comes from the shared SSOT
 * (`supabase/functions/_shared/brand-url.ts`) that brand-intelligence uses too,
 * so both runtimes recognise the same website.
 */

export type CrawlEvidence = {
  id: string;
  job_status: string;
};

export type RestartStageDecision =
  | { mode: "crawl_reused"; crawlId: string }
  | { mode: "crawl_restarted" }
  | { mode: "bi_restarted"; crawlId: string }
  | { mode: "invalid_state" }
  | { mode: "already_running" };

const LOCKED_INTAKE = new Set(["crawl_running", "analysis_running", "draft_ready"]);
const ACTIVE_CRAWL = new Set(["queued", "running"]);

/**
 * Normalize a website URL for restart identity — the shared brand-URL rule.
 * Origin-only, so path/query variants reuse the same crawl and never leak
 * tokens or credentials into attempt keys / `ai_agent_logs`.
 */
export const normalizeAnalysisUrl = normalizeBrandUrl;

/** Short stable fingerprint for attempt / idempotency keys. */
export function urlFingerprint(normalizedUrl: string): string {
  return createHash("sha256").update(normalizedUrl).digest("hex").slice(0, 16);
}

/** URL-aware attempt key — never brandId alone (IPI-905 hard req #6). */
export function buildRestartAttemptKey(brandId: string, normalizedUrl: string): string {
  return `restart-${brandId}-${urlFingerprint(normalizedUrl)}`;
}

/**
 * Deterministic stage table from discovery:
 * | Active crawl (queued/running)     | crawl_reused     |
 * | No crawl / failed / cancelled     | crawl_restarted  |
 * | Complete crawl + intake failed    | bi_restarted     |
 * | intake locked mid-flight          | already_running  |
 * | intake not failed                 | invalid_state    |
 */
export function detectRestartStage(input: {
  intakeStatus: string | null | undefined;
  latestCrawl: CrawlEvidence | null;
}): RestartStageDecision {
  const intake = typeof input.intakeStatus === "string" ? input.intakeStatus : "";

  if (LOCKED_INTAKE.has(intake)) {
    return { mode: "already_running" };
  }
  if (intake !== "failed") {
    return { mode: "invalid_state" };
  }

  const crawl = input.latestCrawl;
  if (crawl && ACTIVE_CRAWL.has(crawl.job_status)) {
    return { mode: "crawl_reused", crawlId: crawl.id };
  }
  if (crawl && crawl.job_status === "complete") {
    return { mode: "bi_restarted", crawlId: crawl.id };
  }
  return { mode: "crawl_restarted" };
}

/**
 * Prefer an in-flight crawl for the URL, then a complete one, then newest match.
 * Callers pass rows newest-first.
 */
export function pickBestCrawlForUrl(
  crawls: Array<{ id: string; job_status: string; source_url: string }>,
  normalizedUrl: string,
): CrawlEvidence | null {
  const matches: CrawlEvidence[] = [];
  for (const row of crawls) {
    const rowUrl = normalizeAnalysisUrl(row.source_url);
    if (rowUrl === normalizedUrl) {
      matches.push({ id: row.id, job_status: row.job_status });
    }
  }
  if (matches.length === 0) return null;

  const active = matches.find((m) => ACTIVE_CRAWL.has(m.job_status));
  if (active) return active;

  const complete = matches.find((m) => m.job_status === "complete");
  if (complete) return complete;

  return matches[0] ?? null;
}
