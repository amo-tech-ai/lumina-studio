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
  // Worker registry key → Workers AI BGE; never fall back to a Gemini chat model.
  return overrides[tier] ?? (tier === "embedding" ? "embedding" : "gemini-3.1-flash-lite");
}

function buildMessages(prompt: string) {
  return [{ role: "user" as const, content: prompt }];
}

type TimeoutHandle = { signal: AbortSignal; dispose: () => void };

/** AbortSignal that fires after timeoutMs. Call dispose() when the request settles. */
function withTimeout(timeoutMs: number, linked?: AbortSignal): TimeoutHandle {
  const controller = new AbortController();
  const timer = setTimeout(
    () => controller.abort(new Error(`Gateway timeout after ${timeoutMs}ms`)),
    timeoutMs,
  );
  const dispose = () => clearTimeout(timer);
  if (linked) {
    linked.addEventListener(
      "abort",
      () => {
        dispose();
        if (!controller.signal.aborted) controller.abort(linked.reason);
      },
      { once: true },
    );
  }
  controller.signal.addEventListener("abort", dispose, { once: true });
  return { signal: controller.signal, dispose };
}

/** Strip `data:` / `data: ` prefix; null if not an SSE data line. */
function sseDataPayload(line: string): string | null {
  const trimmed = line.trim();
  if (!trimmed.startsWith("data:")) return null;
  return trimmed.slice(trimmed.startsWith("data: ") ? 6 : 5);
}

/** Enqueue delta text from one SSE payload. Returns true on `[DONE]`. */
function enqueueSsePayload(
  data: string,
  controller: ReadableStreamDefaultController<string>,
): boolean {
  if (data === "[DONE]") return true;
  try {
    const parsed = JSON.parse(data) as { choices?: { delta?: { content?: string } }[] };
    const content = parsed.choices?.[0]?.delta?.content;
    if (content) controller.enqueue(content);
  } catch {
    // skip malformed chunks
  }
  return false;
}

/** Parses one buffered chunk of `data: {...}` SSE lines, enqueuing any text deltas found. */
function emitSseDeltas(
  buffer: string,
  controller: ReadableStreamDefaultController<string>,
): { remainder: string; done: boolean } {
  const lines = buffer.split("\n");
  const remainder = lines.pop() ?? "";

  for (const line of lines) {
    const data = sseDataPayload(line);
    if (data === null) continue;
    if (enqueueSsePayload(data, controller)) return { remainder, done: true };
  }

  return { remainder, done: false };
}

function parseJsonObject(content: string): Record<string, unknown> {
  const trimmed = content.trim();
  if (!trimmed) return {};
  return JSON.parse(trimmed) as Record<string, unknown>;
}

type GatewayChatUsage = { prompt_tokens: number; completion_tokens: number };

function mapChatUsage(usage?: GatewayChatUsage): ChatResult["usage"] {
  if (!usage) return undefined;
  return { promptTokens: usage.prompt_tokens, completionTokens: usage.completion_tokens };
}

async function assertOk(response: Response, label: string): Promise<void> {
  if (!response.ok) {
    throw new Error(`${label} failed: ${response.status} ${await response.text()}`);
  }
}

async function readChatResult(response: Response, label: string): Promise<ChatResult> {
  await assertOk(response, label);
  const data = (await response.json()) as {
    choices?: { message: { content: string } }[];
    usage?: GatewayChatUsage;
  };
  return {
    text: data.choices?.[0]?.message?.content ?? "",
    usage: mapChatUsage(data.usage),
  };
}

async function pumpSseStream(
  reader: ReadableStreamDefaultReader<Uint8Array>,
  controller: ReadableStreamDefaultController<string>,
  aborted: () => boolean,
): Promise<"done" | "aborted"> {
  const decoder = new TextDecoder();
  let buffer = "";

  while (!aborted()) {
    const { done, value } = await reader.read();
    if (done) return "done";

    buffer += decoder.decode(value, { stream: true });
    const result = emitSseDeltas(buffer, controller);
    buffer = result.remainder;
    if (result.done) return "done";
  }
  return "aborted";
}

