import { describe, expect, it } from "vitest";

import { nvidiaChatTierFromAgentTier, type NvidiaChatTier } from "./nvidia-models";
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
