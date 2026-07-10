import type { ModelTier } from "./types";

/** Default local AI Gateway Worker port (`wrangler dev`). Not Mastra (:4111). */
export const DEFAULT_AI_GATEWAY_URL = "http://localhost:8787";

export type ChatOptions = {
  tier?: ModelTier;
  temperature?: number;
  maxTokens?: number;
};

export type StructuredOptions = ChatOptions & {
  schema: Record<string, unknown>;
  schemaName?: string;
};

export type EmbedOptions = {
  model?: string;
};

export type ChatResult = {
  text: string;
  usage?: { promptTokens: number; completionTokens: number };
};

export type StructuredResult = {
  object: Record<string, unknown>;
  usage?: { promptTokens: number; completionTokens: number };
};

export type EmbedResult = {
  embeddings: number[][];
  usage?: { promptTokens: number };
};

export interface AiProviderAdapter {
  chat(prompt: string, options?: ChatOptions): Promise<ChatResult>;
  chatStream(prompt: string, options?: ChatOptions): ReadableStream<string>;
  structured(prompt: string, options: StructuredOptions): Promise<StructuredResult>;
  embed(inputs: string[], options?: EmbedOptions): Promise<EmbedResult>;
}

export type ProviderAdapterOptions = {
  baseUrl?: string;
  apiKey?: string;
  timeoutMs?: number;
};

function resolveBaseUrl(options: ProviderAdapterOptions): string {
  return options.baseUrl ?? process.env.AI_GATEWAY_URL ?? DEFAULT_AI_GATEWAY_URL;
}

function resolveHeaders(options: ProviderAdapterOptions): Record<string, string> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const apiKey = options.apiKey ?? process.env.AI_GATEWAY_API_KEY;
  if (apiKey) headers["Authorization"] = `Bearer ${apiKey}`;
  return headers;
}

function modelForTier(tier: ModelTier): string {
  const overrides: Record<string, string | undefined> = {
    default: process.env.AI_MODEL_DEFAULT,
    fast: process.env.AI_MODEL_FAST,
    structured: process.env.AI_MODEL_STRUCTURED,
    vision: process.env.AI_MODEL_VISION,
    embedding: process.env.AI_MODEL_EMBEDDING,
  };
  return overrides[tier] ?? "gemini-3.1-flash-lite";
}

function buildMessages(prompt: string) {
  return [{ role: "user" as const, content: prompt }];
}

function withTimeout(timeoutMs: number, signal?: AbortSignal): AbortSignal {
  const controller = new AbortController();
  const timer = setTimeout(
    () => controller.abort(new Error(`Gateway timeout after ${timeoutMs}ms`)),
    timeoutMs,
  );
  if (signal) {
    signal.addEventListener(
      "abort",
      () => {
        clearTimeout(timer);
        controller.abort(signal.reason);
      },
      { once: true },
    );
  }
  controller.signal.addEventListener("abort", () => clearTimeout(timer), { once: true });
  return controller.signal;
}

/** Parses one buffered chunk of `data: {...}` SSE lines, enqueuing any text deltas found. */
function emitSseDeltas(
  buffer: string,
  controller: ReadableStreamDefaultController<string>,
): { remainder: string; done: boolean } {
  const lines = buffer.split("\n");
  const remainder = lines.pop() ?? "";

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || !trimmed.startsWith("data:")) continue;
    const data = trimmed.slice(trimmed.startsWith("data: ") ? 6 : 5);
    if (data === "[DONE]") return { remainder, done: true };

    try {
      const parsed = JSON.parse(data) as { choices?: { delta?: { content?: string } }[] };
      const content = parsed.choices?.[0]?.delta?.content;
      if (content) controller.enqueue(content);
    } catch {
      // skip malformed chunks
    }
  }

  return { remainder, done: false };
}

function parseJsonObject(content: string): Record<string, unknown> {
  const trimmed = content.trim();
  if (!trimmed) return {};
  return JSON.parse(trimmed) as Record<string, unknown>;
}

/**
 * Configurable OpenAI-compatible client for the AI Gateway Worker.
 * IPI-461: runtime entry point. Do not wire into resolveModel() here — that is IPI-454 AC-F.
 */
