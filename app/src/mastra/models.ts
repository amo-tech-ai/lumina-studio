import { createGoogleGenerativeAI } from "@ai-sdk/google";
// Gemini model registry for the operator app (IPI2-80 / AI-018, app slice).
// Single source of truth so agents never hardcode model ids and we never ship a
// preview id by accident.
// Default: gemini-3.5-flash (stable GA per https://ai.google.dev/gemini-api/docs/models).
// Override via GEMINI_MODEL env var (add new model IDs to KNOWN_MODEL_IDS).
export const GEMINI_MODELS = {
  default: "gemini-2.5-flash",
} as const;

const KNOWN_MODEL_IDS: string[] = [GEMINI_MODELS.default, "gemini-2.5-flash-lite"];

// Env override so the live model swaps via one config, not code edits.
// Treat empty/whitespace as unset and fall back to default.
// Validated against the registry so a typo fails fast instead of hitting Gemini
// with a bogus id at request time.
export function resolveGeminiModel(): string {
  const override = process.env.GEMINI_MODEL?.trim() || "";
  if (override && !KNOWN_MODEL_IDS.includes(override)) {
    throw new Error(
      `GEMINI_MODEL="${override}" is not in the registry (${KNOWN_MODEL_IDS.join(", ")}). ` +
        `Add it to app/src/mastra/models.ts before using it.`,
    );
  }
  return override || GEMINI_MODELS.default;
}

// Gemini needs thinkingBudget:0 to prevent reasoning tokens from eating the output budget.
export function resolveProviderOptions() {
  return { google: { thinkingConfig: { thinkingBudget: 0 } } };
}

export function resolveModel() {
  return createGoogleGenerativeAI({
    apiKey: process.env.GEMINI_API_KEY,
  })(resolveGeminiModel());
}
