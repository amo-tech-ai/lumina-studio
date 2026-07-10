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
    expect(result.choices[0].message.content).toBe("PONG");
  });
});