export function createProviderAdapter(options: ProviderAdapterOptions = {}): AiProviderAdapter {
  const timeoutMs = options.timeoutMs ?? 30_000;

  function baseUrl(): string {
    return resolveBaseUrl(options);
  }

  function headers(): Record<string, string> {
    return resolveHeaders(options);
  }

  return {
    async chat(prompt, opts = {}) {
      const tier = opts.tier ?? "default";
      const response = await fetch(`${baseUrl()}/v1/chat/completions`, {
        method: "POST",
        headers: headers(),
        body: JSON.stringify({
          model: modelForTier(tier),
          messages: buildMessages(prompt),
          temperature: opts.temperature ?? 0.7,
          max_tokens: opts.maxTokens ?? 4096,
        }),
        signal: withTimeout(timeoutMs),
      });

      if (!response.ok) {
        throw new Error(`chat completion failed: ${response.status} ${await response.text()}`);
      }

      const data = (await response.json()) as {
        choices?: { message: { content: string } }[];
        usage?: { prompt_tokens: number; completion_tokens: number };
      };

      return {
        text: data.choices?.[0]?.message?.content ?? "",
        usage: data.usage
          ? { promptTokens: data.usage.prompt_tokens, completionTokens: data.usage.completion_tokens }
          : undefined,
      };
    },

    chatStream(prompt, opts = {}) {
      const tier = opts.tier ?? "default";
      const abortController = new AbortController();
      const timeoutSignal = withTimeout(timeoutMs);
      timeoutSignal.addEventListener(
        "abort",
        () => abortController.abort(timeoutSignal.reason),
        { once: true },
      );

      const body = JSON.stringify({
        model: modelForTier(tier),
        messages: buildMessages(prompt),
        temperature: opts.temperature ?? 0.7,
        max_tokens: opts.maxTokens ?? 4096,
        stream: true,
      });

      return new ReadableStream<string>({
        async start(controller) {
          try {
            const response = await fetch(`${baseUrl()}/v1/chat/completions`, {
              method: "POST",
              headers: headers(),
              body,
              signal: abortController.signal,
            });

            if (!response.ok) {
              throw new Error(`stream failed: ${response.status} ${await response.text()}`);
            }

            const reader = response.body?.getReader();
            if (!reader) throw new Error("No response body for stream");

            const decoder = new TextDecoder();
            let buffer = "";

            while (!abortController.signal.aborted) {
              const { done, value } = await reader.read();
              if (done) break;

              buffer += decoder.decode(value, { stream: true });
              const result = emitSseDeltas(buffer, controller);
              buffer = result.remainder;
              if (result.done) {
                controller.close();
                return;
              }
            }
          } catch (err) {
            if (!abortController.signal.aborted) {
              controller.error(err);
              return;
            }
          }
          if (!abortController.signal.aborted) controller.close();
        },
        cancel() {
          abortController.abort();
        },
      });
    },

    async structured(prompt, opts) {
      const tier = opts.tier ?? "structured";
      const response = await fetch(`${baseUrl()}/v1/chat/completions`, {
        method: "POST",
        headers: headers(),
        body: JSON.stringify({
          model: modelForTier(tier),
          messages: buildMessages(prompt),
          temperature: opts.temperature ?? 0.3,
          max_tokens: opts.maxTokens ?? 4096,
          response_format: { type: "json_object" },
        }),
        signal: withTimeout(timeoutMs),
      });

      if (!response.ok) {
        throw new Error(`structured completion failed: ${response.status} ${await response.text()}`);
      }

      const data = (await response.json()) as {
        choices?: { message: { content: string } }[];
        usage?: { prompt_tokens: number; completion_tokens: number };
      };

      return {
        object: parseJsonObject(data.choices?.[0]?.message?.content ?? ""),
        usage: data.usage
          ? { promptTokens: data.usage.prompt_tokens, completionTokens: data.usage.completion_tokens }
          : undefined,
      };
    },

    async embed(inputs, opts = {}) {
      const model = opts.model ?? modelForTier("embedding");
      const response = await fetch(`${baseUrl()}/v1/embeddings`, {
        method: "POST",
        headers: headers(),
        body: JSON.stringify({ model, input: inputs }),
        signal: withTimeout(timeoutMs),
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
}

/** Env-backed singleton — same contract as createProviderAdapter(). */
export const providerAdapter: AiProviderAdapter = createProviderAdapter();
