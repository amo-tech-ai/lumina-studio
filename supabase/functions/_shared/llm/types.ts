// Re-exports from the shared AI provider types package.
// This file exists for backward compatibility with existing Supabase Edge Function imports.
// The SSOT is app/src/lib/ai/types.ts — do not add new types here.

// @ts-ignore — Deno may not resolve the app path during CI. Types are checked at app build time.
export type { AiProvider, ModelTier, ModelCapabilities, ModelRegistryEntry, ModelRegistry } from "../../../../app/src/lib/ai/types.ts";

// ── Edge-function-specific types NOT in the shared package ──
// These are Edge-function-only concerns and stay here.

export type GroqRateLimitHeaders = {
  retryAfterMs?: number;
  limitRequests?: number;
  remainingRequests?: number;
  limitTokens?: number;
  remainingTokens?: number;
};

export type StructuredGenerationLog = {
  provider: string;
  model: string;
  xGroqRequestId?: string;
  schemaRepairCount: number;
  usage?: {
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
  };
};

export type StructuredGenerationScope = "bi" | "dna" | "default";

export type StructuredGenerationOptions = {
  scope?: StructuredGenerationScope;
  systemPrompt: string;
  userContent: string;
  jsonSchema: Record<string, unknown>;
  geminiResponseSchema?: object;
  schemaName?: string;
  tier?: string;
  maxCompletionTokens?: number;
  temperature?: number;
  timeoutMs?: number;
};

export type StructuredGenerationResult<T> = {
  data: T;
  text: string;
  log: StructuredGenerationLog;
};

// ── Deprecated Groq-only types (kept for compat, will be removed by IPI-459) ──

/** @deprecated Use ModelTier instead. */
export type GroqModelTier = string;
/** @deprecated */
export type GroqModelEntry = import("../../../../app/src/lib/ai/types.ts").GroqModelEntry;
/** @deprecated */
export type GroqModelsConfig = import("../../../../app/src/lib/ai/types.ts").GroqModelsConfig;
