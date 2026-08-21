/**
 * CopilotKit agent POST matching for IPI-724 preview E2E.
 * Status-agnostic: HTTP 503 / Cloudflare 1102 must be observed as 503, not "no POST".
 */

export function isCopilotKitAgentPost(url, method) {
  return typeof url === "string" && url.includes("/api/copilotkit") && method === "POST";
}

/** Visible Send → click only. Otherwise Enter. Never both. */
export function copilotChatSubmitMode(sendButtonVisible) {
  return sendButtonVisible ? "click" : "enter";
}

export function copilotKitCfDiagnostics(headers = {}) {
  const get = (name) => {
    const lower = name.toLowerCase();
    for (const [k, v] of Object.entries(headers)) {
      if (k.toLowerCase() === lower && v) return v;
    }
    return null;
  };
  return {
    cfRay: get("cf-ray"),
    cfErrorType: get("cf-error-type"),
    cfErrorOrigin: get("cf-error-origin"),
  };
}

export function formatCopilotKitPostFailure(status, contentType, diagnostics) {
  const d =
    diagnostics && typeof diagnostics === "object" && !Array.isArray(diagnostics)
      ? diagnostics
      : { cfRay: diagnostics || null };
  const parts = [
    `POST status=${status}`,
    `ct=${contentType || "none"}`,
    `cf-ray=${d.cfRay || "none"}`,
  ];
  if (d.cfErrorType) parts.push(`cf-error-type=${d.cfErrorType}`);
  if (d.cfErrorOrigin) parts.push(`cf-error-origin=${d.cfErrorOrigin}`);
  return parts.join(" ");
}

/**
 * @param {number} status
 * @param {string} [contentType]
 * @returns {{ ok: boolean, streaming: boolean, reason: string }}
 */
export function copilotKitPostChatVerdict(status, contentType = "") {
  const ct = contentType || "";
  if (status >= 500) {
    return {
      ok: false,
      streaming: false,
      reason: `POST status=${status}`,
    };
  }
  const streaming =
    ct.includes("text/event-stream") ||
    ct.includes("text/plain") ||
    ct.includes("application/octet-stream") ||
    status === 200;
  const ok = streaming && status < 400;
  return {
    ok,
    streaming,
    reason: `POST status=${status} ct=${ct || "none"}`,
  };
}
