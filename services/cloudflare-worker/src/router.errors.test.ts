import { afterEach, describe, expect, it, vi } from "vitest";
import { handleChat, handleRequest, type Env } from "./router";

const ENV: Env = {
  GEMINI_API_KEY: "gemini-key",
  CLOUDFLARE_API_TOKEN: "cf-token",
  CLOUDFLARE_ACCOUNT_ID: "account123",
};

const post = (path: string, body: string): Request =>
  new Request(`http://localhost${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
  });

describe("handleRequest body parsing", () => {
  it("returns 400 invalid_request for a malformed JSON body", async () => {
    const res = await handleRequest(post("/v1/chat/completions", "{not json"), ENV);

    expect(res.status).toBe(400);
    const body = (await res.json()) as {
      error: { code: string; message: string; requestId: string; retryable: boolean };
    };
    expect(body.error.code).toBe("invalid_request");
    expect(body.error.retryable).toBe(false);
    expect(body.error.requestId).toMatch(/^req_/);
  });

  it("returns 400 invalid_request for a non-object JSON body", async () => {
    const res = await handleRequest(post("/v1/embeddings", '"hello"'), ENV);

    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: { code: string } };
    expect(body.error.code).toBe("invalid_request");
  });
});

const workersAiTier = {
  provider: "workers-ai",
  model: "llama-2-7b-chat-int8",
  capabilities: ["text"],
  contextWindow: 4096,
  costPer1kIn: 0.0001,
  costPer1kOut: 0.0001,
};

const bedrockTier = {
  provider: "bedrock",
  model: "openai.gpt-oss-120b-1:0",
  capabilities: ["text"],
  contextWindow: 4096,
  costPer1kIn: 0.0001,
  costPer1kOut: 0.0001,
};

const registry = (tiers: Record<string, unknown>) => JSON.stringify({ tiers });

const chatReq = { model: "default", messages: [{ role: "user" as const, content: "hi" }] };

describe("handleChat provider failure sanitization", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("sanitizes a non-retryable primary provider failure (502 provider_error)", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const res = await handleChat(chatReq, {
      ...ENV,
      CLOUDFLARE_ACCOUNT_ID: undefined,
      MODEL_REGISTRY_OVERRIDE: registry({ default: workersAiTier }),
    });

    expect(res.status).toBe(502);
    const body = (await res.json()) as {
      error: { code: string; message: string; requestId: string; retryable: boolean };
    };
    expect(body.error.code).toBe("provider_error");
    expect(body.error.message).toBe("AI provider returned an error");
    expect(body.error.retryable).toBe(false);
    expect(body.error.requestId).toMatch(/^req_/);
    expect(body.error.requestId).toBe(res.headers.get("x-request-id"));
    expect(JSON.stringify(body)).not.toContain("CLOUDFLARE_ACCOUNT_ID is required");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("sanitizes a 502 when no fallback is configured", async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce({
      ok: false,
      status: 503,
      text: async () => "Service unavailable",
    });
    vi.stubGlobal("fetch", fetchMock);

    const res = await handleChat(chatReq, {
      ...ENV,
      MODEL_REGISTRY_OVERRIDE: registry({
        default: workersAiTier,
        "default-fallback": workersAiTier,
      }),
    });

    expect(res.status).toBe(502);
    const body = (await res.json()) as {
      error: { code: string; message: string; requestId: string; retryable: boolean };
    };
    expect(body.error.code).toBe("provider_error");
    expect(body.error.message).toBe("AI provider returned an error");
    expect(body.error.retryable).toBe(false);
    expect(body.error.requestId).toBe(res.headers.get("x-request-id"));
    expect(JSON.stringify(body)).not.toContain("Service unavailable");
  });

  it("sanitizes a 502 when the Bedrock fallback is not configured", async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce({
      ok: false,
      status: 503,
      text: async () => "Service unavailable",
    });
    vi.stubGlobal("fetch", fetchMock);

    const res = await handleChat(chatReq, {
      ...ENV,
      AWS_BEDROCK_API_KEY: undefined,
      MODEL_REGISTRY_OVERRIDE: registry({
        default: workersAiTier,
        "default-fallback": bedrockTier,
      }),
    });

    expect(res.status).toBe(502);
    const body = (await res.json()) as {
      error: { code: string; message: string; requestId: string; retryable: boolean };
    };
    expect(body.error.code).toBe("provider_error");
    expect(body.error.message).toBe("AI provider returned an error");
    expect(body.error.retryable).toBe(false);
    expect(body.error.requestId).toBe(res.headers.get("x-request-id"));
    expect(JSON.stringify(body)).not.toContain("Service unavailable");
  });

  it("sanitizes a 502 when the fallback provider also fails", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({
        ok: false,
        status: 503,
        text: async () => "Service unavailable",
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 502,
        text: async () => "Bedrock unavailable",
      });
    vi.stubGlobal("fetch", fetchMock);

    const res = await handleChat(chatReq, {
      ...ENV,
      AWS_BEDROCK_API_KEY: "bedrock-key",
      AWS_BEDROCK_BASE_URL: "https://bedrock.example.com",
      MODEL_REGISTRY_OVERRIDE: registry({
        default: workersAiTier,
        "default-fallback": bedrockTier,
      }),
    });

    expect(res.status).toBe(502);
    const body = (await res.json()) as {
      error: { code: string; message: string; requestId: string; retryable: boolean };
    };
    expect(body.error.code).toBe("provider_error");
    expect(body.error.message).toBe("AI provider returned an error");
    expect(body.error.retryable).toBe(false);
    expect(body.error.requestId).toBe(res.headers.get("x-request-id"));
    expect(JSON.stringify(body)).not.toContain("Bedrock unavailable");
  });
});

describe("handleChat model resolution failures", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("returns a sanitized 500 envelope when the registry names an unknown provider", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const res = await handleChat(
      { model: "default", messages: [{ role: "user", content: "hi" }] },
      {
        ...ENV,
        MODEL_REGISTRY_OVERRIDE: JSON.stringify({
          tiers: {
            default: {
              provider: "not-a-provider",
              model: "whatever",
              capabilities: ["text"],
              contextWindow: 4096,
              costPer1kIn: 0.0001,
              costPer1kOut: 0.0001,
            },
          },
        }),
      },
    );

    expect(res.status).toBe(500);
    const body = (await res.json()) as {
      error: { code: string; message: string; requestId: string };
    };
    expect(body.error.code).toBe("internal_error");
    expect(body.error.message).not.toContain("not-a-provider");
    expect(body.error.requestId).toMatch(/^req_/);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
