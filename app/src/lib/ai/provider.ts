import { createGroq } from "@ai-sdk/groq";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import groqModelsSsot from "./groq-models.ssot.json";

import {
  createGeminiLanguageModel,
  resolveProviderOptions as resolveGeminiProviderOptions,
} from "./gemini-registry";
import { DEFAULT_AI_GATEWAY_URL } from "./provider-adapter";
import type { AiProvider, GroqModelEntry, GroqModelTier, GroqModelsConfig } from "./types";

/**
 * CF-MIG-210: static JSON bundled for Cloudflare Workers (no runtime readFileSync).
 * Source of truth: `config/groq-models.json` — synced via `scripts/sync-groq-models.mjs` (prebuild).
 */
export function loadGroqModelsConfig(): GroqModelsConfig {
  return groqModelsSsot as GroqModelsConfig;
}

type ResolvedLanguageModel =
  | ReturnType<typeof createGeminiLanguageModel>
  | ReturnType<ReturnType<typeof createOpenAICompatible>["chatModel"]>;

/** Rollback flag for Mastra → gateway cutover (IPI-454 AC-F). Default = legacy direct SDKs. */
export type AiRoutingMode = "direct" | "gateway";

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

const VALID_PROVIDERS = ["gemini", "groq", "openai", "workers-ai", "nvidia", "openai-compatible", "mock"] as const satisfies readonly AiProvider[];

export function resolveAiProvider(): AiProvider {
  const raw = (process.env.AI_PROVIDER ?? "gemini").trim().toLowerCase();
  if ((VALID_PROVIDERS as readonly string[]).includes(raw)) return raw as AiProvider;
  throw new Error(
    `AI_PROVIDER="${raw}" is invalid (expected ${VALID_PROVIDERS.join(" | ")}).`,
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

export function resolveAiRoutingMode(): AiRoutingMode {
  const raw = (process.env.AI_ROUTING_MODE ?? "direct").trim().toLowerCase();
  if (raw === "gateway") return "gateway";
  if (raw === "direct" || raw === "") return "direct";
  throw new Error(
    `AI_ROUTING_MODE="${raw}" is invalid (expected direct | gateway).`,
  );
}

/** Worker `model-registry` tier keys — `resolveModelEntry(model)` misses fall back to `default`. */
const WORKER_REGISTRY_KEYS = new Set([
  "default",
  "fast",
  "structured",
  "vision",
  "embedding",
]);

/**
 * Model id sent to the AI Gateway Worker (OpenAI-compat `model` field).
 * Must be a Worker registry tier key — not a Gemini/Groq provider model id.
 */
export function resolveGatewayModelId(tier: GroqModelTier = "default"): string {
  const overrides: Partial<Record<string, string | undefined>> = {
    default: process.env.AI_MODEL_DEFAULT,
    fast: process.env.AI_MODEL_FAST,
    structured: process.env.AI_MODEL_STRUCTURED,
    vision: process.env.AI_MODEL_VISION,
  };
  const override = overrides[tier]?.trim();
  if (override && WORKER_REGISTRY_KEYS.has(override)) return override;

  if (tier === "structuredHeavy") return "structured";
  if (WORKER_REGISTRY_KEYS.has(tier)) return tier;

  // Never silently remap compound/stt/safety/… onto Worker "default".
  throw new Error(
    `Tier "${tier}" is not a Worker registry chat key — keep AI_ROUTING_MODE=direct for this tier.`,
  );
}

/**
 * Whether this tier may use the OpenAI-compat Worker under AI_ROUTING_MODE=gateway.
 * Allowlist only — Worker chat is text-only (no ImageParts, no OpenAI `tools`).
 * Specialized Groq tiers (compound/stt/safety/…) must stay on direct SDKs.
 */
export function shouldRouteTierViaGateway(tier: GroqModelTier): boolean {
  if (resolveAiRoutingMode() !== "gateway") return false;

  // Tool-free marketing path — only Worker-safe text tier in production gateway mode.
  if (tier === "fast") return true;

  // Tool-bearing Mastra agents — opt in only after a Worker tool bridge exists.
  if (
    (tier === "default" || tier === "structured" || tier === "structuredHeavy") &&
    process.env.AI_GATEWAY_ALLOW_TOOL_TIERS === "1"
  ) {
    return true;
  }

  return false;
}

function createGatewayLanguageModel(tier: GroqModelTier): ResolvedLanguageModel {
  const base = (process.env.AI_GATEWAY_URL ?? DEFAULT_AI_GATEWAY_URL).replace(/\/$/, "");
  const apiKey = process.env.AI_GATEWAY_API_KEY?.trim();
  // Optional locally; set AI_GATEWAY_API_KEY when the Worker requires Bearer auth.
  // Do NOT mint x-request-id here — createOpenAICompatible freezes headers for the
  // process lifetime (agents call resolveModel() at module load). Optional sticky
  // override for tests only; production correlation belongs on the Worker / fetch layer.
  const requestId = process.env.AI_GATEWAY_REQUEST_ID?.trim();
  const gateway = createOpenAICompatible({
    name: "ipix-ai-gateway",
    baseURL: `${base}/v1`,
    ...(apiKey ? { apiKey } : {}),
    headers: {
      ...(requestId ? { "x-request-id": requestId } : {}),
      "x-ipix-routing": "gateway",
    },
  });
  return gateway.chatModel(resolveGatewayModelId(tier));
}

export function resolveProviderOptions() {
  // Gemini thinkingBudget applies to direct @ai-sdk/google models only.
  // Gateway openai-compatible clients ignore these options; safe to return for mixed routing
  // (tool/vision tiers stay direct even when AI_ROUTING_MODE=gateway).
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
  // IPI-454 AC-F: Mastra agents keep calling resolveModel(); flip AI_ROUTING_MODE=gateway
  // for Worker-safe tiers (see shouldRouteTierViaGateway). Vision + tool tiers stay direct.
  if (shouldRouteTierViaGateway(tier)) {
    return createGatewayLanguageModel(tier);
  }

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
    `AI_PROVIDER="${provider}" is not wired for AI_ROUTING_MODE=direct (use gemini or groq). ` +
      `Set AI_ROUTING_MODE=gateway to use @ai-sdk/openai-compatible → AI_GATEWAY_URL, ` +
      `or use createProviderAdapter() for non-Mastra REST (IPI-454).`,
  );
}
