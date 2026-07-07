import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import type { LanguageModelV1 } from "@ai-sdk/provider";
import type { AiProvider } from "./types";

export type ModelTier = "default" | "fast" | "structured" | "vision" | "embedding";

export type ChatOptions = {
  tier?: ModelTier;
  temperature?: number;
  maxTokens?: number;
};

export type StructuredOptions<T> = ChatOptions & {
  schema: T;
  schemaName?: string;
};

export type EmbedOptions = {
  model?: string;
};

export type ChatResult = {
  text: string;
  usage?: { promptTokens: number; completionTokens: number };
};

export type StructuredResult<T> = {
  object: T;
  usage?: { promptTokens: number; completionTokens: number };
};

export type EmbedResult = {
  embeddings: number[][];
  usage?: { promptTokens: number };
};

export interface AiProviderAdapter {
  chat(prompt: string, options?: ChatOptions): Promise<ChatResult>;
  chatStream(prompt: string, options?: ChatOptions): ReadableStream<string>;
  structured<T>(prompt: string, options: StructuredOptions<T>): Promise<StructuredResult<T>>;
  embed(inputs: string[], options?: EmbedOptions): Promise<EmbedResult>;
}

const GATEWAY_BASE_URL = process.env.AI_GATEWAY_URL ?? "http://localhost:4111";

function endpointForTier(tier: ModelTier): string {
  return `${GATEWAY_BASE_URL}/v1/chat/completions`;
}

function modelIdForTier(tier: ModelTier): string {
  const overrides: Record<string, string | undefined> = {
    default: process.env.AI_MODEL_DEFAULT,
    fast: process.env.AI_MODEL_FAST,
    structured: process.env.AI_MODEL_STRUCTURED,
    vision: process.env.AI_MODEL_VISION,
    embedding: process.env.AI_MODEL_EMBEDDING,
  };
  return overrides[tier] ?? "gemini-3.1-flash-lite";
}

function createModel(tier: ModelTier): LanguageModelV1 {
  const provider = createOpenAICompatible({
    name: "ai-gateway",
    baseURL: endpointForTier(tier),
    apiKey: process.env.AI_GATEWAY_API_KEY ?? "",
  });
  return provider.chatModel(modelIdForTier(tier));
}

export const providerAdapter: AiProviderAdapter = {
  async chat(prompt, options = {}) {
    const tier = options.tier ?? "default";
    const model = createModel(tier);
    const result = await model.doGenerate({
      prompt: [{ role: "user", content: [{ type: "text", text: prompt }] }],
      inputFormat: "messages",
      mode: { type: "regular" },
      temperature: options.temperature ?? 0.7,
      maxTokens: options.maxTokens ?? 4096,
    });
    const text = result.text ?? "";
    return {
      text,
      usage: result.usage
        ? { promptTokens: result.usage.promptTokens, completionTokens: result.usage.completionTokens }
        : undefined,
    };
  },

  chatStream(prompt, options = {}) {
    const tier = options.tier ?? "default";
    const model = createModel(tier);
    const encoder = new TextEncoder();
    let cancelled = false;

    return new ReadableStream({
      async start(controller) {
        try {
          const result = await model.doStream({
            prompt: [{ role: "user", content: [{ type: "text", text: prompt }] }],
            inputFormat: "messages",
            mode: { type: "regular" },
            temperature: options.temperature ?? 0.7,
            maxTokens: options.maxTokens ?? 4096,
          });
          for await (const chunk of result.stream) {
            if (cancelled) break;
            if (chunk.type === "text-delta" && chunk.textDelta) {
              controller.enqueue(encoder.encode(chunk.textDelta));
            }
          }
        } catch (err) {
          if (!cancelled) controller.error(err);
        }
        if (!cancelled) controller.close();
      },
      cancel() {
        cancelled = true;
      },
    }) as ReadableStream<string>;
  },

  async structured(prompt, options) {
    const tier = options.tier ?? "structured";
    const model = createModel(tier);
    const result = await model.doGenerate({
      prompt: [{ role: "user", content: [{ type: "text", text: prompt }] }],
      inputFormat: "messages",
      mode: {
        type: "object-json",
        schema: options.schema as Record<string, unknown>,
        name: options.schemaName ?? "response",
      },
      temperature: options.temperature ?? 0.3,
      maxTokens: options.maxTokens ?? 4096,
    });
    const text = result.text ?? "{}";
    return {
      object: JSON.parse(text) as T,
      usage: result.usage
        ? { promptTokens: result.usage.promptTokens, completionTokens: result.usage.completionTokens }
        : undefined,
    };
  },

  async embed(inputs) {
    const baseURL = process.env.AI_GATEWAY_URL ?? "http://localhost:4111";
    const apiKey = process.env.AI_GATEWAY_API_KEY ?? "";
    const model = process.env.AI_MODEL_EMBEDDING ?? "bge-base-en-v1.5";

    const response = await fetch(`${baseURL}/v1/embeddings`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ model, input: inputs }),
    });

    if (!response.ok) {
      throw new Error(`embedding failed: ${response.status} ${await response.text()}`);
    }

    const data = (await response.json()) as {
      data: { embedding: number[] }[];
      usage?: { prompt_tokens: number };
    };

    return {
      embeddings: data.data.map((d) => d.embedding),
      usage: data.usage ? { promptTokens: data.usage.prompt_tokens } : undefined,
    };
  },
};
