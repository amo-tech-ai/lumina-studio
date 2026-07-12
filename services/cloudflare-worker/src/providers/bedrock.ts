import {
  type AiProvider,
  type ChatCompletionRequest,
  type ChatCompletionResponse,
  type EmbeddingRequest,
  type EmbeddingResponse,
  type ProviderConfig,
  createCompletionId,
} from "./provider";

const BEDROCK_BASE = "https://bedrock-mantle";

function bedrockBaseUrl(region: string, baseUrl?: string): string {
  if (baseUrl) return baseUrl;
  return `${BEDROCK_BASE}.${region}.amazonaws.com`;
}

function bedrockRequestUrl(baseUrl: string): string {
  return `${baseUrl}/v1/chat/completions`;
}

async function bedrockFetch(
  model: string,
  body: Record<string, unknown>,
  config: ProviderConfig,
  apiKey: string,
  region: string,
  baseUrl: string | undefined,
  stream: boolean,
): Promise<Response> {
  const url = bedrockRequestUrl(bedrockBaseUrl(region, baseUrl));

  return fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ ...body, model }),
  });
}

function fromBedrockResponse(
  bedrockData: any,
  model: string,
): ChatCompletionResponse {
  const choice = bedrockData.choices?.[0];
  const content = choice?.message?.content ?? "";
  const usage = bedrockData.usage ?? {};

  return {
    id: createCompletionId(),
    model,
    choices: [
      {
        index: 0,
        message: {
          role: "assistant",
          content,
          tool_calls: choice?.message?.tool_calls,
        },
        finish_reason: choice?.finish_reason ?? "stop",
      },
    ],
    usage: {
      prompt_tokens: usage.prompt_tokens ?? 0,
      completion_tokens: usage.completion_tokens ?? 0,
      total_tokens: (usage.prompt_tokens ?? 0) + (usage.completion_tokens ?? 0),
    },
  };
}

export const bedrockProvider: AiProvider = {
  async chat(req: ChatCompletionRequest, config: ProviderConfig): Promise<ChatCompletionResponse> {
    const apiKey = config.apiKey;
    const region = (config as any).region || "us-east-1";
    const baseUrl = config.baseUrl;

    if (!apiKey) {
      throw new Error("AWS_BEDROCK_API_KEY not set");
    }

    const body: Record<string, unknown> = {
      messages: req.messages,
      temperature: req.temperature ?? 0.7,
      max_tokens: req.max_tokens ?? 8192,
    };

    if (req.tools) body.tools = req.tools;
    if (req.tool_choice) body.tool_choice = req.tool_choice;
    if (req.parallel_tool_calls !== undefined) body.parallel_tool_calls = req.parallel_tool_calls;
    if (req.response_format?.type === "json_object") {
      body.response_format = { type: "json_object" };
    }

    const res = await bedrockFetch(req.model, body, config, apiKey, region, baseUrl, false);

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Bedrock API error ${res.status}: ${err}`);
    }

    const data = await res.json();
    return fromBedrockResponse(data, req.model);
  },

  async chatStream(req: ChatCompletionRequest, config: ProviderConfig): Promise<Response> {
    const apiKey = config.apiKey;
    const region = (config as any).region || "us-east-1";
    const baseUrl = config.baseUrl;

    if (!apiKey) {
      throw new Error("AWS_BEDROCK_API_KEY not set");
    }

    const body: Record<string, unknown> = {
      messages: req.messages,
      temperature: req.temperature ?? 0.7,
      max_tokens: req.max_tokens ?? 8192,
      stream: true,
    };

    if (req.tools) body.tools = req.tools;
    if (req.tool_choice) body.tool_choice = req.tool_choice;
    if (req.parallel_tool_calls !== undefined) body.parallel_tool_calls = req.parallel_tool_calls;

    const upstream = await bedrockFetch(req.model, body, config, apiKey, region, baseUrl, true);

    if (!upstream.ok) {
      const err = await upstream.text();
      throw new Error(`Bedrock API error ${upstream.status}: ${err}`);
    }

    // Stream passthrough: Bedrock Responses API returns OpenAI-compatible SSE format
    return new Response(upstream.body, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });
  },

  embed(req: EmbeddingRequest, config: ProviderConfig): Promise<EmbeddingResponse> {
    throw new Error("Bedrock provider does not support embeddings yet");
  },
};
