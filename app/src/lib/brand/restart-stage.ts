import { createHash } from "node:crypto";

/**
 * IPI-905 · ONB2-INT-001d — pure stage detection + URL identity for failed
 * brand analysis restart. No I/O — table-tested in restart-stage.test.ts.
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
 * Normalize a website URL for restart identity.
 * Requires http(s), lowercases host, strips hash + trailing slash (except root).
 */
export function normalizeAnalysisUrl(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed || /\s/.test(trimmed)) return null;

  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return null;
    parsed.hash = "";
    parsed.hostname = parsed.hostname.toLowerCase();
    if (parsed.pathname.length > 1 && parsed.pathname.endsWith("/")) {
      parsed.pathname = parsed.pathname.slice(0, -1);
    }
    return parsed.href;
  } catch {
    return null;
  }
}

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
 * Pick the newest crawl whose source_url normalizes to the restart URL.
 * Falls back to null when none match (treat as no crawl for this URL).
 */
export function pickLatestCrawlForUrl(
  crawls: Array<{ id: string; job_status: string; source_url: string }>,
  normalizedUrl: string,
): CrawlEvidence | null {
  for (const row of crawls) {
    const rowUrl = normalizeAnalysisUrl(row.source_url);
    if (rowUrl === normalizedUrl) {
      return { id: row.id, job_status: row.job_status };
    }
  }
  return null;
}
