import { createGroq } from "@ai-sdk/groq";
import groqModelsSsot from "./groq-models.ssot.json";

import {
  createGeminiLanguageModel,
  resolveProviderOptions as resolveGeminiProviderOptions,
} from "./gemini-registry";
import type { AiProvider, GroqModelEntry, GroqModelTier, GroqModelsConfig } from "./types";

/**
 * CF-MIG-210: static JSON bundled for Cloudflare Workers (no runtime readFileSync).
 * Source of truth: `config/groq-models.json` — synced via `scripts/sync-groq-models.mjs` (prebuild).
 */
export function loadGroqModelsConfig(): GroqModelsConfig {
  return groqModelsSsot as GroqModelsConfig;
}

type ResolvedLanguageModel = ReturnType<typeof createGeminiLanguageModel>;

export type { AiProvider, GroqModelTier } from "./types";
export {
  GEMINI_MODELS,
  resolveGeminiModel,
} from "./gemini-registry";

// `groqModelsSsot` is a static bundled import (no runtime load), so these can
// be plain module-level constants instead of lazy-initialized caches.
const groqModelsConfig: GroqModelsConfig = loadGroqModelsConfig();
const modelById: Map<string, GroqModelEntry> = new Map(
  groqModelsConfig.models.map((entry) => [entry.id, entry] as const),
);

function getGroqModelsConfig(): GroqModelsConfig {
  return groqModelsConfig;
}

function getModelById(): Map<string, GroqModelEntry> {
  return modelById;
}

export function resolveAiProvider(): AiProvider {
  const raw = (process.env.AI_PROVIDER ?? "gemini").trim().toLowerCase();
  if (raw === "gemini" || raw === "groq" || raw === "openai") return raw;
  throw new Error(
    `AI_PROVIDER="${raw}" is invalid (expected gemini | groq | openai).`,
  );
}

export const resolveProvider = resolveAiProvider;

export function getGroqModelEntry(modelId: string): GroqModelEntry | undefined {
  return getModelById().get(modelId);
}

export function resolveGroqModelId(tier: GroqModelTier = "default"): string {
  const groqModels = getGroqModelsConfig();
  const envKey = groqModels.envMapping[tier];
  const fromEnv = envKey ? process.env[envKey]?.trim() : "";
  const fallback = groqModels.defaults[tier]?.trim() ?? "";
  const modelId = fromEnv || fallback;
  if (!modelId) {
    throw new Error(`No Groq model configured for tier "${tier}".`);
  }
  if (!getModelById().has(modelId)) {
    throw new Error(
      `Groq model "${modelId}" is not in the bundled Groq allowlist (groq-models.ssot.json).`,
    );
  }
  return modelId;
}

function isGroqVisionConfigured(): boolean {
  const groqModels = getGroqModelsConfig();
  const envKey = groqModels.envMapping.vision;
  const fromEnv = envKey ? process.env[envKey]?.trim() : "";
  const fallback = groqModels.defaults.vision?.trim() ?? "";
  return Boolean(fromEnv || fallback);
}

export function resolveProviderOptions() {
  return resolveAiProvider() === "gemini" ? resolveGeminiProviderOptions() : {};
}

export function assertGroqTierCapabilities(
  tier: GroqModelTier,
  needs: { strictJson?: boolean; parallelTools?: boolean },
): GroqModelEntry {
  const entry = getGroqModelEntry(resolveGroqModelId(tier));
  if (!entry) {
    throw new Error(`Groq tier "${tier}" resolved to an unknown allowlist entry.`);
  }
  if (needs.strictJson && !entry.strictStructured) {
    throw new Error(
      `Groq tier "${tier}" model "${entry.id}" does not support strict JSON schema.`,
    );
  }
  if (needs.parallelTools && !entry.parallelTools) {
    throw new Error(
      `Groq tier "${tier}" model "${entry.id}" does not support parallel tool calls.`,
    );
  }
  return entry;
}

function createGroqLanguageModel(tier: GroqModelTier): ResolvedLanguageModel {
  const apiKey = process.env.GROQ_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("GROQ_API_KEY is required when AI_PROVIDER=groq.");
  }
  const groq = createGroq({ apiKey });
  return groq(resolveGroqModelId(tier));
}

export function resolveModel(tier: GroqModelTier = "default"): ResolvedLanguageModel {
  if (tier === "vision" && !isGroqVisionConfigured()) {
    return createGeminiLanguageModel();
  }
  const provider = resolveAiProvider();
  if (provider === "gemini") {
    return createGeminiLanguageModel();
  }
  if (provider === "groq") {
    return createGroqLanguageModel(tier);
  }
  throw new Error(
    `AI_PROVIDER="${provider}" is not wired in GROQ-002 (use gemini or groq).`,
  );
}
