import { afterEach, describe, expect, it, vi } from "vitest";

import { geminiProvider, geminiRequestUrl } from "./gemini";

describe("geminiRequestUrl", () => {
  it("uses generateContent without alt=sse for non-stream", () => {
    const url = geminiRequestUrl("gemini-3.1-flash-lite", false, "secret");
    expect(url).toContain(":generateContent?");
    expect(url).toContain("key=secret");
    expect(url).not.toContain("alt=sse");
  });

  it("uses streamGenerateContent with alt=sse for stream", () => {
    const url = geminiRequestUrl("gemini-3.1-flash-lite", true, "secret");
    expect(url).toContain(":streamGenerateContent?");
    expect(url).toContain("alt=sse");
    expect(url).toContain("key=secret");
  });
});

describe("geminiProvider.chat", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("parses JSON generateContent response (not SSE)", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        candidates: [
          {
            content: { parts: [{ text: "PONG" }] },
            finishReason: "STOP",
          },
        ],
        usageMetadata: { promptTokenCount: 1, candidatesTokenCount: 1 },
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await geminiProvider.chat(
      {
        model: "gemini-3.1-flash-lite",
        messages: [{ role: "user", content: "hi" }],
      },
      { apiKey: "secret", baseUrl: "https://generativelanguage.googleapis.com" },
    );

    expect(fetchMock.mock.calls[0][0]).toBe(
      geminiRequestUrl("gemini-3.1-flash-lite", false, "secret"),
    );
    expect(String(fetchMock.mock.calls[0][0])).not.toContain("alt=sse");
    expect(result.choices[0].message.content).toBe("PONG");
  });

  it("structured json_object also uses generateContent without alt=sse", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        candidates: [
          {
            content: { parts: [{ text: '{"ok":true}' }] },
            finishReason: "STOP",
          },
        ],
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    await geminiProvider.chat(
      {
        model: "gemini-3.1-flash-lite",
        messages: [{ role: "user", content: "json" }],
        response_format: { type: "json_object" },
      },
      { apiKey: "secret", baseUrl: "https://generativelanguage.googleapis.com" },
    );

    const url = String(fetchMock.mock.calls[0][0]);
    expect(url).toContain(":generateContent?");
    expect(url).not.toContain("alt=sse");
    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.generationConfig.responseMimeType).toBe("application/json");
  });

  it("rejects SSE-shaped body the way the pre-fix bug failed", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => {
        throw new SyntaxError(
          "Unexpected token 'd', \"data: {\"can\"... is not valid JSON",
        );
      },
    });
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      geminiProvider.chat(
        {
          model: "gemini-3.1-flash-lite",
          messages: [{ role: "user", content: "hi" }],
        },
        { apiKey: "secret", baseUrl: "https://generativelanguage.googleapis.com" },
      ),
    ).rejects.toThrow(/Unexpected token 'd'/);
  });
});

describe("geminiProvider.chatStream", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("requests streamGenerateContent with alt=sse", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      body: {
        pipeTo: async () => undefined,
      },
    });
    vi.stubGlobal("fetch", fetchMock);

    await geminiProvider.chatStream(
      {
        model: "gemini-3.1-flash-lite",
        messages: [{ role: "user", content: "hi" }],
      },
      { apiKey: "secret", baseUrl: "https://generativelanguage.googleapis.com" },
    );

    const url = String(fetchMock.mock.calls[0][0]);
    expect(url).toContain(":streamGenerateContent?");
    expect(url).toContain("alt=sse");
  });
});

describe("geminiProvider.embed", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("uses embedContent without alt=sse (separate from chat URL logic)", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ embedding: { values: [0.1, 0.2] } }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await geminiProvider.embed!(
      { model: "text-embedding-004", input: "hello" },
      { apiKey: "secret", baseUrl: "https://generativelanguage.googleapis.com" },
    );

    const url = String(fetchMock.mock.calls[0][0]);
    expect(url).toContain(":embedContent?");
    expect(url).not.toContain("alt=sse");
    expect(result.data[0].embedding).toEqual([0.1, 0.2]);
  });
});
