/**
 * IPI-607 · CF-MIG-230-FLAGS — Per-agent native vs legacy routing switches.
 *
 * Application-level only: does not construct models or read cfEnv (IPI-750).
 * Precedence for later consumers: per-agent flag → default legacy.
 * Independent of global AI_ROUTING_MODE (direct | gateway).
 */

export type AgentRoutingMode = "native" | "legacy";

/** Explicit env keys — no kebab→SNAKE auto-conversion (avoids deploy-name drift). */
export const AGENT_ROUTING_KEYS = {
  "public-marketing": "AI_ROUTING_AGENT_PUBLIC_MARKETING",
  "production-planner": "AI_ROUTING_AGENT_PRODUCTION_PLANNER",
  "creative-director": "AI_ROUTING_AGENT_CREATIVE_DIRECTOR",
  "visual-identity": "AI_ROUTING_AGENT_VISUAL_IDENTITY",
  "social-discovery": "AI_ROUTING_AGENT_SOCIAL_DISCOVERY",
  "brand-intelligence": "AI_ROUTING_AGENT_BRAND_INTELLIGENCE",
  "model-match": "AI_ROUTING_AGENT_MODEL_MATCH",
  "crm-assistant": "AI_ROUTING_AGENT_CRM_ASSISTANT",
  booking: "AI_ROUTING_AGENT_BOOKING",
} as const;

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
  mode: AgentRoutingMode;
  reason: AgentRoutingReason;
  envKey?: string;
};

type EnvLike = Record<string, string | undefined>;

/** CopilotKit `default` is the production-planner durable alias — same switch. */
export function resolveAgentRoutingEnvKey(agentId: string): string | undefined {
  if (agentId === "default") {
    return AGENT_ROUTING_KEYS["production-planner"];
  }
  if (Object.prototype.hasOwnProperty.call(AGENT_ROUTING_KEYS, agentId)) {
    return AGENT_ROUTING_KEYS[agentId as RoutableAgentId];
  }
  return undefined;
}

export function listAgentRoutingEnvKeys(): readonly string[] {
  return Object.values(AGENT_ROUTING_KEYS);
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
  env: EnvLike = process.env,
): AgentRoutingOutcome {
  const envKey = resolveAgentRoutingEnvKey(agentId);
  if (!envKey) {
    return { agentId, mode: "legacy", reason: "unknown_agent" };
  }

  const raw = env[envKey];
  if (raw === undefined) {
    return { agentId, mode: "legacy", reason: "unset", envKey };
  }

  const normalized = raw.trim().toLowerCase();
  if (normalized === "") {
    return { agentId, mode: "legacy", reason: "empty", envKey };
  }
  if (normalized === "native") {
    return { agentId, mode: "native", reason: "native", envKey };
  }
  if (normalized === "legacy") {
    return { agentId, mode: "legacy", reason: "legacy_explicit", envKey };
  }

  warnInvalidOnce(agentId, envKey, normalized);
  return { agentId, mode: "legacy", reason: "invalid", envKey };
}

export function resolveAgentRoutingMode(
  agentId: string,
  env: EnvLike = process.env,
): AgentRoutingMode {
  return resolveAgentRoutingOutcome(agentId, env).mode;
}
