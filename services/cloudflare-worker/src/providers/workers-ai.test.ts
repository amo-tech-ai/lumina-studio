import { afterEach, describe, expect, it, vi } from "vitest";

import { workersAiOpenAiBaseUrl, workersAiProvider } from "./workers-ai";

const CONFIG = {
  apiKey: "cf-api-token-secret",
  accountId: "a1b2c3d4e5f6789012345678901234567",
  baseUrl: "https://api.cloudflare.com/client/v4",
};

const WEATHER_TOOL = {
  type: "function" as const,
  function: {
    name: "get_weather",
    description: "Get the weather for a city",
    parameters: {
      type: "object",
      properties: { city: { type: "string" } },
      required: ["city"],
      additionalProperties: false,
    },
  },
};

describe("workersAiOpenAiBaseUrl", () => {
  it("builds OpenAI-compat base with account ID in path", () => {
    expect(workersAiOpenAiBaseUrl(CONFIG)).toBe(
      "https://api.cloudflare.com/client/v4/accounts/a1b2c3d4e5f6789012345678901234567/ai/v1",
    );
  });

  it("throws when CLOUDFLARE_ACCOUNT_ID is missing for direct Workers AI API", () => {
    expect(() =>
      workersAiOpenAiBaseUrl({ apiKey: "token", baseUrl: CONFIG.baseUrl }),
    ).toThrow(/CLOUDFLARE_ACCOUNT_ID/);
  });

  it("uses managed AI Gateway URL as-is without accountId", () => {
    const gateway =
      "https://gateway.ai.cloudflare.com/v1/acct123/my-gateway/openai";
    expect(
      workersAiOpenAiBaseUrl({ apiKey: "token", baseUrl: gateway }),
    ).toBe(gateway);
  });

  it("does not append /accounts/ to managed AI Gateway URLs", () => {
    const gateway =
      "https://gateway.ai.cloudflare.com/v1/acct123/my-gateway/compat";
    const url = workersAiOpenAiBaseUrl({
      apiKey: "token",
      baseUrl: gateway,
      accountId: "should-not-appear",
    });
    expect(url).toBe(gateway);
    expect(url).not.toContain("/accounts/");
  });

  it("uses /v1 suffix for custom gateway worker base URL", () => {
    expect(
      workersAiOpenAiBaseUrl({
        apiKey: "token",
        baseUrl: "http://127.0.0.1:8787",
      }),
    ).toBe("http://127.0.0.1:8787/v1");
  });

  it("does not put the API token in the URL path", () => {
    const url = workersAiOpenAiBaseUrl(CONFIG);
    expect(url).not.toContain(CONFIG.apiKey);
    expect(url).toContain(CONFIG.accountId);
  });
});

