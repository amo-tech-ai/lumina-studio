import { describe, expect, it } from "vitest";
import { getRegistry, resolveModelEntry } from "./model-registry";

describe("getRegistry", () => {
  it("returns full default registry when no override is given", () => {
    const registry = getRegistry();
    expect(registry.tiers.default).toBeDefined();
    expect(registry.tiers.fast).toBeDefined();
    expect(registry.tiers.structured).toBeDefined();
    expect(registry.tiers.vision).toBeDefined();
    expect(registry.tiers.embedding).toBeDefined();
    expect(registry.tiers["default-fallback"]).toBeDefined();
    expect(Object.keys(registry.tiers)).toHaveLength(6);
  });

  it("merges partial override — only specified tier changes, others stay default", () => {
    const override = {
      tiers: {
        default: {
          provider: "gemini" as const,
          model: "gemini-3.5-flash",
          capabilities: ["text", "streaming"],
          contextWindow: 1048576,
          costPer1kIn: 0.0003,
          costPer1kOut: 0.001,
        },
      },
    };

    const registry = getRegistry(override);
    expect(registry.tiers.default.model).toBe("gemini-3.5-flash");
    expect(registry.tiers.fast.model).toBe("@cf/meta/llama-4-scout-17b-16e-instruct");
    expect(registry.tiers.structured.provider).toBe("gemini");
    expect(registry.tiers.vision.provider).toBe("gemini");
    expect(registry.tiers.embedding.provider).toBe("workers-ai");
  });

  it("preserves default-fallback in merged result when override omits it", () => {
    const override = {
      tiers: {
        fast: {
          provider: "gemini" as const,
          model: "gemini-3.1-flash-lite",
          capabilities: ["text", "streaming"],
          contextWindow: 128000,
          costPer1kIn: 0.000075,
          costPer1kOut: 0.0003,
        },
      },
    };

    const registry = getRegistry(override);
    const fallback = registry.tiers["default-fallback"];
    expect(fallback).toBeDefined();
    expect(fallback!.provider).toBe("bedrock");
    expect(fallback!.model).toBe("openai.gpt-oss-120b");
  });

  it("override values take precedence over matching default tier values", () => {
    const override = {
      tiers: {
        "default-fallback": {
          provider: "gemini" as const,
          model: "gemini-3.1-pro-preview",
          capabilities: ["structured", "text"],
          contextWindow: 128000,
          costPer1kIn: 0.0005,
          costPer1kOut: 0.0015,
        },
      },
    };

    const registry = getRegistry(override);
    const fallback = registry.tiers["default-fallback"];
    expect(fallback!.provider).toBe("gemini");
    expect(fallback!.model).toBe("gemini-3.1-pro-preview");
  });

  it("empty tiers override preserves all defaults unchanged", () => {
    const registry = getRegistry({ tiers: {} });
    expect(Object.keys(registry.tiers)).toHaveLength(6);
    expect(registry.tiers["default-fallback"]!.model).toBe("openai.gpt-oss-120b");
    expect(registry.tiers.default!.model).toBe("@cf/meta/llama-4-scout-17b-16e-instruct");
  });

  it("returned registry does not mutate DEFAULT_REGISTRY", () => {
    const override = {
      tiers: {
        default: {
          provider: "gemini" as const,
          model: "gemini-3.5-flash",
          capabilities: ["text", "streaming"],
          contextWindow: 1048576,
          costPer1kIn: 0.0003,
          costPer1kOut: 0.001,
        },
      },
    };

    const result1 = getRegistry(override);
    const result2 = getRegistry(override);
    const withoutOverride = getRegistry();

    expect(result1.tiers.default.model).toBe("gemini-3.5-flash");
    expect(result2.tiers.default.model).toBe("gemini-3.5-flash");
    expect(withoutOverride.tiers.default.model).toBe("@cf/meta/llama-4-scout-17b-16e-instruct");
    expect(result1.tiers).not.toBe(result2.tiers);
  });
});

describe("resolveModelEntry", () => {
  it("finds default tier without override", () => {
    const entry = resolveModelEntry("default");
    expect(entry).toBeDefined();
    expect(entry!.provider).toBe("workers-ai");
  });

  it("finds default-fallback from merged registry when override has only partial tiers", () => {
    const override = {
      tiers: {
        default: {
          provider: "workers-ai" as const,
          model: "@cf/meta/llama-4-scout-17b-16e-instruct",
          capabilities: ["text"],
          contextWindow: 4096,
          costPer1kIn: 0.0001,
          costPer1kOut: 0.0001,
        },
      },
    };
    const fallback = resolveModelEntry("default-fallback", override);
    expect(fallback).toBeDefined();
    expect(fallback!.provider).toBe("bedrock");
  });

  it("override value wins when same tier name exists in both", () => {
    const override = {
      tiers: {
        embedding: {
          provider: "gemini" as const,
          model: "gemini-3.1-flash-lite",
          capabilities: ["text"],
          contextWindow: 128000,
          costPer1kIn: 0.000075,
          costPer1kOut: 0.0003,
        },
      },
    };
    const entry = resolveModelEntry("embedding", override);
    expect(entry!.provider).toBe("gemini");
    expect(entry!.model).toBe("gemini-3.1-flash-lite");
  });

  it("returns undefined for nonexistent tier even after merge", () => {
    const entry = resolveModelEntry("nonexistent");
    expect(entry).toBeUndefined();
  });
});
