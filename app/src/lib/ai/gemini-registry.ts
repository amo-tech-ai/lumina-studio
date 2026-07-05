import { createGoogleGenerativeAI } from "@ai-sdk/google";

export const GEMINI_MODELS = {
  default: "gemini-3.1-flash-lite",
  pro: "gemini-3.5-flash",
} as const;

const KNOWN_MODEL_IDS: string[] = [GEMINI_MODELS.default, GEMINI_MODELS.pro];

export function resolveGeminiModel(): string {
  const override = process.env.GEMINI_MODEL?.trim() || "";
  if (override && !KNOWN_MODEL_IDS.includes(override)) {
    throw new Error(
      `GEMINI_MODEL="${override}" is not in the registry (${KNOWN_MODEL_IDS.join(", ")}). ` +
        `Add it to app/src/lib/ai/gemini-registry.ts before using it.`,
    );
  }
  return override || GEMINI_MODELS.default;
}

export function resolveProviderOptions() {
  return { google: { thinkingConfig: { thinkingBudget: 0 } } };
}

export function createGeminiLanguageModel() {
  return createGoogleGenerativeAI({
    apiKey: process.env.GEMINI_API_KEY,
  })(resolveGeminiModel());
}
