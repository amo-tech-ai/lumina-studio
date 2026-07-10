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
