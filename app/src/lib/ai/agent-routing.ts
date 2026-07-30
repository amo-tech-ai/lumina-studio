/**
 * IPI-607 · CF-MIG-230-FLAGS — Per-agent native vs legacy routing switches.
 *
 * Application-level only: does not construct models or read cfEnv (IPI-750).
 * Precedence for later consumers: per-agent flag → default legacy.
 * Independent of global AI_ROUTING_MODE (direct | gateway).
 *
 * Env key names live in `agent-routing-keys.mjs` (SSOT shared with Worker var allowlist).
 */

import {
  AGENT_ROUTING_ENV_KEYS,
  AGENT_ROUTING_KEYS as AGENT_ROUTING_KEYS_TABLE,
} from "./agent-routing-keys.mjs";

export type AgentRoutingMode = "native" | "legacy";

/**
 * Which CopilotKit registry `default` belongs to.
 * - operator: `/api/copilotkit` — `default` → production-planner
 * - marketing: `/api/marketing-chat` — `default` → public-marketing
 */
export type AgentRoutingSurface = "operator" | "marketing";

/** Explicit env keys — no kebab→SNAKE auto-conversion (avoids deploy-name drift). */
export const AGENT_ROUTING_KEYS = AGENT_ROUTING_KEYS_TABLE as {
  readonly "public-marketing": "AI_ROUTING_AGENT_PUBLIC_MARKETING";
  readonly "production-planner": "AI_ROUTING_AGENT_PRODUCTION_PLANNER";
  readonly "creative-director": "AI_ROUTING_AGENT_CREATIVE_DIRECTOR";
  readonly "visual-identity": "AI_ROUTING_AGENT_VISUAL_IDENTITY";
  readonly "social-discovery": "AI_ROUTING_AGENT_SOCIAL_DISCOVERY";
  readonly "brand-intelligence": "AI_ROUTING_AGENT_BRAND_INTELLIGENCE";
  readonly "model-match": "AI_ROUTING_AGENT_MODEL_MATCH";
  readonly "crm-assistant": "AI_ROUTING_AGENT_CRM_ASSISTANT";
  readonly booking: "AI_ROUTING_AGENT_BOOKING";
};

export type RoutableAgentId = keyof typeof AGENT_ROUTING_KEYS;

export type AgentRoutingReason =
  | "native"
  | "legacy_explicit"
  | "unset"
  | "empty"
  | "invalid"
  | "unknown_agent";

export type AgentRoutingOutcome = {
  agentId: string;
  /** Id used for the env key lookup after surface-aware `default` resolution. */
  canonicalAgentId?: RoutableAgentId;
  mode: AgentRoutingMode;
  reason: AgentRoutingReason;
  envKey?: string;
};

type EnvLike = Record<string, string | undefined>;

export type ResolveAgentRoutingOptions = {
  env?: EnvLike;
  surface?: AgentRoutingSurface;
};

/**
 * Map CopilotKit agentId (+ surface) to the routable registry id.
 * `default` is context-specific — never hard-code one product path.
 */
export function resolveCanonicalRoutableAgentId(
  agentId: string,
  surface: AgentRoutingSurface = "operator",
): RoutableAgentId | undefined {
  if (agentId === "default") {
    return surface === "marketing" ? "public-marketing" : "production-planner";
  }
  if (Object.prototype.hasOwnProperty.call(AGENT_ROUTING_KEYS, agentId)) {
    return agentId as RoutableAgentId;
  }
  return undefined;
}

export function resolveAgentRoutingEnvKey(
  agentId: string,
  surface: AgentRoutingSurface = "operator",
): string | undefined {
  const canonical = resolveCanonicalRoutableAgentId(agentId, surface);
  return canonical ? AGENT_ROUTING_KEYS[canonical] : undefined;
}

export function listAgentRoutingEnvKeys(): readonly string[] {
  return AGENT_ROUTING_ENV_KEYS;
}

const warnedInvalid = new Set<string>();

function warnInvalidOnce(agentId: string, envKey: string, raw: string): void {
  const dedupe = `${envKey}:${raw}`;
  if (warnedInvalid.has(dedupe)) return;
  warnedInvalid.add(dedupe);
  // Sanitized only — never dump env or secrets.
  console.warn(
    `[agent-routing] invalid ${envKey} for agentId="${agentId}" (fail-closed to legacy)`,
  );
}

/** Test helper — clears one-shot invalid warnings. */
export function resetAgentRoutingWarnState(): void {
  warnedInvalid.clear();
}

export function resolveAgentRoutingOutcome(
  agentId: string,
  options: ResolveAgentRoutingOptions = {},
): AgentRoutingOutcome {
  const env = options.env ?? process.env;
  const surface = options.surface ?? "operator";
  const canonicalAgentId = resolveCanonicalRoutableAgentId(agentId, surface);
  if (!canonicalAgentId) {
    return { agentId, mode: "legacy", reason: "unknown_agent" };
  }

  const envKey = AGENT_ROUTING_KEYS[canonicalAgentId];
  const raw = env[envKey];
  if (raw === undefined) {
    return { agentId, canonicalAgentId, mode: "legacy", reason: "unset", envKey };
  }

  const normalized = raw.trim().toLowerCase();
  if (normalized === "") {
    return { agentId, canonicalAgentId, mode: "legacy", reason: "empty", envKey };
  }
  if (normalized === "native") {
    return { agentId, canonicalAgentId, mode: "native", reason: "native", envKey };
  }
  if (normalized === "legacy") {
    return {
      agentId,
      canonicalAgentId,
      mode: "legacy",
      reason: "legacy_explicit",
      envKey,
    };
  }

  warnInvalidOnce(agentId, envKey, normalized);
  return { agentId, canonicalAgentId, mode: "legacy", reason: "invalid", envKey };
}

export function resolveAgentRoutingMode(
  agentId: string,
  options: ResolveAgentRoutingOptions = {},
): AgentRoutingMode {
  return resolveAgentRoutingOutcome(agentId, options).mode;
}
