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

/** Mirror supabase/functions/brand-intelligence private-host SSRF guard. */
const PRIVATE_HOST_PATTERNS = [
  /^localhost$/i,
  /^127\./,
  /^10\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
  /^192\.168\./,
  /^169\.254\./,
  // Carrier-grade NAT (RFC 6598) 100.64.0.0/10
  /^100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\./,
  /^0\.0\.0\.0$/i,
  /^0\./,
  /^::$/,
  /^::1$/,
  /^::ffff:/i,
  /^fc00:/i,
  /^fd[0-9a-f]{2}:/i,
  /^fe[89ab][0-9a-f]:/i,
  /\.local$/i,
  /\.internal$/i,
];

function normalizeHostname(host: string): string {
  const h = host.toLowerCase();
  if (h.startsWith("[") && h.endsWith("]")) return h.slice(1, -1);
  return h;
}

function isPrivateOrInternalHost(hostname: string): boolean {
  return PRIVATE_HOST_PATTERNS.some((p) => p.test(normalizeHostname(hostname)));
}

/**
 * Normalize a website URL for restart identity.
 * Origin-only — matches brand-intelligence `normalizeBrandUrl` so path/query
 * variants reuse the same crawl and do not leak tokens into attempt keys.
 * Requires http(s); rejects private/internal hosts and embedded credentials.
 */
export function normalizeAnalysisUrl(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed || /\s/.test(trimmed)) return null;

  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return null;
    if (isPrivateOrInternalHost(parsed.hostname)) return null;
    // Never persist credentials into attempt keys / ai_agent_logs.
    if (parsed.username || parsed.password) return null;
    return parsed.origin.toLowerCase();
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
