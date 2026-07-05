import type { GroqModelsConfig } from "./types.ts";

import groqModelsJson from "../../../../config/groq-models.json" with {
  type: "json",
};

export const groqModelsConfig = groqModelsJson as GroqModelsConfig;

const MODEL_BY_ID = new Map(
  groqModelsConfig.models.map((entry) => [entry.id, entry] as const),
);

export function getGroqModelEntry(modelId: string) {
  return MODEL_BY_ID.get(modelId);
}

export function resolveGroqModelId(
  tier: keyof GroqModelsConfig["defaults"] = "default",
): string {
  const envKey = groqModelsConfig.envMapping[tier];
  const fromEnv = envKey ? Deno.env.get(envKey)?.trim() : "";
  const fallback = groqModelsConfig.defaults[tier]?.trim() ?? "";
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

export function resolveAiProvider(): "gemini" | "groq" | "openai" {
  const raw = (Deno.env.get("AI_PROVIDER") ?? "gemini").trim().toLowerCase();
  if (raw === "gemini" || raw === "groq" || raw === "openai") return raw;
  throw new Error(
    `AI_PROVIDER="${raw}" is invalid (expected gemini | groq | openai).`,
  );
}
