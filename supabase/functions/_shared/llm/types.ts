// Re-exports from the shared AI provider types package.
// This file exists for backward compatibility with existing Supabase Edge Function imports.
// The SSOT is app/src/lib/ai/types.ts — do not add new types here.

import type {
  AiProvider,
  ModelTier,
  ModelCapabilities,
  ModelRegistryEntry,
  ModelRegistry,
  GroqModelTier,
  GroqModelEntry,
  GroqModelsConfig,
} from "../../../../app/src/lib/ai/types.ts";

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
  provider: AiProvider;
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
  tier?: GroqModelTier;
  maxCompletionTokens?: number;
  temperature?: number;
  timeoutMs?: number;
};

export type StructuredGenerationResult<T> = {
  data: T;
  text: string;
  log: StructuredGenerationLog;
};

// ── Groq-specific types — still actively used, not deprecated (see app/src/lib/ai/types.ts) ──

export type { GroqModelTier, GroqModelEntry, GroqModelsConfig } from "../../../../app/src/lib/ai/types.ts";
