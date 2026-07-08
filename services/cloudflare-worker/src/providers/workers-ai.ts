import {
  type AiProvider,
  type ChatCompletionRequest,
  type ChatCompletionResponse,
  type EmbeddingRequest,
  type EmbeddingResponse,
  type ProviderConfig,
  createCompletionId,
} from "./provider";

export const workersAiProvider: AiProvider = {
  async chat(req: ChatCompletionRequest, config: ProviderConfig): Promise<ChatCompletionResponse> {
    const res = await fetch(`${config.baseUrl}/accounts/${config.apiKey}/ai/v1/chat/completions`, {
      method: "POST",
      headers: { "Authorization": `Bearer ${config.apiKey}`, "Content-Type": "application/json" },
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
    const upstream = await fetch(
      `${config.baseUrl}/accounts/${config.apiKey}/ai/v1/chat/completions`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${config.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ...req, stream: true }),
      },
    );

    if (!upstream.ok) {
      const err = await upstream.text();
      return new Response(JSON.stringify({ error: `Workers AI error ${upstream.status}: ${err}` }), {
        status: upstream.status,
        headers: { "Content-Type": "application/json" },
      });
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
    const inputs = typeof req.input === "string" ? [req.input] : req.input;
    const results = await Promise.all(
      inputs.map(async (text) => {
        const res = await fetch(
          `${config.baseUrl}/accounts/${config.apiKey}/ai/v1/embeddings`,
          {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${config.apiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ model: req.model, text: [text] }),
          },
        );
        if (!res.ok) throw new Error(`Workers AI embedding error ${res.status}`);
        const data: any = await res.json();
        return data.result?.data?.[0]?.embedding ?? [];
      }),
    );

    return {
      model: req.model,
      data: results.map((embedding, i) => ({ index: i, embedding })),
      usage: { prompt_tokens: 0, total_tokens: 0 },
    };
  },
};
