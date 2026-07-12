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
        baseUrl: env.AWS_BEDROCK_BASE_URL,
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

function selectProvider(model: string, env: Env): {
  provider: AiProvider;
  config: ProviderConfig;
  entry: NonNullable<ReturnType<typeof resolveModelEntry>>;
} {
  const tier = registryOverride(env);
  const entry = resolveModelEntry(model, tier) ?? resolveModelEntry("default");

  if (!entry) {
    throw new Error(`No model entry found for tier "${model}" and no default fallback`);
  }

  const provider = getProvider(entry.provider);
  const config = getProviderConfig(entry.provider, env);
  return { provider, config, entry };
}

export async function handleChat(
  req: ChatCompletionRequest,
  env: Env,
): Promise<Response> {
  const { provider, config, entry } = selectProvider(req.model, env);
  const requestId = newRequestId();

  try {
    if (req.stream) {
      return await provider.chatStream(
        { ...req, model: entry.model },
        config,
      );
    }

    const result = await provider.chat({ ...req, model: entry.model }, config);
    return Response.json(result, {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    // Primary provider failed — check if error is retryable
    if (!isRetryableProviderError(err)) {
      // Non-retryable error (auth, validation, etc.) — fail fast
      const message = err instanceof Error ? err.message : String(err);
      return Response.json({ error: message }, { status: 502 });
    }

    // Retryable error (429, 5xx, timeout) — try Bedrock fallback
    console.log(`[gateway] ${entry.provider} failed (retryable), attempting Bedrock fallback`, {
      requestId,
      error: err instanceof Error ? err.message : String(err),
    });

    try {
      const fallbackEntry = resolveModelEntry("default-fallback");
      if (!fallbackEntry || fallbackEntry.provider === entry.provider) {
        // No fallback configured or fallback is same as primary
        const message = err instanceof Error ? err.message : String(err);
        return Response.json({ error: message }, { status: 502 });
      }

      const fallbackProvider = getProvider(fallbackEntry.provider);
      const fallbackConfig = getProviderConfig(fallbackEntry.provider, env);

      if (req.stream) {
        return await fallbackProvider.chatStream(
          { ...req, model: fallbackEntry.model },
          fallbackConfig,
        );
      }

      const result = await fallbackProvider.chat(
        { ...req, model: fallbackEntry.model },
        fallbackConfig,
      );

      console.log(`[gateway] Bedrock fallback succeeded`, { requestId });

      return Response.json(result, {
        headers: {
          "Content-Type": "application/json",
          "X-Fallback-Provider": fallbackEntry.provider,
          "X-Request-Id": requestId,
        },
      });
    } catch (fallbackErr) {
      // Fallback also failed
      console.log(`[gateway] Bedrock fallback failed`, {
        requestId,
        error: fallbackErr instanceof Error ? fallbackErr.message : String(fallbackErr),
      });

      const message = fallbackErr instanceof Error ? fallbackErr.message : String(fallbackErr);
      return Response.json({ error: message }, { status: 502 });
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
    const result = await provider.embed(
      { model: entry.model, input: validated.input },
      config,
    );
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
