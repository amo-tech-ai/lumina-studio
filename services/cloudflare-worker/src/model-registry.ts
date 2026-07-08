export interface ModelEntry {
  provider: "gemini" | "workers-ai" | "nvidia";
  model: string;
  capabilities: string[];
  contextWindow: number;
  costPer1kIn: number;
  costPer1kOut: number;
}

export interface ModelRegistry {
  tiers: Record<string, ModelEntry>;
}

const DEFAULT_REGISTRY: ModelRegistry = {
  tiers: {
    default: {
      provider: "gemini",
      model: "gemini-3.1-flash-lite",
      capabilities: ["text", "structured", "streaming"],
      contextWindow: 128000,
      costPer1kIn: 0.000075,
      costPer1kOut: 0.0003,
    },
    fast: {
      provider: "gemini",
      model: "gemini-3.1-flash-lite",
      capabilities: ["text", "streaming"],
      contextWindow: 128000,
      costPer1kIn: 0.000075,
      costPer1kOut: 0.0003,
    },
    structured: {
      provider: "gemini",
      model: "gemini-3.1-pro-preview",
      capabilities: ["structured", "text", "streaming"],
      contextWindow: 128000,
      costPer1kIn: 0.0005,
      costPer1kOut: 0.0015,
    },
    vision: {
      provider: "gemini",
      model: "gemini-3.5-flash",
      capabilities: ["vision", "text", "streaming"],
      contextWindow: 1048576,
      costPer1kIn: 0.0003,
      costPer1kOut: 0.001,
    },
    embedding: {
      provider: "workers-ai",
      model: "@cf/baai/bge-base-en-v1.5",
      capabilities: ["embedding"],
      contextWindow: 0,
      costPer1kIn: 0.000067,
      costPer1kOut: 0,
    },
  },
};

export function getRegistry(overrides?: ModelRegistry): ModelRegistry {
  return overrides ?? DEFAULT_REGISTRY;
}

export function resolveModelEntry(
  tier: string,
  registry?: ModelRegistry,
): ModelEntry | undefined {
  return getRegistry(registry).tiers[tier];
}
