import {
  type BrandProfilePayload,
  validateBrandProfilePayload,
} from "../schemas/brand-profile.ts";
import { getOptionalSecret } from "../env.ts";
import {
  resolveAiProvider,
  resolveBiProvider,
  resolveDnaProvider,
  resolveGroqModelId,
} from "./allowlist.ts";
import type { AiProvider, StructuredGenerationScope } from "./types.ts";
import { orderPromptMessages } from "./constraints.ts";
import {
  buildStrictJsonRequest,
  groqStructuredCompletion,
} from "./groq-client.ts";
import {
  generateGeminiStructuredContent,
  resolveGeminiModel,
} from "./gemini-client.ts";
import type {
  StructuredGenerationLog,
  StructuredGenerationOptions,
  StructuredGenerationResult,
} from "./types.ts";

const REPAIR_SUFFIX =
  "\n\nReturn valid JSON only. Include every required field from the schema.";

type ParseJsonResult =
  | { ok: true; value: unknown }
  | { ok: false; error: string };

function parseJson(text: string): ParseJsonResult {
  try {
    return { ok: true, value: JSON.parse(text) };
  } catch (error) {
    const message =
      error instanceof SyntaxError
        ? `Invalid JSON: ${error.message}`
        : "Invalid JSON";
    return { ok: false, error: message };
  }
}

function validatePayload(data: unknown): {
  payload: BrandProfilePayload | null;
  error: string | null;
} {
  if (!data || typeof data !== "object") {
    return { payload: null, error: "Structured payload was not an object" };
  }
  const payload = data as BrandProfilePayload;
  const error = validateBrandProfilePayload(payload);
  return { payload: error ? null : payload, error };
}

function validateParsedText(text: string): {
  payload: BrandProfilePayload | null;
  error: string | null;
} {
  const parsed = parseJson(text);
  if (!parsed.ok) {
    return { payload: null, error: parsed.error };
  }
  return validatePayload(parsed.value);
}

async function generateGeminiStructured<T>(
  options: StructuredGenerationOptions,
): Promise<StructuredGenerationResult<T>> {
  const apiKey = getOptionalSecret("GEMINI_API_KEY");
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured.");
  }

  const contents = [
    orderPromptMessages(options.systemPrompt, options.userContent)
      .map((m) => `${m.role.toUpperCase()}: ${m.content}`)
      .join("\n\n"),
  ].join("\n");

  const result = await generateGeminiStructuredContent({
    apiKey,
    contents,
    responseSchema: options.geminiResponseSchema ?? options.jsonSchema,
    model: resolveGeminiModel(),
    temperature: options.temperature ?? 0.2,
    timeoutMs: options.timeoutMs ?? 45_000,
  });

  let schemaRepairCount = 0;
  let validation = validateParsedText(result.text);

  if (validation.error) {
    schemaRepairCount += 1;
    const repair = await generateGeminiStructuredContent({
      apiKey,
      contents: `${contents}${REPAIR_SUFFIX}`,
      responseSchema: options.geminiResponseSchema ?? options.jsonSchema,
      model: resolveGeminiModel(),
      temperature: 0,
      timeoutMs: options.timeoutMs ?? 45_000,
    });
    validation = validateParsedText(repair.text);
    if (validation.error) {
      throw new Error(validation.error);
    }
  }

  const log: StructuredGenerationLog = {
    provider: "gemini",
    model: result.model,
    schemaRepairCount,
  };

  return {
    data: validation.payload as T,
    text: result.text,
    log,
  };
}

async function generateGroqStructured<T>(
  options: StructuredGenerationOptions,
): Promise<StructuredGenerationResult<T>> {
  const tier = options.tier ?? "structured";
  const model = resolveGroqModelId(tier);
  const request = buildStrictJsonRequest(
    model,
    options.systemPrompt,
    options.userContent,
    options.jsonSchema,
    options.schemaName ?? "response",
    options.maxCompletionTokens ?? 4096,
  );

  let schemaRepairCount = 0;
  let result = await groqStructuredCompletion({
    ...request,
    temperature: options.temperature ?? 0.2,
  });

  let validation = validateParsedText(result.text);

  if (validation.error) {
    schemaRepairCount += 1;
    const repairRequest = buildStrictJsonRequest(
      model,
      options.systemPrompt,
      `${options.userContent}${REPAIR_SUFFIX}`,
      options.jsonSchema,
      options.schemaName ?? "response",
      options.maxCompletionTokens ?? 4096,
    );
    result = await groqStructuredCompletion({
      ...repairRequest,
      temperature: 0,
    });
    validation = validateParsedText(result.text);
    if (validation.error) {
      throw new Error(validation.error);
    }
  }

  const log: StructuredGenerationLog = {
    provider: "groq",
    model: result.model,
    xGroqRequestId: result.xGroqRequestId,
    schemaRepairCount,
    usage: result.usage,
  };

  return {
    data: validation.payload as T,
    text: result.text,
    log,
  };
}

export function resolveStructuredProvider(
  scope: StructuredGenerationScope = "default",
): AiProvider {
  if (scope === "bi") return resolveBiProvider();
  if (scope === "dna") return resolveDnaProvider();
  const provider = resolveAiProvider();
  if (provider === "openai") {
    throw new Error('AI_PROVIDER="openai" is not wired in edge LLM module.');
  }
  return provider;
}

/** Brand-profile validation today; GROQ-003 wires schema selection by caller. */
export async function generateStructuredContent<T>(
  options: StructuredGenerationOptions,
): Promise<StructuredGenerationResult<T>> {
  const provider = resolveStructuredProvider(options.scope);
  if (provider === "gemini") {
    return generateGeminiStructured<T>(options);
  }
  if (provider === "groq") {
    return generateGroqStructured<T>(options);
  }
  throw new Error(`Structured provider "${provider}" is not wired.`);
}

export {
  resolveAiProvider,
  resolveBiProvider,
  resolveDnaProvider,
  resolveGroqModelId,
} from "./allowlist.ts";
