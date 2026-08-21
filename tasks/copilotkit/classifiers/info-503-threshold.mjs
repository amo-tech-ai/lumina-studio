/**
 * CopilotKit /info 503 Threshold Classifier
 * 
 * Single source of truth for determining whether network/console events
 * should be treated as critical failures or tolerated transients.
 * 
 * IPI-967 · COPILOT-GATE-003 · IPI-972
 */

const MAX_INFO_503_RETRIES = 1; // Allows 1 retry = 2 total attempts

// IPI-972: Transient AI provider error signals that are safe to tolerate even
// when the stack trace passes through a *.workers.dev preview URL. These match
// the actual retryable conditions emitted by the AI SDK / Workers AI gateway.
// Permanently non-retryable provider errors (e.g. 401 invalid-key, 400
// invalid-model, 403 forbidden) do NOT match this set and remain blocking.
const RETRYABLE_AI_PROVIDER_PATTERNS = [
  /high demand/i,
  /spikes in demand are usually temporary/i,
  /temporar/i, // "temporarily", "temporary"
  /rate.?limit/i,
  /INCOMPLETE_STREAM/i,
  /Service unavailable/i,
  /Too many requests/i,
  /503/i,
  /502/i,
];

/**
 * Classify a console error as blocking or tolerated
 * 
 * @param {Object} error - Console error object
 * @param {string} error.text - Error text
 * @param {string} error.type - Error type
 * @returns {boolean} - True if blocking, false if tolerated
 */
function isStreamIdleTimeoutError(text) {
  return /STREAM_IDLE_TIMEOUT|no stream activity for \d+ms/i.test(text || "");
}

/** Prefer quoted AG-UI `runId` when CopilotKit/console includes it. */
export function extractAgUiRunId(text) {
  const m = String(text || "").match(/"runId"\s*:\s*"([^"]+)"/);
  return m?.[1] ?? null;
}

/**
 * Classify a console error as blocking or tolerated
 *
 * @param {Object} error - Console error object
 * @param {string} error.text - Error text
 * @param {string} error.type - Error type
 * @param {{ streamComplete?: boolean, completedRunId?: string|null, errorRunId?: string|null }} [context]
 *   `streamComplete` means 08 already saw assistant content. A later
 *   STREAM_IDLE_TIMEOUT is then stale (SSE body left open after RUN_FINISHED),
 *   not a failed turn — but only for the same run when both runIds are known.
 *   Genuine idle (no completed stream) stays blocking.
 *   Other `agent_run_error_event` lines are never ignored via this flag.
 */
export function classifyConsoleError(error, context = {}) {
  const t = error.text || "";

  // Stale idle timeout after a proven complete stream — not a blanket ignore
  // of agent_run_error_event (401 / invalid-model still block below).
  if (context.streamComplete && isStreamIdleTimeoutError(t)) {
    const errorRunId = context.errorRunId || extractAgUiRunId(t);
    const completedRunId = context.completedRunId || null;
    if (errorRunId && completedRunId && errorRunId !== completedRunId) {
      return true;
    }
    return false;
  }
  
  // --- Tolerated: documented retryable transients ---
  
  // Documented retryable /api/copilotkit/info 503 errors (IPI-955)
  if (/Runtime info request failed with status 503/i.test(t)) return false;
  if (/Failed to load resource.*503.*copilotkit\/info/i.test(t)) return false;
  
  // IPI-972: Classify AI provider errors explicitly so that transient provider
  // conditions (high demand, rate-limited, INCOMPLETE_STREAM) carrying a
  // *.workers.dev URL are tolerated, while permanent provider errors (401
  // invalid-key, 400 invalid-model, 403 forbidden) remain blocking.
  if (/AI_APICallError|agent_run_error_event/i.test(t)) {
    return !isRetryableAiProviderError(t);
  }
  
  // --- Blocking: genuine runtime failures ---
  
  if (/hydration|Hydration/i.test(t)) return true;
  if (/Uncaught|uncaught/i.test(t)) return true;
  
  // Cloudflare Worker / Miniflare runtime failures. Match explicit runtime
  // wording, NOT the bare substring "Worker" inside deployment URLs like
  // "*.workers.dev" (false positive, IPI-972). Real Worker runtime errors say
  // things like "Worker threw", "Worker exceeded", "Worker failed",
  // "Miniflare: ...", "Cloudflare Workers runtime", "Cloudflare Error 1102",
  // "Cloudflare error: Worker failed to start".
  if (
    /Worker (threw|exited|crashed|runtime|exceeded|failed|errored|timed out)/i.test(t) ||
    /Cloudflare (Error \d+|error|Workers runtime|Worker .* exceeded|Worker .* failed)/i.test(t) ||
    /Miniflare/i.test(t)
  ) {
    return true;
  }
  if (/ChunkLoadError|Script error/i.test(t)) return true;
  
  // --- Tolerated: known noisy third-party ---
  if (/favicon|Download the React DevTools/i.test(t)) return false;
  if (/Failed to load resource.*favicon/i.test(t)) return false;
  
  return error.type === "pageerror" || /TypeError|ReferenceError|SyntaxError/i.test(t);
}

