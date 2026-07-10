// Single SSOT for AI provider types — importable by Next.js, Mastra, Cloudflare Workers.
// Supabase Edge Functions redirect here via _shared/llm/types.ts re-export.

/** Active provider options. */
export type AiProvider =
  | "gemini"
  | "groq"
  | "openai"
  | "workers-ai"
  | "nvidia"
  | "openai-compatible"
  | "mock";

export type GroqModelTier =
  | "default"
  | "fast"
  | "structured"
  | "structuredHeavy"
  | "vision"
  | "visionExperimental"
  | "compound"
  | "compoundMini"
  | "stt"
  | "safety";

export type GroqModelEntry = {
  id: string;
  tier: GroqModelTier;
  strictStructured: boolean;
  parallelTools: boolean;
  promptCaching: boolean;
  evaluationOnly: boolean;
  productionDefault: boolean;
  deprecatedAfter?: string;
  replacementModel?: string;
};

export type GroqModelsConfig = {
  version: number;
  updatedAt: string;
  envMapping: Record<GroqModelTier, string>;
  defaults: Record<GroqModelTier, string>;
  models: GroqModelEntry[];
};

/** Five-tier model system matching CF-000 architecture (distinct from GroqModelTier above). */
export type ModelTier = "default" | "fast" | "structured" | "vision" | "embedding";

/** Capability flags for a model entry. */
export type ModelCapabilities = {
  chat: boolean;
  structured: boolean;
  streaming: boolean;
  vision: boolean;
  embeddings: boolean;
  toolUse: boolean;
};

/** Single entry in the model registry. */
export type ModelRegistryEntry = {
  id: string;
  provider: AiProvider;
  tier: ModelTier;
  capabilities: ModelCapabilities;
  enabled: boolean;
  costPer1kInput?: number;
  costPer1kOutput?: number;
  notes?: string;
};

/** The full model registry — typed file seed for MVP. KV-backed later if CF-000 approves. */
export type ModelRegistry = {
  version: number;
  updatedAt: string;
  defaultTier: ModelTier;
  models: ModelRegistryEntry[];
};
