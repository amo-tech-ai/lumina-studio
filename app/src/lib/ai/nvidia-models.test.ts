import { describe, expect, it } from "vitest";

import {
  NVIDIA_CHAT_MODEL_IDS,
  NVIDIA_EMBEDDING_MODEL_ID,
  NVIDIA_NIM_CAPABILITIES,
  nvidiaChatTierFromAgentTier,
  type NvidiaChatTier,
} from "./nvidia-models";
import type { GroqModelTier } from "./types";

/** Exhaustive vs GroqModelTier — adding a tier without a row fails typecheck. */
const GROQ_TIER_NVIDIA_CHAT = {
  default: "default",
  fast: "fast",
  structured: "reasoning",
  structuredHeavy: "reasoning",
  vision: "vision",
  visionExperimental: "vision",
  compound: "throw",
  compoundMini: "throw",
  stt: "throw",
  safety: "throw",
} as const satisfies Record<GroqModelTier, NvidiaChatTier | "throw">;

describe("NVIDIA NIM catalog (IPI-1026 · CF-AI-007c)", () => {
  it("covers every configured chat and embedding id", () => {
    for (const id of Object.values(NVIDIA_CHAT_MODEL_IDS)) {
      expect(NVIDIA_NIM_CAPABILITIES[id], id).toBeDefined();
      expect(NVIDIA_NIM_CAPABILITIES[id].chat).toBe(true);
      expect(NVIDIA_NIM_CAPABILITIES[id].embeddings).toBe(false);
    }
    expect(NVIDIA_NIM_CAPABILITIES[NVIDIA_EMBEDDING_MODEL_ID].embeddings).toBe(true);
    expect(NVIDIA_NIM_CAPABILITIES[NVIDIA_EMBEDDING_MODEL_ID].chat).toBe(false);
    expect(NVIDIA_NIM_CAPABILITIES[NVIDIA_EMBEDDING_MODEL_ID].tools).toBe(false);
  });

  it("does not mark Lightning as hosted function-calling", () => {
    expect(NVIDIA_NIM_CAPABILITIES[NVIDIA_CHAT_MODEL_IDS.default].tools).toBe(false);
  });

  it("marks Inkling and Ultra as tool-capable; GLM-5.2 is EOL", () => {
    expect(NVIDIA_CHAT_MODEL_IDS.agent).toBe("thinkingmachines/inkling");
    expect(NVIDIA_NIM_CAPABILITIES[NVIDIA_CHAT_MODEL_IDS.agent].tools).toBe(true);
    expect(NVIDIA_NIM_CAPABILITIES[NVIDIA_CHAT_MODEL_IDS.reasoning].tools).toBe(true);
  });
});

describe("nvidiaChatTierFromAgentTier", () => {
  it("maps supported Groq tiers and throws for the rest", () => {
    for (const [tier, expected] of Object.entries(GROQ_TIER_NVIDIA_CHAT) as Array<
      [GroqModelTier, NvidiaChatTier | "throw"]
    >) {
      if (expected === "throw") {
        expect(() => nvidiaChatTierFromAgentTier(tier)).toThrow(/no NVIDIA NIM equivalent/);
      } else {
        expect(nvidiaChatTierFromAgentTier(tier)).toBe(expected);
      }
    }
  });
});
