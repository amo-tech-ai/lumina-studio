import { resolveModelEntry, type ModelRegistry } from "./model-registry";
import {
  gatewayErrorResponse,
  mapProviderFailure,
  newRequestId,
} from "./gateway-errors";
import {
  resolveEmbeddingEntry,
  validateEmbeddingInput,
} from "./embed-validation";
import { geminiProvider } from "./providers/gemini";
import { workersAiProvider } from "./providers/workers-ai";
import { bedrockProvider } from "./providers/bedrock";
import { isRetryableProviderError } from "./providers/retry-classifier";
import {
  type AiProvider,
  type ChatCompletionRequest,
  type EmbeddingRequest,
  type ProviderConfig,
} from "./providers/provider";

export interface Env {
  GEMINI_API_KEY?: string;
  NVIDIA_API_KEY?: string;
  CLOUDFLARE_API_TOKEN?: string;
  CLOUDFLARE_ACCOUNT_ID?: string;
  MODEL_REGISTRY_OVERRIDE?: string;
  AI_GATEWAY_URL?: string;
  AI_GATEWAY_AUTH_TOKEN?: string;
  AI_GATEWAY_ALLOW_UNAUTHENTICATED?: string;
  AWS_BEDROCK_API_KEY?: string;
  AWS_BEDROCK_BASE_URL?: string;
  AWS_REGION?: string;
}

function getProvider(name: string): AiProvider {
  switch (name) {
    case "gemini":
      return geminiProvider;
    case "workers-ai":
      return workersAiProvider;
    case "bedrock":
      return bedrockProvider;
    default:
      throw new Error(`Unknown provider: ${name}`);
  }
}

function getProviderConfig(provider: string, env: Env): ProviderConfig {
  switch (provider) {
    case "gemini":
      return { apiKey: env.GEMINI_API_KEY ?? "", baseUrl: "https://generativelanguage.googleapis.com" };
    case "workers-ai":
      return {
        apiKey: env.CLOUDFLARE_API_TOKEN ?? "",
        accountId: env.CLOUDFLARE_ACCOUNT_ID ?? "",
        baseUrl: env.AI_GATEWAY_URL ?? "https://api.cloudflare.com/client/v4",
      };
    case "bedrock":
      return {
        apiKey: env.AWS_BEDROCK_API_KEY ?? "",
        baseUrl: env.AWS_BEDROCK_BASE_URL ?? "",
        region: env.AWS_REGION,
      };
    default:
      throw new Error(`No config for provider: ${provider}`);
  }
}

function registryOverride(env: Env): ModelRegistry | undefined {
  if (!env.MODEL_REGISTRY_OVERRIDE) return undefined;
  try {
    return JSON.parse(env.MODEL_REGISTRY_OVERRIDE) as ModelRegistry;
  } catch {
    // Invalid JSON — fall back to default registry (do not 500 the request).
    return undefined;
  }
}

function verifyBearerToken(request: Request, env: Env): { valid: boolean; message?: string } {
  const authHeader = request.headers.get("Authorization");
  const isLocalDev = env.AI_GATEWAY_ALLOW_UNAUTHENTICATED === "true";

  // Fail closed: if token is not configured, reject unless explicitly in local-dev mode
  if (!env.AI_GATEWAY_AUTH_TOKEN) {
    if (isLocalDev) {
      return { valid: true };
    }
    // Production: missing secret is a configuration error, block the request
    return { valid: false, message: "Gateway authentication is not configured" };
  }

  // Token is configured — require valid bearer token
  if (!authHeader) {
    return { valid: false, message: "Missing Authorization header" };
  }

  const match = authHeader.match(/^Bearer\s+(.*)$/i);
  if (!match) {
    return { valid: false, message: "Invalid Authorization header format (expected: Bearer <token>)" };
  }

  const token = match[1];
  if (!token || token.trim() === "") {
    return { valid: false, message: "Bearer token cannot be empty" };
  }

  // Trim whitespace before comparison (HTTP headers may have insignificant trailing spaces)
  const trimmedToken = token.trim();
  if (trimmedToken !== env.AI_GATEWAY_AUTH_TOKEN) {
    return { valid: false, message: "Unauthorized" };
  }

  return { valid: true };
}

function selectProvider(model: string, env: Env): {
  provider: AiProvider;
  config: ProviderConfig;
  entry: NonNullable<ReturnType<typeof resolveModelEntry>>;
} {
  const tier = registryOverride(env);
  const entry = resolveModelEntry(model, tier) ?? resolveModelEntry("default", tier);

  if (!entry) {
    throw new Error(`No model entry found for tier "${model}" and no default fallback`);
  }

  const provider = getProvider(entry.provider);
  const config = getProviderConfig(entry.provider, env);
  return { provider, config, entry };
}

