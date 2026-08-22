/**
 * IPI-1019 · CF-AI-007b / IPI-1026 · CF-AI-007c — NVIDIA NIM hosted catalog.
 * Distinct from Workers AI `@cf/nvidia/...` ids.
 *
 * Chat: POST {NVIDIA_NIM_BASE_URL}/chat/completions
 * Embed: embeddings API via textEmbeddingModel() — never chatModel().
 *
 * IDs verified 2026-08-21 against https://build.nvidia.com model pages.
 * Tool calling is model-dependent (NIM docs); NVIDIA_NIM_CAPABILITIES is a
 * catalog note, not a runtime switch.
 */
import type { GroqModelTier } from "./types";

export const NVIDIA_NIM_BASE_URL = "https://integrate.api.nvidia.com/v1";

export type NvidiaChatTier =
  | "default"
  | "fast"
  | "reasoning"
  | "agent"
  | "vision"
  | "video"
  | "multimodal"
  | "coding"
  | "longContext";

export type NvidiaModelTier = NvidiaChatTier | "embedding";

export const NVIDIA_CHAT_MODEL_IDS = {
  default: "nvidia/nemotron-3.5-lightning-30b-a3b",
  fast: "nvidia/nemotron-3.5-lightning-30b-a3b",
  reasoning: "nvidia/nemotron-3-ultra-550b-a55b",
  agent: "thinkingmachines/inkling",
  vision: "thinkingmachines/inkling",
  video: "moonshotai/kimi-k2.6",
  multimodal: "minimaxai/minimax-m3",
  coding: "poolside/laguna-xs-2.1",
  longContext: "deepseek-ai/deepseek-v4-flash-0731",
} as const satisfies Record<NvidiaChatTier, string>;

export const NVIDIA_EMBEDDING_MODEL_ID = "nvidia/nemotron-3-embed-1b";

/** Hosted NIM capabilities from Build model pages / cards (2026-08-21). */
export type NvidiaNimCapability = {
  chat: boolean;
  stream: boolean;
  /** Official Tool Use / function-calling example on the model page or card. */
  tools: boolean;
  vision: boolean;
  embeddings: boolean;
  source: string;
};

export const NVIDIA_NIM_CAPABILITIES = {
  "nvidia/nemotron-3.5-lightning-30b-a3b": {
    chat: true,
    stream: true,
    tools: false,
    vision: false,
    embeddings: false,
    source: "https://build.nvidia.com/nvidia/nemotron-3.5-lightning-30b-a3b",
  },
  "nvidia/nemotron-3-ultra-550b-a55b": {
    chat: true,
    stream: true,
    tools: true,
    vision: false,
    embeddings: false,
    source: "https://build.nvidia.com/nvidia/nemotron-3-ultra-550b-a55b/modelcard",
  },
  "deepseek-ai/deepseek-v4-flash-0731": {
    chat: true,
    stream: true,
    tools: false,
    vision: false,
    embeddings: false,
    source: "https://build.nvidia.com/deepseek-ai/deepseek-v4-flash",
  },
  "thinkingmachines/inkling": {
    chat: true,
    stream: true,
    tools: true,
    vision: true,
    embeddings: false,
    source: "https://build.nvidia.com/thinkingmachines/inkling",
  },
  "moonshotai/kimi-k2.6": {
    chat: true,
    stream: true,
    tools: true,
    vision: true,
    embeddings: false,
    source: "https://build.nvidia.com/moonshotai/kimi-k2.6",
  },
  "minimaxai/minimax-m3": {
    chat: true,
    stream: true,
    tools: true,
    vision: true,
    embeddings: false,
    source: "https://build.nvidia.com/minimaxai/minimax-m3",
  },
  "poolside/laguna-xs-2.1": {
    chat: true,
    stream: true,
    tools: true,
    vision: false,
    embeddings: false,
    source: "https://build.nvidia.com/poolside/laguna-xs-2.1",
  },
  "nvidia/nemotron-3-embed-1b": {
    chat: false,
    stream: false,
    tools: false,
    vision: false,
    embeddings: true,
    source: "https://build.nvidia.com/nvidia/nemotron-3-embed-1b",
  },
} as const satisfies Record<string, NvidiaNimCapability>;

export function nvidiaChatTierFromAgentTier(tier: GroqModelTier): NvidiaChatTier {
  switch (tier) {
    case "default":
      return "default";
    case "fast":
      return "fast";
    case "structured":
    case "structuredHeavy":
      return "reasoning";
    case "vision":
    case "visionExperimental":
      return "vision";
    case "compound":
    case "compoundMini":
    case "stt":
    case "safety":
      throw new Error(
        `Groq tier "${tier}" has no NVIDIA NIM equivalent. Keep AI_PROVIDER on gemini/groq for compound/stt/safety, or call resolveNvidiaLanguageModel() for NVIDIA-only chat tiers.`,
      );
    default: {
      const _never: never = tier;
      throw new Error(`Unhandled Groq tier: ${_never}`);
    }
  }
}
