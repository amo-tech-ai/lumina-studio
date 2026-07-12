import {
  type AiProvider,
  type ChatCompletionRequest,
  type ChatCompletionResponse,
  type EmbeddingRequest,
  type EmbeddingResponse,
  type ProviderConfig,
  createCompletionId,
} from "./provider";

const GEMINI_BASE = "https://generativelanguage.googleapis.com/v1beta";

function geminiModelId(openAiModel: string): string {
  const map: Record<string, string> = {
    "gemini-3.1-flash-lite": "gemini-3.1-flash-lite",
    "gemini-3.1-pro-preview": "gemini-3.1-pro-preview-002",
    "gemini-3.5-flash": "gemini-3.5-flash-001",
  };
  return map[openAiModel] ?? openAiModel;
}

function toGeminiMessages(messages: ChatCompletionRequest["messages"]) {
  const system = messages
    .filter((m) => m.role === "system")
    .map((m) => m.content)
    .filter(Boolean)
    .join("\n");
  const contents = messages
    .filter((m) => m.role !== "system" && m.role !== "tool")
    .map((m) => {
      const parts = m.content ? [{ text: m.content }] : [];
      return {
        role: m.role === "assistant" ? "model" : "user",
        parts: parts.length > 0 ? parts : [{ text: "" }], // Preserve empty turns for conversation flow
      };
    });

  return { system, contents };
}

/** Non-stream must return JSON (`generateContent`). Stream uses SSE (`alt=sse`). */
export function geminiRequestUrl(
  model: string,
  stream: boolean,
  apiKey: string,
): string {
  const action = stream ? "streamGenerateContent" : "generateContent";
  const key = encodeURIComponent(apiKey);
  const query = stream ? `alt=sse&key=${key}` : `key=${key}`;
  return `${GEMINI_BASE}/models/${geminiModelId(model)}:${action}?${query}`;
}

