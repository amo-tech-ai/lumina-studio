import { describe, expect, it, vi, afterEach } from "vitest";
import { handleChat } from "./router";

const ENV = {
  GEMINI_API_KEY: "gemini-key",
  NVIDIA_API_KEY: "nvidia-key",
  CLOUDFLARE_API_TOKEN: "cf-token",
  CLOUDFLARE_ACCOUNT_ID: "account123",
  AWS_BEDROCK_API_KEY: "bedrock-key",
  AWS_BEDROCK_BASE_URL: "https://bedrock-mantle.us-east-1.api.aws",
  AWS_REGION: "us-east-1",
  MODEL_REGISTRY_OVERRIDE: JSON.stringify({
    tiers: {
      "default": {
        provider: "workers-ai",
        model: "meta-llama/llama-2-7b-chat-int8",
        capabilities: ["text"],
        contextWindow: 4096,
        costPer1kIn: 0.0001,
        costPer1kOut: 0.0001,
      },
      "default-fallback": {
        provider: "bedrock",
        model: "openai.gpt-oss-120b-1:0",
        capabilities: ["text"],
        contextWindow: 4096,
        costPer1kIn: 0.0001,
        costPer1kOut: 0.0001,
      },
    },
  }),
};

describe("Router Fallback Integration", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("falls back to Bedrock when Workers AI returns 503", async () => {
    const fetchMock = vi.fn()
      // First call: Workers AI returns 503
      .mockResolvedValueOnce({
        ok: false,
        status: 503,
        text: async () => "Service unavailable",
      })
      // Second call: Bedrock succeeds
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [
            {
              message: { role: "assistant", content: "Response from Bedrock" },
              finish_reason: "stop",
            },
          ],
          usage: { prompt_tokens: 10, completion_tokens: 20 },
        }),
      });

    vi.stubGlobal("fetch", fetchMock);

    const response = await handleChat(
      {
        model: "default",
        messages: [{ role: "user", content: "Hello" }],
      },
      ENV,
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.choices[0].message.content).toBe("Response from Bedrock");
    expect(response.headers.get("X-Fallback-Provider")).toBe("bedrock");
    expect(response.headers.get("X-Request-Id")).toBeTruthy();
  });

  it("falls back to Bedrock when Workers AI times out", async () => {
    const fetchMock = vi.fn()
      // First call: Workers AI timeout
      .mockRejectedValueOnce(new Error("Request timeout"))
      // Second call: Bedrock succeeds
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [
            {
              message: { role: "assistant", content: "Fallback response" },
              finish_reason: "stop",
            },
          ],
          usage: { prompt_tokens: 5, completion_tokens: 10 },
        }),
      });

    vi.stubGlobal("fetch", fetchMock);

    const response = await handleChat(
      {
        model: "default",
        messages: [{ role: "user", content: "Test" }],
      },
      ENV,
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.choices[0].message.content).toBe("Fallback response");
    expect(response.headers.get("X-Fallback-Provider")).toBe("bedrock");
  });

  it("returns error when both Workers AI and Bedrock fail non-retryably", async () => {
    const fetchMock = vi.fn()
      // First call: Workers AI auth error (401)
      .mockResolvedValueOnce({
        ok: false,
        status: 401,
        text: async () => "Unauthorized",
      });

    vi.stubGlobal("fetch", fetchMock);

    const response = await handleChat(
      {
        model: "default",
        messages: [{ role: "user", content: "Test" }],
      },
      ENV,
    );

    expect(response.status).toBe(502);
    const body = await response.json();
    expect(body.error).toBeTruthy();
  });

  it("succeeds with tool calling through Bedrock fallback", async () => {
    const toolCall = {
      id: "call_123",
      type: "function" as const,
      function: { name: "get_weather", arguments: '{"city":"NYC"}' },
    };

    const fetchMock = vi.fn()
      // First call: Workers AI returns 500
      .mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: async () => "Internal error",
      })
      // Second call: Bedrock returns tool call
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [
            {
              message: {
                role: "assistant",
                content: null,
                tool_calls: [toolCall],
              },
              finish_reason: "tool_calls",
            },
          ],
          usage: { prompt_tokens: 15, completion_tokens: 10 },
        }),
      });

    vi.stubGlobal("fetch", fetchMock);

    const response = await handleChat(
      {
        model: "default",
        messages: [{ role: "user", content: "Get weather" }],
        tools: [
          {
            type: "function",
            function: {
              name: "get_weather",
              description: "Get weather for a city",
            },
          },
        ],
      },
      ENV,
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.choices[0].message.tool_calls).toEqual([toolCall]);
    expect(body.choices[0].finish_reason).toBe("tool_calls");
    expect(response.headers.get("X-Fallback-Provider")).toBe("bedrock");
  });

  it("falls back to Bedrock when Workers AI returns 429 (rate limited)", async () => {
    const fetchMock = vi.fn()
      // First call: Workers AI rate limited
      .mockResolvedValueOnce({
        ok: false,
        status: 429,
        text: async () => "Rate limited",
      })
      // Second call: Bedrock succeeds
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [
            {
              message: { role: "assistant", content: "Fallback succeeded" },
              finish_reason: "stop",
            },
          ],
          usage: { prompt_tokens: 8, completion_tokens: 12 },
        }),
      });

    vi.stubGlobal("fetch", fetchMock);

    const response = await handleChat(
      {
        model: "default",
        messages: [{ role: "user", content: "Test" }],
      },
      ENV,
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.choices[0].message.content).toBe("Fallback succeeded");
    expect(response.headers.get("X-Fallback-Provider")).toBe("bedrock");
  });

  it("returns error when both providers fail with retryable errors", async () => {
    const fetchMock = vi.fn()
      // First call: Workers AI 503
      .mockResolvedValueOnce({
        ok: false,
        status: 503,
        text: async () => "Service unavailable",
      })
      // Second call: Bedrock also 503
      .mockResolvedValueOnce({
        ok: false,
        status: 503,
        text: async () => "Bedrock unavailable",
      });

    vi.stubGlobal("fetch", fetchMock);

    const response = await handleChat(
      {
        model: "default",
        messages: [{ role: "user", content: "Test" }],
      },
      ENV,
    );

    expect(response.status).toBe(502);
    const body = await response.json();
    expect(body.error).toContain("Bedrock unavailable");
  });

  it("streams response from primary provider with request ID", async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce({
      ok: true,
      body: {
        pipeTo: async () => undefined,
      },
      status: 200,
    });

    vi.stubGlobal("fetch", fetchMock);

    const response = await handleChat(
      {
        model: "default",
        messages: [{ role: "user", content: "Test" }],
        stream: true,
      },
      ENV,
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe("text/event-stream");
    expect(response.headers.get("X-Request-Id")).toBeTruthy();
  });

  it("includes request ID in fallback success response", async () => {
    const fetchMock = vi.fn()
      // First call: Workers AI fails
      .mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: async () => "Internal error",
      })
      // Second call: Bedrock succeeds
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [
            {
              message: { role: "assistant", content: "From fallback" },
              finish_reason: "stop",
            },
          ],
          usage: { prompt_tokens: 1, completion_tokens: 1 },
        }),
      });

    vi.stubGlobal("fetch", fetchMock);

    const response = await handleChat(
      {
        model: "default",
        messages: [{ role: "user", content: "Test" }],
      },
      ENV,
    );

    expect(response.status).toBe(200);
    const requestId = response.headers.get("X-Request-Id");
    expect(requestId).toBeTruthy();
    expect(requestId).toMatch(/^req_[a-f0-9-]+$/);
  });

  it("does not fall back when fallback provider matches primary provider", async () => {
    const envNoFallback = {
      ...ENV,
      AWS_BEDROCK_API_KEY: undefined,
      MODEL_REGISTRY_OVERRIDE: JSON.stringify({
        tiers: {
          "default": {
            provider: "workers-ai",
            model: "llama",
            capabilities: ["text"],
            contextWindow: 4096,
            costPer1kIn: 0.0001,
            costPer1kOut: 0.0001,
          },
          "default-fallback": {
            provider: "workers-ai",
            model: "llama",
            capabilities: ["text"],
            contextWindow: 4096,
            costPer1kIn: 0.0001,
            costPer1kOut: 0.0001,
          },
        },
      }),
    };

    const fetchMock = vi.fn().mockResolvedValueOnce({
      ok: false,
      status: 503,
      text: async () => "Service unavailable",
    });

    vi.stubGlobal("fetch", fetchMock);

    const response = await handleChat(
      {
        model: "default",
        messages: [{ role: "user", content: "Test" }],
      },
      envNoFallback,
    );

    expect(response.status).toBe(502);
  });

  it("preserves default-fallback from defaults when MODEL_REGISTRY_OVERRIDE omits it", async () => {
    const envPartial = {
      ...ENV,
      MODEL_REGISTRY_OVERRIDE: JSON.stringify({
        tiers: {
          "default": {
            provider: "workers-ai",
            model: "llama",
            capabilities: ["text"],
            contextWindow: 4096,
            costPer1kIn: 0.0001,
            costPer1kOut: 0.0001,
          },
        },
      }),
    };

    const fetchMock = vi.fn()
      .mockResolvedValueOnce({
        ok: false,
        status: 503,
        text: async () => "Service unavailable",
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [
            {
              message: { role: "assistant", content: "Fallback from Bedrock" },
              finish_reason: "stop",
            },
          ],
          usage: { prompt_tokens: 5, completion_tokens: 10 },
        }),
      });

    vi.stubGlobal("fetch", fetchMock);

    const response = await handleChat(
      {
        model: "default",
        messages: [{ role: "user", content: "Test" }],
      },
      envPartial,
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.choices[0].message.content).toBe("Fallback from Bedrock");
    expect(response.headers.get("X-Fallback-Provider")).toBe("bedrock");
  });
});