/**
 * Determine whether a console error text represents a retryable AI provider
 * error — one caused by transient provider-side conditions (high demand, rate
 * limiting, 5xx) rather than a permanent client-side configuration problem
 * (invalid key, invalid model, forbidden).
 *
 * IPI-972: Called only after the caller has confirmed the text contains an
 * AI_APICallError / agent_run_error_event marker. This function returns the
 * final verdict: true (tolerate) only when the message explicitly signals a
 * retryable transient condition; false (block) for permanent provider errors.
 *
 * @param {string} text - Console error text
 * @returns {boolean} - True if the error is a retryable AI provider condition
 */
function isRetryableAiProviderError(text) {
  return RETRYABLE_AI_PROVIDER_PATTERNS.some((pattern) => pattern.test(text));
}

/**
 * Classify a network response as critical or tolerated
 * 
 * @param {Object} response - Network response object
 * @param {string} response.path - Request path
 * @param {string} response.method - HTTP method
 * @param {number} response.status - HTTP status
 * @param {number} info503Count - Current count of /info 503 responses
 * @param {string} phase - Current phase (e.g., "anon" for signout)
 * @returns {string} - Classification: "healthy" | "tolerated_transient" | "critical" | "expected_auth"
 */
export function classifyNetworkResponse(response, info503Count, phase) {
  const p = response.path || "";
  
  // Not an API endpoint - ignore
  if (!p.includes("/api/")) return "healthy";
  
  // Documented retryable 503 on /api/copilotkit/info (IPI-955)
  if (p === "/api/copilotkit/info" && response.method === "GET" && response.status === 503) {
    if (info503Count <= MAX_INFO_503_RETRIES + 1) {
      return "tolerated_transient";
    }
    return "critical";
  }
  
  // POST /info 503 is always critical (not documented as retryable)
  if (p === "/api/copilotkit/info" && response.method === "POST" && response.status === 503) {
    return "critical";
  }
  
  // Expected 401 after signout
  if (response.status === 401 && phase === "anon") {
    return "expected_auth";
  }
  
  // Authenticated 401/403 is critical (only during auth phase)
  // IPI-967: Original inline filter did not flag 4xx except POST /api/copilotkit*
  // We keep this stricter check but only apply it during auth phase
  if (phase === "auth" && (response.status === 401 || response.status === 403)) {
    return "critical";
  }
  
  // Generic 5xx are critical
  if (response.status >= 500) return "critical";
  
  // Auth endpoints that should work while logged in
  if (p.includes("/api/copilotkit") && response.method === "POST" && response.status >= 400) {
    return "critical";
  }
  if (p.includes("/api/ai/health") && response.status !== 200) {
    return "critical";
  }
  
  return "healthy";
}

/**
 * Count /api/copilotkit/info 503 responses in a network log
 * 
 * @param {Array} networkLog - Array of network response objects
 * @returns {number} - Count of /info GET 503 responses
 */
export function countInfo503Responses(networkLog) {
  return networkLog.filter(
    (n) => (n.path || "") === "/api/copilotkit/info" && n.method === "GET" && n.status === 503
  ).length;
}

/**
 * Check if /info 503 count exceeds threshold
 * 
 * MAX_INFO_503_RETRIES = 1 means we allow 1 retry, so 2 total attempts are tolerated.
 * Only when count exceeds 2 (i.e., 3 or more 503s) do we consider it critical.
 * 
 * @param {number} info503Count - Current count of /info 503 responses
 * @returns {boolean} - True if threshold exceeded
 */
export function info503ExceedsThreshold(info503Count) {
  return info503Count > MAX_INFO_503_RETRIES + 1;
}
