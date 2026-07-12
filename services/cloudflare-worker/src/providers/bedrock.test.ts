import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { bedrockProvider } from "./bedrock";

describe("bedrockProvider.chat", () => {
  beforeEach(() => {
    vi.stubEnv("AWS_BEDROCK_API_KEY", "test-api-key");
    vi.stubEnv("AWS_REGION", "us-east-1");
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("forwards chat request with tools to Bedrock Responses API", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [
          {
            message: { role: "assistant", content: "Hello" },
            finish_reason: "stop",
          },
        ],
        usage: { prompt_tokens: 10, completion_tokens: 5 },
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await bedrockProvider.chat(
      {
        model: "openai.gpt-oss-120b-1:0",
        messages: [{ role: "user", content: "hi" }],
        tools: [{ type: "function", function: { name: "test_tool" } }],
      },
      { apiKey: "test", baseUrl: "https://bedrock-mantle.us-east-1.api.aws" },
    );

    expect(result.choices[0].message.content).toBe("Hello");
    expect(fetchMock.mock.calls[0][1]?.headers).toMatchObject({
      Authorization: "Bearer test-api-key",
    });
  });

  it("includes tool_calls in response when model returns them", async () => {
    const toolCall = {
      id: "call_123",
      type: "function" as const,
      function: { name: "get_weather", arguments: '{"city":"NYC"}' },
    };
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [
          {
            message: { role: "assistant", content: null, tool_calls: [toolCall] },
            finish_reason: "tool_calls",
          },
        ],
        usage: {},
      }),
    }));

    const result = await bedrockProvider.chat(
      {
        model: "openai.gpt-oss-120b-1:0",
        messages: [{ role: "user", content: "get weather" }],
        tools: [{ type: "function", function: { name: "get_weather" } }],
      },
      { apiKey: "test", baseUrl: "https://bedrock-mantle.us-east-1.api.aws" },
    );

    expect(result.choices[0].message.tool_calls).toEqual([toolCall]);
  });

  it("throws when AWS_BEDROCK_API_KEY is not set", async () => {
    vi.unstubEnv("AWS_BEDROCK_API_KEY");

    await expect(
      bedrockProvider.chat(
        {
          model: "openai.gpt-oss-120b-1:0",
          messages: [{ role: "user", content: "hi" }],
        },
        { apiKey: "test", baseUrl: "https://bedrock-mantle.us-east-1.api.aws" },
      ),
    ).rejects.toThrow(/AWS_BEDROCK_API_KEY/);
  });

  it("throws when Bedrock API returns error", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: false,
      status: 503,
      text: async () => "Service unavailable",
    }));

    await expect(
      bedrockProvider.chat(
        {
          model: "openai.gpt-oss-120b-1:0",
          messages: [{ role: "user", content: "hi" }],
        },
        { apiKey: "test", baseUrl: "https://bedrock-mantle.us-east-1.api.aws" },
      ),
    ).rejects.toThrow(/Bedrock API error 503/);
  });
});

describe("bedrockProvider.chatStream", () => {
  beforeEach(() => {
    vi.stubEnv("AWS_BEDROCK_API_KEY", "test-api-key");
    vi.stubEnv("AWS_REGION", "us-east-1");
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("streams chat response with SSE passthrough", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      body: {
        pipeTo: async () => undefined,
      },
    }));

    const response = await bedrockProvider.chatStream(
      {
        model: "openai.gpt-oss-120b-1:0",
        messages: [{ role: "user", content: "hi" }],
      },
      { apiKey: "test", baseUrl: "https://bedrock-mantle.us-east-1.api.aws" },
    );

    expect(response.headers.get("Content-Type")).toBe("text/event-stream");
    expect(response.headers.get("Cache-Control")).toBe("no-cache");
  });

  it("returns error response when Bedrock stream fails", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      text: async () => "Internal error",
    }));

    const response = await bedrockProvider.chatStream(
      {
        model: "openai.gpt-oss-120b-1:0",
        messages: [{ role: "user", content: "hi" }],
      },
      { apiKey: "test", baseUrl: "https://bedrock-mantle.us-east-1.api.aws" },
    );

    expect(response.status).toBe(500);
  });
});
