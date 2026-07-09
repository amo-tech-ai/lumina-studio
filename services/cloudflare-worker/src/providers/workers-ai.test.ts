import { afterEach, describe, expect, it, vi } from "vitest";

import { workersAiOpenAiBaseUrl, workersAiProvider } from "./workers-ai";

const CONFIG = {
  apiKey: "cf-api-token-secret",
  accountId: "a1b2c3d4e5f6789012345678901234567",
  baseUrl: "https://api.cloudflare.com/client/v4",
};

describe("workersAiOpenAiBaseUrl", () => {
  it("builds OpenAI-compat base with account ID in path", () => {
    expect(workersAiOpenAiBaseUrl(CONFIG)).toBe(
      "https://api.cloudflare.com/client/v4/accounts/a1b2c3d4e5f6789012345678901234567/ai/v1",
    );
  });

  it("throws when CLOUDFLARE_ACCOUNT_ID is missing", () => {
    expect(() =>
      workersAiOpenAiBaseUrl({ apiKey: "token", baseUrl: CONFIG.baseUrl }),
    ).toThrow(/CLOUDFLARE_ACCOUNT_ID/);
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

  it("embed uses account ID in embeddings path", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ result: { data: [{ embedding: [0.1] }] } }),
    });
    vi.stubGlobal("fetch", fetchMock);

    await workersAiProvider.embed!(
      { model: "@cf/baai/bge-base-en-v1.5", input: "hello" },
      CONFIG,
    );

    const [url] = fetchMock.mock.calls[0] as [string];
    expect(url).toBe(
      "https://api.cloudflare.com/client/v4/accounts/a1b2c3d4e5f6789012345678901234567/ai/v1/embeddings",
    );
  });
});
