/**
 * CopilotKit /info 503 Threshold Classifier
 * 
 * Single source of truth for determining whether network/console events
 * should be treated as critical failures or tolerated transients.
 * 
 * IPI-967 · COPILOT-GATE-003
 */

const MAX_INFO_503_RETRIES = 1; // Allows 1 retry = 2 total attempts

/**
 * Classify a console error as blocking or tolerated
 * 
 * @param {Object} error - Console error object
 * @param {string} error.text - Error text
 * @param {string} error.type - Error type
 * @returns {boolean} - True if blocking, false if tolerated
 */
export function classifyConsoleError(error) {
  const t = error.text || "";
  
  // Ignore documented retryable /api/copilotkit/info 503 errors (IPI-955)
  if (/Runtime info request failed with status 503/i.test(t)) return false;
  if (/Failed to load resource.*503.*copilotkit\/info/i.test(t)) return false;
  
  // Blocking error patterns
  if (/hydration|Hydration/i.test(t)) return true;
  if (/Uncaught|uncaught/i.test(t)) return true;
  // Cloudflare Worker / Miniflare runtime failures — match explicit runtime
  // wording, NOT the substring "Worker" inside deployment URLs like
  // "*.workers.dev" which appear in AI provider stack traces (false positive,
  // IPI-972). Real Worker runtime errors say things like "Worker threw" or
  // "Miniflare: ..." or "Cloudflare Workers runtime".
  if (
    /Worker (threw|exited|crashed|runtime)/i.test(t) ||
    /Miniflare/i.test(t) ||
    /Cloudflare Workers runtime/i.test(t)
  ) {
    return true;
  }
  if (/ChunkLoadError|Script error/i.test(t)) return true;
  
  // Ignore known noisy third-party
  if (/favicon|Download the React DevTools/i.test(t)) return false;
  if (/Failed to load resource.*favicon/i.test(t)) return false;
  
  return error.type === "pageerror" || /TypeError|ReferenceError|SyntaxError/i.test(t);
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
