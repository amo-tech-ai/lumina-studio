// Single SSOT for AI provider types — importable by Next.js, Mastra, Cloudflare Workers.
// Supabase Edge Functions redirect here via _shared/llm/types.ts re-export.

/** Active provider options. `groq` removed — use IPI-459 for code cleanup. */
export type AiProvider = "workers-ai" | "gemini" | "nvidia" | "openai-compatible" | "mock";

/** Five-tier model system matching CF-000 architecture. */
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

// ── Backward compatibility aliases (marked deprecated) ──

/** @deprecated Use ModelTier instead. Kept for existing Groq/compat code. Will be removed by IPI-459. */
export type GroqModelTier = string;

/** @deprecated Kept for existing Groq config loading. Will be removed by IPI-459. */
export type GroqModelEntry = {
  id: string;
  tier: string;
  strictStructured: boolean;
  parallelTools: boolean;
  promptCaching: boolean;
  evaluationOnly: boolean;
  productionDefault: boolean;
  deprecatedAfter?: string;
  replacementModel?: string;
};

/** @deprecated Kept for existing Groq config loading. Will be removed by IPI-459. */
export type GroqModelsConfig = {
  version: number;
  updatedAt: string;
  envMapping: Record<string, string>;
  defaults: Record<string, string>;
  models: GroqModelEntry[];
};
