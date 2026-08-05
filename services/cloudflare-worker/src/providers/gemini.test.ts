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

  it("encodes apiKey so &/= do not corrupt the query string", () => {
    const url = geminiRequestUrl("gemini-3.1-flash-lite", false, "a&b=c");
    expect(url).toContain(`key=${encodeURIComponent("a&b=c")}`);
    expect(url).not.toMatch(/[?&]key=a&/);
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

  const sseFrame = (text: string) =>
    `data: ${JSON.stringify({ candidates: [{ content: { parts: [{ text }] } }] })}\n\n`;

  const streamOf = (chunks: string[], failWith?: Error): ReadableStream<Uint8Array> => {
    const encoder = new TextEncoder();
    let i = 0;
    return new ReadableStream({
      // pull, not start: an error enqueued alongside the chunks in start() would
      // discard them before the consumer ever reads one.
      pull(controller) {
        if (i < chunks.length) {
          controller.enqueue(encoder.encode(chunks[i++]));
          return;
        }
        if (failWith) controller.error(failWith);
        else controller.close();
      },
    });
  };

  const readAll = async (response: Response): Promise<string> => {
    const reader = response.body!.getReader();
    const decoder = new TextDecoder();
    let out = "";
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      out += decoder.decode(value, { stream: true });
    }
    return out;
  };

  const startStream = async (body: ReadableStream<Uint8Array>) => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, status: 200, body }));
    return geminiProvider.chatStream(
      { model: "gemini-3.1-flash-lite", messages: [{ role: "user", content: "hi" }], stream: true },
      { apiKey: "secret", baseUrl: "https://generativelanguage.googleapis.com" },
    );
  };

  it("keeps content when an SSE frame is split across chunks", async () => {
    const frame = sseFrame("HELLO");
    const split = Math.floor(frame.length / 2);
    const response = await startStream(streamOf([frame.slice(0, split), frame.slice(split)]));

    const out = await readAll(response);
    expect(out).toContain('"content":"HELLO"');
    expect(out).toContain("data: [DONE]");
  });

  it("emits an error frame and terminates when the upstream stream errors", async () => {
    const response = await startStream(
      streamOf([sseFrame("partial")], new Error("upstream reset")),
    );

    const out = await readAll(response);
    expect(out).toContain('"content":"partial"');
    expect(out).toContain("upstream_stream_error");
    expect(out).toContain("upstream reset");
    expect(out.trimEnd().endsWith("data: [DONE]")).toBe(true);
  });

  it("surfaces malformed SSE JSON instead of silently dropping it", async () => {
    const response = await startStream(streamOf(["data: {not json}\n\n"]));

    const out = await readAll(response);
    expect(out).toContain("upstream_stream_error");
    expect(out).toContain("data: [DONE]");
  });

  it("reports a missing upstream body instead of hanging the stream", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, status: 200, body: null }));

    const response = await geminiProvider.chatStream(
      { model: "gemini-3.1-flash-lite", messages: [{ role: "user", content: "hi" }], stream: true },
      { apiKey: "secret", baseUrl: "https://generativelanguage.googleapis.com" },
    );

    const out = await readAll(response);
    expect(out).toContain("Gemini stream response had no body");
    expect(out).toContain("data: [DONE]");
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
    expect(url).toContain(`key=${encodeURIComponent("secret")}`);
    expect(url).not.toContain("alt=sse");
    expect(result.data[0].embedding).toEqual([0.1, 0.2]);
  });
});