describe("workersAiProvider HTTP", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("chat uses account ID in path and token in Authorization", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: "ok" }, finish_reason: "stop" }],
        usage: { prompt_tokens: 1, completion_tokens: 2, total_tokens: 3 },
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    await workersAiProvider.chat(
      {
        model: "@cf/meta/llama-3.1-8b-instruct-fp8",
        messages: [{ role: "user", content: "ping" }],
      },
      CONFIG,
    );

    expect(fetchMock).toHaveBeenCalledOnce();
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(
      "https://api.cloudflare.com/client/v4/accounts/a1b2c3d4e5f6789012345678901234567/ai/v1/chat/completions",
    );
    expect(url).not.toContain("cf-api-token-secret");
    expect(init.headers).toMatchObject({
      Authorization: "Bearer cf-api-token-secret",
    });
  });

  it("forwards the complete OpenAI-compatible tool request unchanged", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ choices: [], usage: {} }),
    });
    vi.stubGlobal("fetch", fetchMock);

    await workersAiProvider.chat(
      {
        model: "@cf/openai/gpt-oss-120b",
        messages: [{ role: "user", content: "What is the weather in Medellin?" }],
        tools: [WEATHER_TOOL],
        tool_choice: { type: "function", function: { name: "get_weather" } },
        parallel_tool_calls: false,
      },
      CONFIG,
    );

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(JSON.parse(String(init.body))).toEqual({
      model: "@cf/openai/gpt-oss-120b",
      messages: [{ role: "user", content: "What is the weather in Medellin?" }],
      tools: [WEATHER_TOOL],
      tool_choice: { type: "function", function: { name: "get_weather" } },
      parallel_tool_calls: false,
    });
  });

  it("preserves assistant tool_calls in the non-stream response", async () => {
    const toolCall = {
      id: "call_weather_1",
      type: "function" as const,
      function: { name: "get_weather", arguments: '{"city":"Medellin"}' },
    };
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [
          {
            index: 0,
            message: { role: "assistant", content: "", tool_calls: [toolCall] },
            finish_reason: "tool_calls",
          },
        ],
        usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 },
      }),
    }));

    const result = await workersAiProvider.chat(
      {
        model: "@cf/openai/gpt-oss-120b",
        messages: [{ role: "user", content: "What is the weather in Medellin?" }],
        tools: [WEATHER_TOOL],
        tool_choice: "auto",
      },
      CONFIG,
    );

    expect(result.choices[0]?.message.tool_calls).toEqual([toolCall]);
    expect(result.choices[0]?.finish_reason).toBe("tool_calls");
  });

  it("forwards tool result messages for the second model turn", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ choices: [], usage: {} }),
    });
    vi.stubGlobal("fetch", fetchMock);

    await workersAiProvider.chat(
      {
        model: "@cf/openai/gpt-oss-120b",
        messages: [
          { role: "user", content: "What is the weather in Medellin?" },
          {
            role: "assistant",
            content: "",
            tool_calls: [
              {
                id: "call_weather_1",
                type: "function",
                function: { name: "get_weather", arguments: '{"city":"Medellin"}' },
              },
            ],
          },
          {
            role: "tool",
            tool_call_id: "call_weather_1",
            content: '{"temperature_c":24}',
          },
        ],
        tools: [WEATHER_TOOL],
      },
      CONFIG,
    );

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(String(init.body));
    expect(body.messages[1].tool_calls[0].id).toBe("call_weather_1");
    expect(body.messages[2]).toEqual({
      role: "tool",
      tool_call_id: "call_weather_1",
      content: '{"temperature_c":24}',
    });
  });

  it("chatStream forwards tools and forces stream=true", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      body: new ReadableStream(),
    });
    vi.stubGlobal("fetch", fetchMock);

    await workersAiProvider.chatStream(
      {
        model: "@cf/openai/gpt-oss-120b",
        messages: [{ role: "user", content: "Use the weather tool" }],
        tools: [WEATHER_TOOL],
        tool_choice: "auto",
      },
      CONFIG,
    );

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(JSON.parse(String(init.body))).toMatchObject({
      model: "@cf/openai/gpt-oss-120b",
      tools: [WEATHER_TOOL],
      tool_choice: "auto",
      stream: true,
    });
  });

  it("chat uses managed AI Gateway URL without account path", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: "ok" }, finish_reason: "stop" }],
        usage: { prompt_tokens: 1, completion_tokens: 2, total_tokens: 3 },
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const gateway =
      "https://gateway.ai.cloudflare.com/v1/acct123/my-gateway/openai";
    await workersAiProvider.chat(
      {
        model: "@cf/meta/llama-3.1-8b-instruct-fp8",
        messages: [{ role: "user", content: "ping" }],
      },
      { apiKey: "cf-aig-token", baseUrl: gateway },
    );

    const [url] = fetchMock.mock.calls[0] as [string];
    expect(url).toBe(`${gateway}/chat/completions`);
    expect(url).not.toContain("/accounts/");
  });

  it("embed uses OpenAI-compat input body and parses data[].embedding", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        data: [{ index: 0, embedding: [0.1, 0.2] }],
        usage: { prompt_tokens: 2, total_tokens: 2 },
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await workersAiProvider.embed!(
      { model: "@cf/baai/bge-base-en-v1.5", input: "hello" },
      CONFIG,
    );

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(
      "https://api.cloudflare.com/client/v4/accounts/a1b2c3d4e5f6789012345678901234567/ai/v1/embeddings",
    );
    expect(JSON.parse(String(init.body))).toEqual({
      model: "@cf/baai/bge-base-en-v1.5",
      input: "hello",
    });
    expect(result.data[0]?.embedding).toEqual([0.1, 0.2]);
    expect(result.usage.total_tokens).toBe(2);
  });

  it("embed accepts batch input array in one request", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        data: [
          { index: 0, embedding: [0.1] },
          { index: 1, embedding: [0.2] },
        ],
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await workersAiProvider.embed!(
      { model: "@cf/baai/bge-base-en-v1.5", input: ["a", "b"] },
      CONFIG,
    );

    expect(fetchMock).toHaveBeenCalledOnce();
    expect(JSON.parse(String((fetchMock.mock.calls[0] as [string, RequestInit])[1].body))).toEqual({
      model: "@cf/baai/bge-base-en-v1.5",
      input: ["a", "b"],
    });
    expect(result.data).toHaveLength(2);
  });
});
