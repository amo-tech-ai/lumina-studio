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

/** Stable gateway error codes (must match Worker `gateway-errors.ts`). */
export type AiGatewayErrorCode =
  | "invalid_request"
  | "unsupported_embedding_model"
  | "provider_rate_limited"
  | "provider_timeout"
  | "provider_unavailable"
  | "provider_error"
  | "internal_error";

export type AiGatewayErrorBody = {
  code: AiGatewayErrorCode | string;
  message: string;
  providerStatus?: number;
  retryable?: boolean;
  requestId?: string;
};

/** Typed error from AI Gateway — prefer over raw `Error` for embed/chat failures. */
export class AiGatewayError extends Error {
  readonly code: string;
  readonly httpStatus: number;
  readonly providerStatus?: number;
  readonly retryable: boolean;
  readonly requestId?: string;

  constructor(
    message: string,
    opts: {
      code: string;
      httpStatus: number;
      providerStatus?: number;
      retryable?: boolean;
      requestId?: string;
    },
  ) {
    super(message);
    this.name = "AiGatewayError";
    this.code = opts.code;
    this.httpStatus = opts.httpStatus;
    this.providerStatus = opts.providerStatus;
    this.retryable = opts.retryable ?? false;
    this.requestId = opts.requestId;
  }
}

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

async function throwGatewayFailure(response: Response, label: string): Promise<never> {
  const raw = await response.text();
  let parsed: { error?: AiGatewayErrorBody | string } | null = null;
  try {
    parsed = JSON.parse(raw) as { error?: AiGatewayErrorBody | string };
  } catch {
    // non-JSON body
  }

  const envelope = parsed?.error;
  if (envelope && typeof envelope === "object" && typeof envelope.message === "string") {
    throw new AiGatewayError(envelope.message, {
      code: envelope.code ?? "provider_error",
      httpStatus: response.status,
      providerStatus: envelope.providerStatus,
      retryable: envelope.retryable,
      requestId: envelope.requestId,
    });
  }

  const flat =
    typeof envelope === "string"
      ? envelope
      : raw || response.statusText || "request failed";
  throw new AiGatewayError(`${label} failed: ${response.status} ${flat}`, {
    code: "provider_error",
    httpStatus: response.status,
  });
}

async function assertOk(response: Response, label: string): Promise<void> {
  if (!response.ok) {
    await throwGatewayFailure(response, label);
  }
}

/**
 * Defense-in-depth cap on JSON response bodies (GHSA-866g-f22w-33x8, IPI-762: uncontrolled
 * resource consumption in JSON response parsing). `withTimeout` above bounds request *time*;
 * this bounds response *size* before it's buffered into a JSON parse.
 *
 * A Content-Length header check alone is NOT sufficient: `Response.json()` (used by this
 * app's own AI Gateway Worker for chat/structured/embed replies) never sets Content-Length
 * (confirmed: `Response.json({...}).headers.get("content-length")` is `null` in this
 * runtime), so a header-only guard silently passes every response on the exact path it's
 * meant to protect. This reads the body stream with a running byte counter instead, so the
 * limit is enforced regardless of whether the server declared a length upfront.
 */
const MAX_RESPONSE_BYTES = 10 * 1024 * 1024; // 10MB — comfortably above real chat/embedding payloads

async function readJsonWithSizeLimit<T>(response: Response, label: string): Promise<T> {
  const declaredLength = Number(response.headers?.get("content-length"));
  if (declaredLength > MAX_RESPONSE_BYTES) {
    throw new AiGatewayError(
      `${label} response too large: ${declaredLength} bytes exceeds ${MAX_RESPONSE_BYTES} byte limit`,
      { code: "provider_error", httpStatus: response.status },
    );
  }
  if (!response.body) {
    return (await response.json()) as T;
  }

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > MAX_RESPONSE_BYTES) {
        throw new AiGatewayError(
          `${label} response exceeded ${MAX_RESPONSE_BYTES} byte limit while streaming`,
          { code: "provider_error", httpStatus: response.status },
        );
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }

  const body = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return JSON.parse(new TextDecoder().decode(body)) as T;
}

async function readChatResult(response: Response, label: string): Promise<ChatResult> {
  await assertOk(response, label);
  const data = await readJsonWithSizeLimit<{
    choices?: { message: { content: string } }[];
    usage?: GatewayChatUsage;
  }>(response, label);
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
 * IPI-461: runtime entry point for non-Mastra REST (chat/structured/embed/health).
 * Mastra agents use resolveModel() — set AI_ROUTING_MODE=gateway for IPI-454 AC-F.
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
            await throwGatewayFailure(response, "stream");
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
        const data = await readJsonWithSizeLimit<{
          choices?: { message: { content: string } }[];
          usage?: GatewayChatUsage;
        }>(response, "structured completion");

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
        const data = await readJsonWithSizeLimit<{
          data: { embedding: number[] }[];
          usage?: { prompt_tokens: number };
        }>(response, "embedding");

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
