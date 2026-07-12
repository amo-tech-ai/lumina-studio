/**
 * A configured model with routing info and capabilities.
 * Used by the gateway to select providers and handle fallback.
 *
 * Supported providers:
 * - "gemini": Google Gemini (primary)
 * - "workers-ai": Cloudflare Workers AI (primary)
 * - "bedrock": AWS Bedrock Responses API (fallback for 429/5xx/timeout)
 *
 * Special tiers:
 * - "default-fallback": Used when primary provider fails with a retryable error.
 */
export interface ModelEntry {
  provider: "gemini" | "workers-ai" | "bedrock" | "nvidia";
  model: string;
  capabilities: string[];
  contextWindow: number;
  costPer1kIn: number;
  costPer1kOut: number;
}

/**
 * Model registry mapping tier names to model configs.
 * Supports custom overrides via MODEL_REGISTRY_OVERRIDE env var (JSON).
 */
export interface ModelRegistry {
  tiers: Record<string, ModelEntry>;
}

const DEFAULT_REGISTRY: ModelRegistry = {
  tiers: {
    default: {
      provider: "workers-ai",
      model: "@cf/meta/llama-4-scout-17b-16e-instruct",
      capabilities: ["text", "structured", "streaming"],
      contextWindow: 128000,
      costPer1kIn: 0.000067,
      costPer1kOut: 0.000136,
    },
    fast: {
      provider: "workers-ai",
      model: "@cf/meta/llama-4-scout-17b-16e-instruct",
      capabilities: ["text", "streaming"],
      contextWindow: 128000,
      costPer1kIn: 0.000067,
      costPer1kOut: 0.000136,
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
    "default-fallback": {
      provider: "bedrock",
      model: "us.anthropic.claude-sonnet-4-6",
      capabilities: ["text", "structured", "streaming"],
      contextWindow: 200000,
      costPer1kIn: 0.00025,
      costPer1kOut: 0.00125,
    },
  },
};

export function getRegistry(overrides?: ModelRegistry): ModelRegistry {
  if (!overrides) return DEFAULT_REGISTRY;
  return {
    tiers: { ...DEFAULT_REGISTRY.tiers, ...overrides.tiers },
  };
}

export function resolveModelEntry(
  tier: string,
  registry?: ModelRegistry,
): ModelEntry | undefined {
  return getRegistry(registry).tiers[tier];
}
