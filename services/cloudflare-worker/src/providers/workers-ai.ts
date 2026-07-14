import {
  type AiProvider,
  type ChatCompletionRequest,
  type ChatCompletionResponse,
  type EmbeddingRequest,
  type EmbeddingResponse,
  type ProviderConfig,
  createCompletionId,
} from "./provider";

/** @see https://developers.cloudflare.com/workers-ai/configuration/open-ai-compatibility/ */
export function workersAiOpenAiBaseUrl(config: ProviderConfig): string {
  const base = config.baseUrl.replace(/\/$/, "");

  // Managed Cloudflare AI Gateway — account + gateway id already in the URL.
  if (base.includes("gateway.ai.cloudflare.com")) {
    return base;
  }

  // Custom gateway worker (this repo or local dev) — OpenAI-compat at /v1/*.
  if (!base.includes("api.cloudflare.com/client/v4")) {
    return base.endsWith("/v1") ? base : `${base}/v1`;
  }

  const accountId = config.accountId?.trim();
  if (!accountId) {
    throw new Error("CLOUDFLARE_ACCOUNT_ID is required for Workers AI requests.");
  }
  return `${base}/accounts/${accountId}/ai/v1`;
}

function authHeaders(config: ProviderConfig): Record<string, string> {
  return {
    Authorization: `Bearer ${config.apiKey}`,
    "Content-Type": "application/json",
  };
}

export const workersAiProvider: AiProvider = {
  async chat(req: ChatCompletionRequest, config: ProviderConfig): Promise<ChatCompletionResponse> {
    const res = await fetch(`${workersAiOpenAiBaseUrl(config)}/chat/completions`, {
      method: "POST",
      headers: authHeaders(config),
      body: JSON.stringify(req),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Workers AI error ${res.status}: ${err}`);
    }

    const data = await res.json();
    return {
      id: createCompletionId(),
      model: req.model,
      choices: data.choices ?? [],
      usage: data.usage ?? { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
    };
  },

  async chatStream(req: ChatCompletionRequest, config: ProviderConfig): Promise<Response> {
    const upstream = await fetch(`${workersAiOpenAiBaseUrl(config)}/chat/completions`, {
      method: "POST",
      headers: authHeaders(config),
      body: JSON.stringify({ ...req, stream: true }),
    });

    if (!upstream.ok) {
      const err = await upstream.text();
      throw new Error(`Workers AI error ${upstream.status}: ${err}`);
    }

    return new Response(upstream.body, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  },

  async embed(req: EmbeddingRequest, config: ProviderConfig): Promise<EmbeddingResponse> {
    // OpenAI-compat `/v1/embeddings` uses `input` (string | string[]), not native `text`.
    // @see https://developers.cloudflare.com/workers-ai/configuration/open-ai-compatibility/
    const res = await fetch(`${workersAiOpenAiBaseUrl(config)}/embeddings`, {
      method: "POST",
      headers: authHeaders(config),
      body: JSON.stringify({ model: req.model, input: req.input }),
    });
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Workers AI embedding error ${res.status}: ${err}`);
    }
    const data: {
      data?: { index?: number; embedding?: number[] }[];
      result?: { data?: { index?: number; embedding?: number[] }[] };
      usage?: { prompt_tokens?: number; total_tokens?: number };
    } = await res.json();
    const rows = data.data ?? data.result?.data ?? [];

    return {
      model: req.model,
      data: rows.map((row, i) => ({
        index: row.index ?? i,
        embedding: row.embedding ?? [],
      })),
      usage: {
        prompt_tokens: data.usage?.prompt_tokens ?? 0,
        total_tokens: data.usage?.total_tokens ?? 0,
      },
    };
  },
};
