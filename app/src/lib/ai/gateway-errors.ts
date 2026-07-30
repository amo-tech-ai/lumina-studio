/**
 * IPI-750 · CF-MIG-230-W0 — thin, typed failure signals for the native model
 * resolver. None of these are thrown by resolveAgentModel() — it always
 * falls back to legacy instead (see cloudflare-models.ts). They exist as a
 * documented, typed vocabulary for future callers (structured logging, APM)
 * that want to distinguish *why* a request stayed on the legacy path.
 */

export class MissingCloudflareAiBindingError extends Error {
  constructor(agentId: string) {
    super(`env.AI is not available for agent "${agentId}" — falling back to legacy.`);
    this.name = "MissingCloudflareAiBindingError";
  }
}

export class UnsupportedTierError extends Error {
  constructor(tier: string) {
    super(`No Workers AI capability entry for tier "${tier}" — falling back to legacy.`);
    this.name = "UnsupportedTierError";
  }
}

export class UnsupportedCapabilityError extends Error {
  constructor(tier: string, capability: string) {
    super(
      `Tier "${tier}" does not support required capability "${capability}" — falling back to legacy.`,
    );
    this.name = "UnsupportedCapabilityError";
  }
}
