import { describe, expect, it } from "vitest";

import { modelRegistry } from "./model-registry";
import type { ModelTier } from "./types";

const TIERS: ModelTier[] = ["default", "fast", "structured", "vision", "embedding"];

describe("modelRegistry", () => {
  it("declares a default tier that exists in the registry", () => {
    expect(TIERS).toContain(modelRegistry.defaultTier);
    expect(
      modelRegistry.models.some((m) => m.tier === modelRegistry.defaultTier && m.enabled),
    ).toBe(true);
  });

  it("has at least one enabled model per tier", () => {
    for (const tier of TIERS) {
      const enabled = modelRegistry.models.filter((m) => m.tier === tier && m.enabled);
      expect(enabled.length, `tier ${tier} has no enabled model`).toBeGreaterThan(0);
    }
  });

  it("never lists the same provider twice for one tier", () => {
    const seen = new Set<string>();
    for (const model of modelRegistry.models) {
      const key = `${model.tier}:${model.provider}`;
      expect(seen.has(key), `duplicate registry entry for ${key}`).toBe(false);
      seen.add(key);
    }
  });

  it("keeps capabilities consistent with the tier they serve", () => {
    for (const model of modelRegistry.models) {
      if (model.tier === "structured") expect(model.capabilities.structured).toBe(true);
      if (model.tier === "vision") expect(model.capabilities.vision).toBe(true);
      if (model.tier === "embedding") {
        expect(model.capabilities.embeddings).toBe(true);
        expect(model.capabilities.chat).toBe(false);
      } else {
        expect(model.capabilities.chat).toBe(true);
        expect(model.capabilities.embeddings).toBe(false);
      }
    }
  });

  it("prices every chat tier on both input and output tokens", () => {
    for (const model of modelRegistry.models) {
      expect(model.costPer1kInput).toBeGreaterThan(0);
      if (model.tier !== "embedding") {
        expect(model.costPer1kOutput, `${model.id} (${model.tier}) has no output cost`)
          .toBeGreaterThan(0);
      }
    }
  });

  it("carries no credentials or secret-looking fields", () => {
    expect(JSON.stringify(modelRegistry)).not.toMatch(/api[_-]?key|secret|token/i);
  });
});
