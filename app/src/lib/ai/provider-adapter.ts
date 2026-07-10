import type { ModelTier } from "./types";

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

const GATEWAY_BASE_URL = process.env.AI_GATEWAY_URL ?? "http://localhost:4111";

function gatewayHeaders(): Record<string, string> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const apiKey = process.env.AI_GATEWAY_API_KEY;
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
  return [{ role: "user", content: prompt }];
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
    if (!trimmed || !trimmed.startsWith("data: ")) continue;
    const data = trimmed.slice(6);
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

async function chatCompletion(
  prompt: string,
  options: ChatOptions,
): Promise<{ text: string; usage?: { promptTokens: number; completionTokens: number } }> {
  const tier = options.tier ?? "default";
  const response = await fetch(`${GATEWAY_BASE_URL}/v1/chat/completions`, {
    method: "POST",
    headers: gatewayHeaders(),
    body: JSON.stringify({
      model: modelForTier(tier),
      messages: buildMessages(prompt),
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxTokens ?? 4096,
    }),
  });

  if (!response.ok) {
    throw new Error(`chat completion failed: ${response.status} ${await response.text()}`);
  }

  const data = (await response.json()) as {
    choices: { message: { content: string } }[];
    usage?: { prompt_tokens: number; completion_tokens: number };
  };

  return {
    text: data.choices[0]?.message?.content ?? "",
    usage: data.usage
      ? { promptTokens: data.usage.prompt_tokens, completionTokens: data.usage.completion_tokens }
      : undefined,
  };
}

export const providerAdapter: AiProviderAdapter = {
  async chat(prompt, options = {}) {
    return chatCompletion(prompt, options);
  },

  chatStream(prompt, options = {}) {
    const tier = options.tier ?? "default";
    const abortController = new AbortController();

    const body = JSON.stringify({
      model: modelForTier(tier),
      messages: buildMessages(prompt),
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxTokens ?? 4096,
      stream: true,
    });

    return new ReadableStream<string>({
      async start(controller) {
        try {
          const response = await fetch(`${GATEWAY_BASE_URL}/v1/chat/completions`, {
            method: "POST",
            headers: gatewayHeaders(),
            body,
            signal: abortController.signal,
          });

          if (!response.ok) {
            throw new Error(`stream failed: ${response.status}`);
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
          if (!abortController.signal.aborted) controller.error(err);
        }
        if (!abortController.signal.aborted) controller.close();
      },
      cancel() {
        abortController.abort();
      },
    });
  },

  async structured(prompt, options) {
    const tier = options.tier ?? "structured";
    const response = await fetch(`${GATEWAY_BASE_URL}/v1/chat/completions`, {
      method: "POST",
      headers: gatewayHeaders(),
      body: JSON.stringify({
        model: modelForTier(tier),
        messages: buildMessages(prompt),
        temperature: options.temperature ?? 0.3,
        max_tokens: options.maxTokens ?? 4096,
        response_format: { type: "json_object", schema: options.schema },
      }),
    });

    if (!response.ok) {
      throw new Error(`structured completion failed: ${response.status} ${await response.text()}`);
    }

    const data = (await response.json()) as {
      choices: { message: { content: string } }[];
      usage?: { prompt_tokens: number; completion_tokens: number };
    };

    return {
      object: JSON.parse(data.choices[0]?.message?.content ?? "{}"),
      usage: data.usage
        ? { promptTokens: data.usage.prompt_tokens, completionTokens: data.usage.completion_tokens }
        : undefined,
    };
  },

  async embed(inputs, options) {
    const model = options?.model ?? modelForTier("embedding");
    const response = await fetch(`${GATEWAY_BASE_URL}/v1/embeddings`, {
      method: "POST",
      headers: gatewayHeaders(),
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
