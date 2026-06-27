import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
// Gemini model registry for the operator app (IPI2-80 / AI-018, app slice).
// Single source of truth so agents never hardcode model ids and we never ship a
// preview id by accident.
// Default: gemini-3.5-flash (stable GA per https://ai.google.dev/gemini-api/docs/models).
// Override via GEMINI_MODEL env var (add new model IDs to KNOWN_MODEL_IDS).
export const GEMINI_MODELS = {
  default: "gemini-3.5-flash",
} as const;

// Model ids permitted as a GEMINI_MODEL override. The default is always allowed;
// gemini-2.5-flash stays valid for edge-fn parity / fallback. Add new ids here so
// the override isn't a single-entry list that throws on anything but the default.
const KNOWN_MODEL_IDS: string[] = [GEMINI_MODELS.default, "gemini-2.5-flash"];

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

// ponytail: OpenRouter fallback for dev/test when Gemini free-tier quota is exhausted.
// Set OPENROUTER_API_KEY in .env.local — production always uses Gemini.
const OPENROUTER_FREE_MODEL = "google/gemma-4-26b-a4b-it:free";

export function resolveModel() {
  if (process.env.OPENROUTER_API_KEY && process.env.NODE_ENV !== "production") {
    return createOpenAICompatible({
      name: "openrouter",
      baseURL: "https://openrouter.ai/api/v1",
      apiKey: process.env.OPENROUTER_API_KEY,
      headers: { "HTTP-Referer": "https://fashionos.co" },
    })(OPENROUTER_FREE_MODEL);
  }
  return createGoogleGenerativeAI({
    apiKey: process.env.GEMINI_API_KEY,
  })(resolveGeminiModel());
}