/**
 * Handle chat completions with automatic fallback.
 *
 * Flow:
 * 1. Try primary provider (model registry tier)
 * 2. If error is retryable (429, 5xx, timeout, connection error):
 *    - Try fallback provider ("default-fallback" tier)
 *    - Add X-Fallback-Provider header on success
 * 3. If error is non-retryable (auth, validation): fail fast
 *
 * Observability: All calls logged with requestId, provider, model, latency, tool events.
 */
export async function handleChat(
  req: ChatCompletionRequest,
  env: Env,
): Promise<Response> {
  const { provider, config, entry } = selectProvider(req.model, env);
  const registry = registryOverride(env);
  const requestId = newRequestId();
  const startTime = Date.now();

  console.log(`[gateway] chat request started`, {
    requestId,
    provider: entry.provider,
    model: entry.model,
    stream: req.stream,
    hasTools: !!req.tools && req.tools.length > 0,
    toolCount: req.tools?.length ?? 0,
  });

  try {
    if (req.stream) {
      const response = await provider.chatStream(
        { ...req, model: entry.model },
        config,
      );
      const latency = Date.now() - startTime;
      console.log(`[gateway] stream response succeeded`, {
        requestId,
        provider: entry.provider,
        model: entry.model,
        latencyMs: latency,
      });
      return new Response(response.body, {
        status: response.status,
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          "Connection": "keep-alive",
          "X-Request-Id": requestId,
        },
      });
    }

    const result = await provider.chat({ ...req, model: entry.model }, config);
    const latency = Date.now() - startTime;

    const hasToolCalls = (result.choices[0]?.message?.tool_calls?.length ?? 0) > 0;
    console.log(`[gateway] chat response succeeded`, {
      requestId,
      provider: entry.provider,
      latencyMs: latency,
      finishReason: result.choices[0]?.finish_reason,
      hasToolCalls,
      toolCallCount: result.choices[0]?.message?.tool_calls?.length ?? 0,
    });

    return Response.json(result, {
      headers: { "Content-Type": "application/json", "X-Request-Id": requestId },
    });
  } catch (err) {
    const latency = Date.now() - startTime;
    const errorMessage = err instanceof Error ? err.message : String(err);

    // Determine status code based on error classification
    const isClientError = errorMessage.includes("does not support") ||
                          errorMessage.includes("Invalid model") ||
                          errorMessage.includes("Invalid parameter") ||
                          errorMessage.includes("missing required") ||
                          errorMessage.includes("missing field");
    const errorStatus = isClientError ? 400 : 502;

    // Primary provider failed — check if error is retryable
    if (!isRetryableProviderError(err)) {
      // Non-retryable error (auth, validation, etc.) — fail fast
      console.log(`[gateway] non-retryable error from primary provider`, {
        requestId,
        provider: entry.provider,
        latencyMs: latency,
        errorMessage,
        status: errorStatus,
      });
      return Response.json({ error: errorMessage }, { status: errorStatus });
    }

    // Retryable error (429, 5xx, timeout) — try Bedrock fallback
    console.log(`[gateway] retryable error from primary provider, attempting fallback`, {
      requestId,
      provider: entry.provider,
      latencyMs: latency,
      errorMessage,
      fallbackReason: err instanceof Error && err.message.includes("429") ? "rate-limit"
        : err instanceof Error && err.message.match(/5\d{2}/) ? "server-error"
        : "network-error",
    });

    try {
      const fallbackEntry = resolveModelEntry("default-fallback", registry);
      if (!fallbackEntry || fallbackEntry.provider === entry.provider) {
        // No fallback configured or fallback is same as primary
        console.log(`[gateway] no fallback configured`, {
          requestId,
          primaryProvider: entry.provider,
          fallbackEntry: fallbackEntry ? fallbackEntry.provider : "none",
        });
        return Response.json({ error: errorMessage }, { status: errorStatus });
      }

      // Skip fallback if Bedrock provider is not configured (no API key)
      if (fallbackEntry.provider === "bedrock" && !env.AWS_BEDROCK_API_KEY) {
        console.log(`[gateway] Bedrock fallback not configured (missing AWS_BEDROCK_API_KEY)`, {
          requestId,
        });
        return Response.json({ error: errorMessage }, { status: errorStatus });
      }

      const fallbackProvider = getProvider(fallbackEntry.provider);
      const fallbackConfig = getProviderConfig(fallbackEntry.provider, env);
      const fallbackStartTime = Date.now();

      console.log(`[gateway] attempting fallback provider`, {
        requestId,
        primaryProvider: entry.provider,
        fallbackProvider: fallbackEntry.provider,
        fallbackModel: fallbackEntry.model,
      });

      if (req.stream) {
        const response = await fallbackProvider.chatStream(
          { ...req, model: fallbackEntry.model },
          fallbackConfig,
        );
        const fallbackLatency = Date.now() - fallbackStartTime;
        console.log(`[gateway] fallback stream succeeded`, {
          requestId,
          fallbackProvider: fallbackEntry.provider,
          fallbackLatencyMs: fallbackLatency,
          totalLatencyMs: Date.now() - startTime,
        });
        return new Response(response.body, {
          status: response.status,
          headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Fallback-Provider": fallbackEntry.provider,
            "X-Request-Id": requestId,
          },
        });
      }

      const result = await fallbackProvider.chat(
        { ...req, model: fallbackEntry.model },
        fallbackConfig,
      );
      const fallbackLatency = Date.now() - fallbackStartTime;

      const hasToolCalls = (result.choices[0]?.message?.tool_calls?.length ?? 0) > 0;
      console.log(`[gateway] fallback succeeded`, {
        requestId,
        primaryProvider: entry.provider,
        fallbackProvider: fallbackEntry.provider,
        fallbackLatencyMs: fallbackLatency,
        totalLatencyMs: Date.now() - startTime,
        finishReason: result.choices[0]?.finish_reason,
        hasToolCalls,
        toolCallCount: result.choices[0]?.message?.tool_calls?.length ?? 0,
      });

      return Response.json(result, {
        headers: {
          "Content-Type": "application/json",
          "X-Fallback-Provider": fallbackEntry.provider,
          "X-Request-Id": requestId,
        },
      });
    } catch (fallbackErr) {
      // Fallback also failed
      const fallbackLatency = Date.now() - startTime;
      const fallbackErrorMessage = fallbackErr instanceof Error ? fallbackErr.message : String(fallbackErr);

      console.log(`[gateway] fallback provider also failed`, {
        requestId,
        primaryProvider: entry.provider,
        primaryError: errorMessage,
        fallbackError: fallbackErrorMessage,
        totalLatencyMs: fallbackLatency,
      });

      return Response.json({ error: fallbackErrorMessage }, { status: 502 });
    }
  }
}

