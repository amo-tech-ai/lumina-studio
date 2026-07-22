/**
 * IPI-750 · CF-MIG-230-W0 — minimal Workers AI tier matrix.
 *
 * Only the tiers the earliest planned waves actually need (W1 public-marketing
 * "fast", W3 production-planner "default"). An unlisted tier is not an error —
 * resolveAgentModel() in cloudflare-models.ts falls back to legacy for it, so
 * add entries here only when a wave is ready to use them.
 */
import type { GroqModelTier } from "./types";

export type WorkersAiTierCapability = {
  /** Workers AI catalog model id, e.g. "@cf/meta/llama-3.1-8b-instruct". */
  modelId: string;
  supportsTools: boolean;
  supportsStreaming: boolean;
};

export const WORKERS_AI_TIER_CAPABILITIES: Partial<
  Record<GroqModelTier, WorkersAiTierCapability>
> = {
  // Proven live against this Cloudflare account via the IPI-586 smoke route.
  default: {
    modelId: "@cf/moonshotai/kimi-k2.6",
    supportsTools: true,
    supportsStreaming: true,
  },
  // Tool-free marketing path — matches provider.ts's existing "fast" tier framing.
  fast: {
    modelId: "@cf/meta/llama-3.1-8b-instruct",
    supportsTools: false,
    supportsStreaming: true,
  },
};

export function resolveWorkersAiTierCapability(
  tier: GroqModelTier,
): WorkersAiTierCapability | undefined {
  return WORKERS_AI_TIER_CAPABILITIES[tier];
}
