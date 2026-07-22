/**
 * IPI-750 · CF-MIG-230-W0 — per-request native-vs-legacy model resolver.
 *
 * Application-level only: constructs a Workers AI model when every native
 * precondition holds, otherwise reuses the existing legacy resolveModel()
 * path unchanged. Zero agents are flipped by this file — that only happens
 * once a wave (W1+) sets an AI_ROUTING_AGENT_* flag to "native".
 *
 * Decision order (each miss falls through to legacy, nothing throws):
 *   1. cfEnv must be explicitly present on the RequestContext (never process.env — IPI-607 risk note)
 *   2. the per-agent routing flag (agent-routing.ts) must resolve to "native"
 *   3. cfEnv.AI (the Workers AI binding) must be present
 *   4. the requested tier must have a Workers AI capability entry (model-capabilities.ts)
 */
import { createWorkersAI } from "workers-ai-provider";
import type { RequestContext } from "@mastra/core/request-context";

import { resolveAgentRoutingOutcome } from "./agent-routing";
import { resolveWorkersAiTierCapability } from "./model-capabilities";
import { resolveModel } from "./provider";
import type { GroqModelTier } from "./types";

/**
 * Minimal structural type, not the generated `CloudflareEnv` ambient global.
 * `cloudflare-env.d.ts` doesn't exist until `npm run cf-typegen` has run, and
 * this file is in the first (non-Cloudflare-scoped) tsc pass — same reason
 * IPI-586's smoke route (`cloudflare-ai-gateway-smoke/route.ts`) hand-rolls
 * its own `SmokeEnv`/`AiBinding` types instead of using the ambient one.
 */
type WorkersAiBinding = Parameters<typeof createWorkersAI>[0]["binding"];
type CfEnvLike = Record<string, string | undefined> & { AI?: WorkersAiBinding };

export type CloudflareModelReason =
  | "no_cf_env"
  | "unknown_agent"
  | "legacy_flag"
  | "missing_ai_binding"
  | "unsupported_tier"
  | "native";

export type ResolveAgentModelOptions = {
  agentId: string;
  tier?: GroqModelTier;
  requestContext: RequestContext;
};

type LegacyLanguageModel = ReturnType<typeof resolveModel>;
type WorkersAiLanguageModel = ReturnType<ReturnType<typeof createWorkersAI>>;

export type ResolveAgentModelOutcome = {
  model: LegacyLanguageModel | WorkersAiLanguageModel;
  mode: "native" | "legacy";
  reason: CloudflareModelReason;
};

/**
 * Reads `cfEnv` off the RequestContext. Returns `undefined` outside a
 * Cloudflare request (Vercel, Node Vitest, or before IPI-750's callers set
 * it) — that absence, not a throw, is what drives step 1 of the decision
 * order above.
 */
function readCfEnv(requestContext: RequestContext): CfEnvLike | undefined {
  const raw = requestContext.get("cfEnv");
  if (!raw || typeof raw !== "object") return undefined;
  return raw as CfEnvLike;
}

export function resolveAgentModelOutcome({
  agentId,
  tier = "default",
  requestContext,
}: ResolveAgentModelOptions): ResolveAgentModelOutcome {
  const cfEnv = readCfEnv(requestContext);

  if (!cfEnv) {
    return { model: resolveModel(tier), mode: "legacy", reason: "no_cf_env" };
  }

  // Explicit cfEnv only — resolveAgentRoutingOutcome must never fall back to
  // process.env here (IPI-607 risk note).
  const routing = resolveAgentRoutingOutcome(agentId, { env: cfEnv });

  if (routing.mode !== "native") {
    return {
      model: resolveModel(tier),
      mode: "legacy",
      reason: routing.reason === "unknown_agent" ? "unknown_agent" : "legacy_flag",
    };
  }

  if (!cfEnv.AI) {
    return { model: resolveModel(tier), mode: "legacy", reason: "missing_ai_binding" };
  }

  const capability = resolveWorkersAiTierCapability(tier);
  if (!capability) {
    return { model: resolveModel(tier), mode: "legacy", reason: "unsupported_tier" };
  }

  const workersAi = createWorkersAI({ binding: cfEnv.AI });
  return { model: workersAi(capability.modelId), mode: "native", reason: "native" };
}

/** Thin accessor for Mastra's `model: ({ requestContext }) => ...` callback. */
export function resolveAgentModel(
  options: ResolveAgentModelOptions,
): ResolveAgentModelOutcome["model"] {
  return resolveAgentModelOutcome(options).model;
}