export async function handleEmbed(
  req: EmbeddingRequest,
  env: Env,
): Promise<Response> {
  const requestId = newRequestId();
  const registry = registryOverride(env);

  const validated = validateEmbeddingInput(req.input);
  if (!validated.ok) {
    return gatewayErrorResponse(400, "invalid_request", validated.message, { requestId });
  }

  const model = req.model?.trim() || "embedding";
  const entry = resolveEmbeddingEntry(model, registry);
  if (!entry) {
    return gatewayErrorResponse(
      400,
      "unsupported_embedding_model",
      `Model '${model}' is not configured for embeddings`,
      { requestId },
    );
  }

  try {
    const provider = getProvider(entry.provider);
    if (!provider.embed) {
      return gatewayErrorResponse(
        400,
        "unsupported_embedding_model",
        `Provider ${entry.provider} does not support embeddings`,
        { requestId },
      );
    }

    const config = getProviderConfig(entry.provider, env);
    const startTime = Date.now();

    const result = await provider.embed(
      { model: entry.model, input: validated.input },
      config,
    );

    const latency = Date.now() - startTime;
    console.log(`[gateway] embed response succeeded`, {
      requestId,
      provider: entry.provider,
      model: entry.model,
      latencyMs: latency,
    });

    return Response.json(result, {
      headers: { "Content-Type": "application/json", "x-request-id": requestId },
    });
  } catch (err) {
    const mapped = mapProviderFailure(err);
    // Unknown provider from registry override → internal_error (sanitized).
    const code =
      err instanceof Error && /Unknown provider|No config for provider/.test(err.message)
        ? "internal_error"
        : mapped.code;
    const status = code === "internal_error" ? 500 : mapped.status;
    return gatewayErrorResponse(
      status,
      code,
      code === "internal_error"
        ? "Embedding provider is not configured"
        : mapped.message,
      {
        providerStatus: mapped.providerStatus,
        retryable: code === "internal_error" ? false : mapped.retryable,
        requestId,
      },
    );
  }
}

export async function handleRequest(
  request: Request,
  env: Env,
): Promise<Response> {
  const url = new URL(request.url);
  const method = request.method;

  if (method === "GET" && (url.pathname === "/" || url.pathname === "/health")) {
    return Response.json({ status: "ok", service: "ai-gateway" });
  }

  if (method !== "POST") {
    return Response.json({ error: "Method not allowed" }, { status: 405 });
  }

  // Verify bearer token for all POST requests (before parsing body)
  const auth = verifyBearerToken(request, env);
  if (!auth.valid) {
    return Response.json({ error: auth.message }, { status: 401 });
  }

  const body = await request.json() as Record<string, unknown>;

  if (url.pathname === "/v1/chat/completions") {
    const model = (body.model as string) ?? "default";
    return handleChat({ ...(body as object), model } as ChatCompletionRequest, env);
  }

  if (url.pathname === "/v1/embeddings") {
    // Default missing model to embedding tier — never chat "default".
    const model = typeof body.model === "string" && body.model.trim()
      ? body.model
      : "embedding";
    return handleEmbed(
      { model, input: body.input as string | string[] },
      env,
    );
  }

  return Response.json({ error: `Unknown endpoint: ${url.pathname}` }, { status: 404 });
}
