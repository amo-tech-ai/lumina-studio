/**
 * IPI-1019 · CF-AI-007b — NVIDIA NIM hosted catalog (OpenAI-compatible).
 * Distinct from Workers AI `@cf/nvidia/...` ids.
 *
 * Chat: POST {NVIDIA_NIM_BASE_URL}/chat/completions
 * Embed: embeddings API via embeddingModel() — never chatModel().
 *
 * IDs are the Linear target registry. Confirm against https://build.nvidia.com
 * before any production AI_PROVIDER=nvidia cutover (out of scope here).
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
  agent: "z-ai/glm-5.2",
  vision: "thinkingmachines/inkling",
  video: "moonshotai/kimi-k2.6",
  multimodal: "minimaxai/minimax-m3",
  coding: "poolside/laguna-xs-2.1",
  longContext: "deepseek-ai/deepseek-v4-flash",
} as const satisfies Record<NvidiaChatTier, string>;

export const NVIDIA_EMBEDDING_MODEL_ID = "nvidia/nemotron-3-embed-1b";

export function nvidiaChatTierFromAgentTier(tier: GroqModelTier): NvidiaChatTier {
  switch (tier) {
    case "fast":
      return "fast";
    case "structured":
    case "structuredHeavy":
      return "reasoning";
    case "vision":
    case "visionExperimental":
      return "vision";
    default:
      return "default";
  }
}