function failStream(
  controller: ReadableStreamDefaultController<string>,
  cancelled: boolean,
  err: unknown,
) {
  if (!cancelled) controller.error(err);
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
      const timeout = withTimeout(timeoutMs);
      try {
        const response = await fetch(`${baseUrl()}/v1/chat/completions`, {
          method: "POST",
          headers: headers(),
          body: JSON.stringify({
            model: modelForTier(tier),
            messages: buildMessages(prompt),
            temperature: opts.temperature ?? 0.7,
            max_tokens: opts.maxTokens ?? 4096,
          }),
          signal: timeout.signal,
        });
        return await readChatResult(response, "chat completion");
      } finally {
        timeout.dispose();
      }
    },

    chatStream(prompt, opts = {}) {
      const tier = opts.tier ?? "default";
      const abortController = new AbortController();
      // Link cancel → clear timeout timer; timeout abort → abort fetch.
      const timeout = withTimeout(timeoutMs, abortController.signal);
      timeout.signal.addEventListener(
        "abort",
        () => {
          if (!abortController.signal.aborted) {
            abortController.abort(timeout.signal.reason);
          }
        },
        { once: true },
      );

      const body = JSON.stringify({
        model: modelForTier(tier),
        messages: buildMessages(prompt),
        temperature: opts.temperature ?? 0.7,
        max_tokens: opts.maxTokens ?? 4096,
        stream: true,
      });

      let consumerCancelled = false;

      async function runStream(controller: ReadableStreamDefaultController<string>) {
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

          const outcome = await pumpSseStream(
            reader,
            controller,
            () => abortController.signal.aborted,
          );
          if (outcome === "done") {
            controller.close();
            return;
          }
          failStream(
            controller,
            consumerCancelled,
            abortController.signal.reason ??
              new Error(`Gateway timeout after ${timeoutMs}ms`),
          );
        } catch (err) {
          failStream(
            controller,
            consumerCancelled,
            abortController.signal.aborted
              ? (abortController.signal.reason ?? err)
              : err,
          );
        } finally {
          timeout.dispose();
        }
      }

      return new ReadableStream<string>({
        start(controller) {
          return runStream(controller);
        },
        cancel() {
          consumerCancelled = true;
          abortController.abort();
        },
      });
    },

    async structured(prompt, opts) {
      const tier = opts.tier ?? "structured";
      const timeout = withTimeout(timeoutMs);
      try {
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
          signal: timeout.signal,
        });

        await assertOk(response, "structured completion");
        const data = (await response.json()) as {
          choices?: { message: { content: string } }[];
          usage?: GatewayChatUsage;
        };

        return {
          object: parseJsonObject(data.choices?.[0]?.message?.content ?? ""),
          usage: mapChatUsage(data.usage),
        };
      } finally {
        timeout.dispose();
      }
    },

    async embed(inputs, opts = {}) {
      const model = opts.model ?? modelForTier("embedding");
      const timeout = withTimeout(timeoutMs);
      try {
        const response = await fetch(`${baseUrl()}/v1/embeddings`, {
          method: "POST",
          headers: headers(),
          body: JSON.stringify({ model, input: inputs }),
          signal: timeout.signal,
        });

        await assertOk(response, "embedding");

        const data = (await response.json()) as {
          data: { embedding: number[] }[];
          usage?: { prompt_tokens: number };
        };

        return {
          embeddings: data.data.map((d) => d.embedding),
          usage: data.usage ? { promptTokens: data.usage.prompt_tokens } : undefined,
        };
      } finally {
        timeout.dispose();
      }
    },
  };
}

/** Env-backed singleton — same contract as createProviderAdapter(). */
export const providerAdapter: AiProviderAdapter = createProviderAdapter();
