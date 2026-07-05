import groqModelsJson from "../../../../config/groq-models.json";
import {
  createGeminiLanguageModel,
} from "./gemini-registry";
import type { AiProvider, GroqModelEntry, GroqModelTier, GroqModelsConfig } from "./types";

export type { AiProvider, GroqModelTier } from "./types";
export {
  GEMINI_MODELS,
  resolveGeminiModel,
  resolveProviderOptions,
} from "./gemini-registry";

const groqModels = groqModelsJson as GroqModelsConfig;

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

function createGroqLanguageModel(
  tier: GroqModelTier,
): ReturnType<typeof createGeminiLanguageModel> {
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

export function resolveModel(
  tier: GroqModelTier = "default",
): ReturnType<typeof createGeminiLanguageModel> {
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
