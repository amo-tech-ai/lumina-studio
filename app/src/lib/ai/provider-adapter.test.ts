import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

import { providerAdapter } from "./provider-adapter";

describe("providerAdapter", () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("AI_GATEWAY_URL", "http://localhost:4111");
    vi.stubEnv("AI_GATEWAY_API_KEY", "test-key");
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  describe("chat", () => {
    it("returns text from default tier", async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            choices: [{ message: { content: "Hello from AI" } }],
            usage: { prompt_tokens: 10, completion_tokens: 20 },
          }),
      });

      const result = await providerAdapter.chat("Say hello");

      expect(result.text).toBe("Hello from AI");
      expect(result.usage).toEqual({ promptTokens: 10, completionTokens: 20 });
    });

    it("passes temperature and maxTokens", async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ choices: [{ message: { content: "ok" } }] }),
      });
      globalThis.fetch = fetchMock;

      await providerAdapter.chat("test", { temperature: 0.1, maxTokens: 100 });

      const callBody = JSON.parse(fetchMock.mock.calls[0][1].body);
      expect(callBody.temperature).toBe(0.1);
      expect(callBody.max_tokens).toBe(100);
    });

    it("returns empty text on no choices", async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ choices: [] }),
      });

      const result = await providerAdapter.chat("empty");

      expect(result.text).toBe("");
    });

    it("throws on non-ok response", async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 503,
        text: () => Promise.resolve("Service Unavailable"),
      });

      await expect(providerAdapter.chat("test")).rejects.toThrow("chat completion failed: 503");
    });
  });

  describe("chatStream", () => {
    it("exposes a chatStream function", () => {
      globalThis.fetch = vi.fn();
      const stream = providerAdapter.chatStream("test");
      expect(stream).toBeInstanceOf(ReadableStream);
      expect(globalThis.fetch).toHaveBeenCalled();
    });

    it("parses SSE deltas and closes on [DONE]", async () => {
      const sseBody = [
        'data: {"choices":[{"delta":{"content":"Hello"}}]}',
        "",
        'data: {"choices":[{"delta":{"content":" world"}}]}',
        "",
        "data: [DONE]",
        "",
      ].join("\n");

      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        body: new ReadableStream({
          start(controller) {
            controller.enqueue(new TextEncoder().encode(sseBody));
            controller.close();
          },
        }),
      });

      const stream = providerAdapter.chatStream("test");
      const reader = stream.getReader();
      const chunks: string[] = [];
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
      }

      expect(chunks).toEqual(["Hello", " world"]);
    });

    it("handles data: without space (no-space SSE delimiter)", async () => {
      const sseBody = [
        'data:{"choices":[{"delta":{"content":"no-space"}}]}',
        "",
        "data:[DONE]",
        "",
      ].join("\n");

      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        body: new ReadableStream({
          start(controller) {
            controller.enqueue(new TextEncoder().encode(sseBody));
            controller.close();
          },
        }),
      });

      const stream = providerAdapter.chatStream("test");
      const reader = stream.getReader();
      const chunks: string[] = [];
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
      }

      expect(chunks).toEqual(["no-space"]);
    });

    it("throws on non-ok response with body text", async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 502,
        text: () => Promise.resolve("Bad Gateway"),
      });

      const stream = providerAdapter.chatStream("test");
      const reader = stream.getReader();
      await expect(reader.read()).rejects.toThrow("stream failed: 502 Bad Gateway");
    });
  });

  describe("structured", () => {
    it("returns parsed JSON object", async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            choices: [{ message: { content: JSON.stringify({ name: "test", score: 85 }) } }],
            usage: { prompt_tokens: 15, completion_tokens: 5 },
          }),
      });

      const result = await providerAdapter.structured("Parse this", {
        schema: { type: "object", properties: { name: { type: "string" }, score: { type: "number" } } },
      });

      expect(result.object).toEqual({ name: "test", score: 85 });
      expect(result.usage).toEqual({ promptTokens: 15, completionTokens: 5 });
    });

    it("sends response_format without schema field (gateway contract)", async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            choices: [{ message: { content: "{}" } }],
          }),
      });
      globalThis.fetch = fetchMock;

      await providerAdapter.structured("test", {
        schema: { type: "object", properties: {} },
      });

      const callBody = JSON.parse(fetchMock.mock.calls[0][1].body);
      expect(callBody.response_format).toEqual({ type: "json_object" });
      expect(callBody.response_format).not.toHaveProperty("schema");
    });

    it("throws on non-ok response", async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        text: () => Promise.resolve("Bad Request"),
      });

      await expect(
        providerAdapter.structured("test", { schema: { type: "object", properties: {} } }),
      ).rejects.toThrow("structured completion failed: 400");
    });
  });

  describe("embed", () => {
    it("returns embeddings from gateway", async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            data: [{ embedding: [0.1, 0.2, 0.3] }, { embedding: [0.4, 0.5, 0.6] }],
            usage: { prompt_tokens: 10 },
          }),
      });

      const result = await providerAdapter.embed(["hello", "world"]);

      expect(result.embeddings).toHaveLength(2);
      expect(result.embeddings[0]).toEqual([0.1, 0.2, 0.3]);
      expect(result.usage).toEqual({ promptTokens: 10 });
    });

    it("throws on non-ok response", async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 503,
        text: () => Promise.resolve("Service Unavailable"),
      });

      await expect(providerAdapter.embed(["test"])).rejects.toThrow("embedding failed: 503");
    });
  });
});
