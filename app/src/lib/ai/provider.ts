import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  createGeminiLanguageModel,
  resolveProviderOptions as resolveGeminiProviderOptions,
} from "./gemini-registry";
import type { AiProvider, GroqModelEntry, GroqModelTier, GroqModelsConfig } from "./types";

const MODULE_DIR = dirname(fileURLToPath(import.meta.url));

/**
 * Repo SSOT at config/groq-models.json — loaded at runtime (not a static import)
 * to stay outside Turbopack's app/ root boundary. Resolved relative to this
 * module's own location (not process.cwd()) so it's correct regardless of the
 * directory the process was launched from.
 */
export function loadGroqModelsConfig(): GroqModelsConfig {
  const path = join(MODULE_DIR, "..", "..", "..", "..", "config", "groq-models.json");
  try {
    return JSON.parse(readFileSync(path, "utf8")) as GroqModelsConfig;
  } catch (error) {
    throw new Error(
      `Failed to load Groq models SSOT allowlist from "${path}" (expected config/groq-models.json at repo root): ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }
}

type ResolvedLanguageModel = ReturnType<typeof createGeminiLanguageModel>;

export type { AiProvider, GroqModelTier } from "./types";
export {
  GEMINI_MODELS,
  resolveGeminiModel,
} from "./gemini-registry";

const groqModels = loadGroqModelsConfig();

const MODEL_BY_ID = new Map(
  groqModels.models.map((entry) => [entry.id, entry] as const),
);

export function resolveAiProvider(): AiProvider {
  const raw = (process.env.AI_PROVIDER ?? "gemini").trim().toLowerCase();
  if (raw === "gemini" || raw === "groq" || raw === "openai") return raw;
  throw new Error(
    `AI_PROVIDER="${raw}" is invalid (expected gemini | groq | openai).`,
  );
}

/** Alias for groq-plan naming. */
export const resolveProvider = resolveAiProvider;

export function getGroqModelEntry(modelId: string): GroqModelEntry | undefined {
  return MODEL_BY_ID.get(modelId);
}

export function resolveGroqModelId(tier: GroqModelTier = "default"): string {
  const envKey = groqModels.envMapping[tier];
  const fromEnv = envKey ? process.env[envKey]?.trim() : "";
  const fallback = groqModels.defaults[tier]?.trim() ?? "";
  const modelId = fromEnv || fallback;
  if (!modelId) {
    throw new Error(`No Groq model configured for tier "${tier}".`);
  }
  if (!MODEL_BY_ID.has(modelId)) {
    throw new Error(
      `Groq model "${modelId}" is not in config/groq-models.json allowlist.`,
    );
  }
  return modelId;
}

/** True when a Groq vision model is configured (env override or SSOT default). */
function isGroqVisionConfigured(): boolean {
  const envKey = groqModels.envMapping.vision;
  const fromEnv = envKey ? process.env[envKey]?.trim() : "";
  const fallback = groqModels.defaults.vision?.trim() ?? "";
  return Boolean(fromEnv || fallback);
}

/**
 * Provider options for the active model. Gemini's thinkingBudget hack only
 * applies to Gemini — Groq has no equivalent today, so omit rather than send
 * a Gemini-shaped options object the Groq provider would just ignore.
 */
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

// Lazy require keeps Gemini-only deploys from failing when @ai-sdk/groq is unused.
function createGroqLanguageModel(tier: GroqModelTier): ResolvedLanguageModel {
  const apiKey = process.env.GROQ_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("GROQ_API_KEY is required when AI_PROVIDER=groq.");
  }

  let createGroq: typeof import("@ai-sdk/groq").createGroq;
  try {
    ({ createGroq } = require("@ai-sdk/groq"));
  } catch {
    throw new Error(
      "@ai-sdk/groq is not installed. Run `npm install` in app/ (see package.json).",
    );
  }

  const groq = createGroq({ apiKey });
  return groq(resolveGroqModelId(tier));
}

export function resolveModel(tier: GroqModelTier = "default"): ResolvedLanguageModel {
  // Vision stays on Gemini until GROQ_MODEL_VISION is set (golden eval gate) —
  // forced regardless of AI_PROVIDER so a global groq cutover can't silently
  // break vision extraction.
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
