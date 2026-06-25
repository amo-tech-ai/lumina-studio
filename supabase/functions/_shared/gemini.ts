import { GoogleGenAI, type GenerateContentResponse } from "npm:@google/genai@2.8.0";

import { getOptionalSecret } from "./env.ts";

/** Default text model for iPix edge functions (IPI-25 / AI-018). */
export const DEFAULT_GEMINI_MODEL = "gemini-3.5-flash";

const KNOWN_MODEL_IDS: string[] = [
  DEFAULT_GEMINI_MODEL,
  "gemini-2.5-flash",
  "gemini-3.1-pro-preview",
];

/**
 * Resolve Gemini model from GEMINI_MODEL secret, else default.
 * Unknown overrides log a warning and fall back to default.
 */
export function resolveGeminiModel(): string {
  const override = getOptionalSecret("GEMINI_MODEL")?.trim() ?? "";
  if (override && !KNOWN_MODEL_IDS.includes(override)) {
    console.warn(
      `GEMINI_MODEL="${override}" not in registry; using ${DEFAULT_GEMINI_MODEL}`,
    );
    return DEFAULT_GEMINI_MODEL;
  }
  return override || DEFAULT_GEMINI_MODEL;
}

function normalizeThinkingLevel(level: "high" | "low"): "HIGH" | "LOW" {
  return level === "high" ? "HIGH" : "LOW";
}

export function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`Gemini timeout after ${ms}ms`)), ms)
    ),
  ]);
}

type GeminiTool =
  | { urlContext: Record<string, never> }
  | { googleSearch: Record<string, never> };

export type GenerateStructuredOptions = {
  apiKey: string;
  contents: string;
  responseSchema: object;
  model?: string;
  tools?: GeminiTool[];
  thinkingLevel?: "high" | "low";
  temperature?: number;
  timeoutMs?: number;
};

/** Structured JSON generation via responseSchema (no urlContext — incompatible with JSON mode). */
export async function generateStructuredContent(
  options: GenerateStructuredOptions,
): Promise<{ response: GenerateContentResponse; text: string; model: string }> {
  const model = options.model ?? resolveGeminiModel();
  const ai = new GoogleGenAI({ apiKey: options.apiKey });

  const config: Record<string, unknown> = {
    responseMimeType: "application/json",
    responseSchema: options.responseSchema,
  };

  if (options.tools?.length) {
    config.tools = options.tools;
  }
  if (options.thinkingLevel) {
    config.thinkingConfig = {
      thinkingLevel: normalizeThinkingLevel(options.thinkingLevel),
    };
  }
  if (options.temperature !== undefined) {
    config.temperature = options.temperature;
  }

  const response = await withTimeout(
    ai.models.generateContent({
      model,
      contents: options.contents,
      config,
    }),
    options.timeoutMs ?? 45_000,
  );

  const text = response.text ?? "";
  if (!text.trim()) {
    throw new Error("Empty structured response from Gemini");
  }

  return { response, text, model };
}

/** Unstructured pass — urlContext + googleSearch (cannot combine with responseSchema). */
export async function generateContextPass(
  options: {
    apiKey: string;
    contents: string;
    model?: string;
    timeoutMs?: number;
  },
): Promise<{ response: GenerateContentResponse; text: string; model: string }> {
  const model = options.model ?? resolveGeminiModel();
  const ai = new GoogleGenAI({ apiKey: options.apiKey });

  const response = await withTimeout(
    ai.models.generateContent({
      model,
      contents: options.contents,
      config: {
        tools: [{ urlContext: {} }, { googleSearch: {} }],
        temperature: 0.2,
      },
    }),
    options.timeoutMs ?? 45_000,
  );

  const text =
    response.text?.trim() ||
    "No textual analysis returned from URL context.";

  return { response, text, model };
}
