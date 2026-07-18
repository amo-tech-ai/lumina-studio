/** Env keys required for CopilotKit Intelligence (license + managed service trio). */
export const COPILOT_INTELLIGENCE_ENV_KEYS = [
  "COPILOTKIT_LICENSE_TOKEN",
  "INTELLIGENCE_API_KEY",
  "INTELLIGENCE_API_URL",
  "INTELLIGENCE_GATEWAY_WS_URL",
] as const;

/** All four Intelligence env vars present. Does not imply runtime Intelligence mode. */
export function isCopilotIntelligenceEnvComplete(): boolean {
  const license = process.env.COPILOTKIT_LICENSE_TOKEN?.trim();
  if (!license) return false;
  return Boolean(
    process.env.INTELLIGENCE_API_KEY?.trim() &&
      process.env.INTELLIGENCE_API_URL?.trim() &&
      process.env.INTELLIGENCE_GATEWAY_WS_URL?.trim(),
  );
}

/** @deprecated Prefer {@link isCopilotIntelligenceEnvComplete} — name kept for call sites. */
export function isCopilotIntelligenceEnabled(): boolean {
  return isCopilotIntelligenceEnvComplete();
}

/**
 * True when `CopilotRuntime` passes `intelligence: new CopilotKitIntelligence(...)`.
 * Until wired in the copilotkit route, stays false so SSE mode does not expose a broken threads UI.
 */
function isCopilotIntelligenceRuntimeWired(): boolean {
  return false;
}

/** Gate for `NEXT_PUBLIC_COPILOTKIT_THREADS_ENABLED` and Intelligence runtime options. */
export function isCopilotKitThreadsEnabled(): boolean {
  return isCopilotIntelligenceEnvComplete() && isCopilotIntelligenceRuntimeWired();
}