async function geminiFetch(
  model: string,
  body: Record<string, unknown>,
  config: ProviderConfig,
  stream: boolean,
): Promise<Response> {
  return fetch(geminiRequestUrl(model, stream, config.apiKey), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function fromGeminiResponse(
  geminiData: any,
  model: string,
): ChatCompletionResponse {
  const candidate = geminiData.candidates?.[0];
  const content = candidate?.content?.parts?.map((p: any) => p.text).join("") ?? "";
  const usage = geminiData.usageMetadata ?? {};

  return {
    id: createCompletionId(),
    model,
    choices: [
      {
        index: 0,
        message: { role: "assistant", content },
        finish_reason: candidate?.finishReason?.toLowerCase() ?? "stop",
      },
    ],
    usage: {
      prompt_tokens: usage.promptTokenCount ?? 0,
      completion_tokens: usage.candidatesTokenCount ?? 0,
      total_tokens: (usage.promptTokenCount ?? 0) + (usage.candidatesTokenCount ?? 0),
    },
  };
}

export const geminiProvider: AiProvider = {
  async chat(req: ChatCompletionRequest, config: ProviderConfig): Promise<ChatCompletionResponse> {
    if (req.tools || req.tool_choice || req.parallel_tool_calls) {
      throw new Error(
        "Gemini provider does not support tool calls. Route tool-bearing requests to a tool-aware provider (Workers AI)."
      );
    }
    if (req.messages.some((m) => m.role === "tool")) {
      throw new Error(
        "Gemini provider does not support tool-result messages. Complete tool conversations in a tool-aware provider (Workers AI)."
      );
    }
    if (req.messages.some((m) => m.role === "assistant" && m.tool_calls)) {
      throw new Error(
        "Gemini provider does not support assistant messages with tool_calls. Route tool-calling conversations to a tool-aware provider (Workers AI)."
      );
    }
    const { system, contents } = toGeminiMessages(req.messages);
    const body: Record<string, unknown> = {
      contents,
      generationConfig: {
        temperature: req.temperature ?? 0.7,
        maxOutputTokens: req.max_tokens ?? 8192,
      },
    };

    if (system) body.systemInstruction = { parts: [{ text: system }] };
    if (req.response_format?.type === "json_object") {
      (body.generationConfig as Record<string, unknown>).responseMimeType = "application/json";
    }

    const res = await geminiFetch(req.model, body, config, false);
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Gemini API error ${res.status}: ${err}`);
    }

    const data = await res.json();
    return fromGeminiResponse(data, req.model);
  },

  async chatStream(req: ChatCompletionRequest, config: ProviderConfig): Promise<Response> {
    if (req.tools || req.tool_choice || req.parallel_tool_calls) {
      throw new Error(
        "Gemini provider does not support tool calls. Route tool-bearing requests to a tool-aware provider (Workers AI)."
      );
    }
    if (req.messages.some((m) => m.role === "tool")) {
      throw new Error(
        "Gemini provider does not support tool-result messages. Complete tool conversations in a tool-aware provider (Workers AI)."
      );
    }
    if (req.messages.some((m) => m.role === "assistant" && m.tool_calls)) {
      throw new Error(
        "Gemini provider does not support assistant messages with tool_calls. Route tool-calling conversations to a tool-aware provider (Workers AI)."
      );
    }
    const { system, contents } = toGeminiMessages(req.messages);
    const body: Record<string, unknown> = {
      contents,
      generationConfig: {
        temperature: req.temperature ?? 0.7,
        maxOutputTokens: req.max_tokens ?? 8192,
      },
    };

    if (system) body.systemInstruction = { parts: [{ text: system }] };

    const upstream = await geminiFetch(req.model, body, config, true);
    if (!upstream.ok) {
      const err = await upstream.text();
      return new Response(JSON.stringify({ error: `Gemini error ${upstream.status}: ${err}` }), {
        status: upstream.status,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { readable, writable } = new TransformStream();
    const writer = writable.getWriter();
    const encoder = new TextEncoder();

    upstream.body?.pipeTo(
      new WritableStream({
        async write(chunk) {
          const text = new TextDecoder().decode(chunk);
          const lines = text.split("\n").filter((l) => l.startsWith("data: "));
          for (const line of lines) {
            const jsonStr = line.slice(6).trim();
            if (!jsonStr || jsonStr === "[DONE]") continue;
            try {
              const geminiData = JSON.parse(jsonStr);
              const candidate = geminiData.candidates?.[0];
              const part = candidate?.content?.parts?.[0]?.text ?? "";
              if (part) {
                const openaiChunk = {
                  id: createCompletionId(),
                  object: "chat.completion.chunk",
                  model: req.model,
                  choices: [
                    {
                      index: 0,
                      delta: { content: part },
                      finish_reason: candidate?.finishReason?.toLowerCase() ?? null,
                    },
                  ],
                };
                await writer.write(encoder.encode(`data: ${JSON.stringify(openaiChunk)}\n\n`));
              }
            } catch {}
          }
        },
        async close() {
          await writer.write(encoder.encode("data: [DONE]\n\n"));
          await writer.close();
        },
      }),
    );

    return new Response(readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  },

  async embed(req: EmbeddingRequest, config: ProviderConfig): Promise<EmbeddingResponse> {
    const url = `${GEMINI_BASE}/models/${geminiModelId("text-embedding-004")}:embedContent?key=${encodeURIComponent(config.apiKey)}`;
    const inputs = typeof req.input === "string" ? [req.input] : req.input;

    const results = await Promise.all(
      inputs.map(async (text) => {
        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ model: "models/text-embedding-004", content: { parts: [{ text }] } }),
        });
        if (!res.ok) throw new Error(`Gemini embedding error ${res.status}`);
        const data = await res.json();
        return data.embedding?.values ?? [];
      }),
    );

    return {
      model: req.model,
      data: results.map((embedding, i) => ({ index: i, embedding })),
      usage: { prompt_tokens: 0, total_tokens: 0 },
    };
  },
};
