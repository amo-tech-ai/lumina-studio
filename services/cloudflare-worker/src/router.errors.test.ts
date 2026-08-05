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
