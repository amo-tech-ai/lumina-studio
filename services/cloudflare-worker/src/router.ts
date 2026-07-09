import { resolveModelEntry, type ModelRegistry } from "./model-registry";
import { geminiProvider } from "./providers/gemini";
import { workersAiProvider } from "./providers/workers-ai";
import {
  type AiProvider,
  type ChatCompletionRequest,
  type ChatCompletionResponse,
  type EmbeddingRequest,
  type EmbeddingResponse,
  createCompletionId,
} from "./providers/provider";

export interface Env {
  GEMINI_API_KEY?: string;
  NVIDIA_API_KEY?: string;
  CLOUDFLARE_API_TOKEN?: string;
  CLOUDFLARE_ACCOUNT_ID?: string;
  MODEL_REGISTRY_OVERRIDE?: string;
  AI_GATEWAY_URL?: string;
}

function getProvider(name: string): AiProvider {
  switch (name) {
    case "gemini":
      return geminiProvider;
    case "workers-ai":
      return workersAiProvider;
    default:
      throw new Error(`Unknown provider: ${name}`);
  }
}

function getProviderConfig(provider: string, env: Env): { apiKey: string; baseUrl: string } {
  switch (provider) {
    case "gemini":
      return { apiKey: env.GEMINI_API_KEY ?? "", baseUrl: "https://generativelanguage.googleapis.com" };
    case "workers-ai":
      return {
        apiKey: env.CLOUDFLARE_API_TOKEN ?? "",
        accountId: env.CLOUDFLARE_ACCOUNT_ID ?? "",
        baseUrl: env.AI_GATEWAY_URL ?? "https://api.cloudflare.com/client/v4",
      };
    default:
      throw new Error(`No config for provider: ${provider}`);
  }
}

function selectProvider(model: string, env: Env): { provider: AiProvider; config: ReturnType<typeof getProviderConfig>; entry: ReturnType<typeof resolveModelEntry> } {
  const tier = env.MODEL_REGISTRY_OVERRIDE
    ? JSON.parse(env.MODEL_REGISTRY_OVERRIDE) as ModelRegistry
    : undefined;
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
    const message = err instanceof Error ? err.message : String(err);
    return Response.json({ error: message }, { status: 502 });
  }
}

export async function handleEmbed(
  req: EmbeddingRequest,
  env: Env,
): Promise<Response> {
  const { provider, config, entry } = selectProvider(req.model, env);

  if (!provider.embed) {
    return Response.json({ error: `Provider ${entry.provider} does not support embeddings` }, { status: 400 });
  }

  try {
    const result = await provider.embed({ ...req, model: entry.model }, config);
    return Response.json(result, {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return Response.json({ error: message }, { status: 502 });
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
  const model = (body.model as string) ?? "default";

  if (url.pathname === "/v1/chat/completions") {
    return handleChat(body as unknown as ChatCompletionRequest, env);
  }

  if (url.pathname === "/v1/embeddings") {
    return handleEmbed(body as unknown as EmbeddingRequest, env);
  }

  return Response.json({ error: `Unknown endpoint: ${url.pathname}` }, { status: 404 });
}
