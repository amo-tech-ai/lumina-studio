import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

import {
  createProviderAdapter,
  providerAdapter,
  DEFAULT_AI_GATEWAY_URL,
} from "./provider-adapter";

describe("providerAdapter / createProviderAdapter", () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("AI_GATEWAY_URL", "http://localhost:8787");
    vi.stubEnv("AI_GATEWAY_API_KEY", "test-key");
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  describe("factory configuration", () => {
    it("uses explicit baseUrl when provided", async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ choices: [{ message: { content: "ok" } }] }),
      });
      globalThis.fetch = fetchMock;

      const adapter = createProviderAdapter({ baseUrl: "http://custom-gateway:9999" });
      await adapter.chat("test");

      expect(fetchMock.mock.calls[0][0]).toBe("http://custom-gateway:9999/v1/chat/completions");
    });

    it("uses explicit apiKey when provided", async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ choices: [{ message: { content: "ok" } }] }),
      });
      globalThis.fetch = fetchMock;

      const adapter = createProviderAdapter({ apiKey: "explicit-key" });
      await adapter.chat("test");

      expect(fetchMock.mock.calls[0][1].headers["Authorization"]).toBe("Bearer explicit-key");
    });

    it("falls back to env vars when no explicit options", async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ choices: [{ message: { content: "ok" } }] }),
      });
      globalThis.fetch = fetchMock;

      const adapter = createProviderAdapter();
      await adapter.chat("test");

      expect(fetchMock.mock.calls[0][0]).toBe("http://localhost:8787/v1/chat/completions");
      expect(fetchMock.mock.calls[0][1].headers["Authorization"]).toBe("Bearer test-key");
    });

    it(`defaults to ${DEFAULT_AI_GATEWAY_URL} when no env or explicit URL`, async () => {
      vi.stubEnv("AI_GATEWAY_URL", undefined);
      vi.stubEnv("AI_GATEWAY_API_KEY", undefined);

      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ choices: [{ message: { content: "ok" } }] }),
      });
      globalThis.fetch = fetchMock;

      const adapter = createProviderAdapter();
      await adapter.chat("test");

      expect(fetchMock.mock.calls[0][0]).toBe(`${DEFAULT_AI_GATEWAY_URL}/v1/chat/completions`);
    });

    it("omits Authorization header when no API key", async () => {
      vi.stubEnv("AI_GATEWAY_API_KEY", undefined);

      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ choices: [{ message: { content: "ok" } }] }),
      });
      globalThis.fetch = fetchMock;

      await createProviderAdapter().chat("test");

      expect(fetchMock.mock.calls[0][1].headers["Authorization"]).toBeUndefined();
    });
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

      expect((await providerAdapter.chat("empty")).text).toBe("");
    });

    it("returns empty text when choices is missing", async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({}),
      });

      expect((await createProviderAdapter().chat("test")).text).toBe("");
    });

    it("throws on non-ok response with body text", async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 503,
        text: () => Promise.resolve("Service Unavailable"),
      });

      await expect(providerAdapter.chat("test")).rejects.toThrow(
        "chat completion failed: 503 Service Unavailable",
      );
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

    it("stream cancel aborts the fetch", async () => {
      let abortSignal: AbortSignal | undefined;
      globalThis.fetch = vi.fn().mockImplementation((_url, init) => {
        abortSignal = init.signal;
        return new Promise(() => {
          // hung gateway
        });
      });

      const adapter = createProviderAdapter({ timeoutMs: 60_000 });
      const stream = adapter.chatStream("test");
      const reader = stream.getReader();

      void reader.read().catch(() => {});
      await new Promise((r) => setTimeout(r, 10));
      await reader.cancel("test cancel");

      expect(abortSignal?.aborted).toBe(true);
    });

    it("stream timeout aborts fetch and errors the reader", async () => {
      let abortSignal: AbortSignal | undefined;
      globalThis.fetch = vi.fn().mockImplementation((_url, init) => {
        abortSignal = init.signal;
        return new Promise((_resolve, reject) => {
          init.signal?.addEventListener(
            "abort",
            () => reject(init.signal.reason ?? new Error("Aborted")),
            { once: true },
          );
        });
      });

      const adapter = createProviderAdapter({ timeoutMs: 30 });
      const stream = adapter.chatStream("test");
      const reader = stream.getReader();

      await expect(reader.read()).rejects.toThrow(/Gateway timeout after 30ms/);
      expect(abortSignal?.aborted).toBe(true);
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
        schema: {
          type: "object",
          properties: { name: { type: "string" }, score: { type: "number" } },
        },
      });

      expect(result.object).toEqual({ name: "test", score: 85 });
      expect(result.usage).toEqual({ promptTokens: 15, completionTokens: 5 });
    });

    it("sends response_format without schema field (gateway contract)", async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ choices: [{ message: { content: "{}" } }] }),
      });
      globalThis.fetch = fetchMock;

      await providerAdapter.structured("test", {
        schema: { type: "object", properties: {} },
      });

      const callBody = JSON.parse(fetchMock.mock.calls[0][1].body);
      expect(callBody.response_format).toEqual({ type: "json_object" });
      expect(callBody.response_format).not.toHaveProperty("schema");
    });

    it("returns empty object when structured content is empty", async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ choices: [{ message: { content: "" } }] }),
      });

      const result = await createProviderAdapter().structured("test", { schema: {} });
      expect(result.object).toEqual({});
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

    it("defaults model to Worker embedding tier key", async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            data: [{ embedding: [0.1] }],
            usage: { prompt_tokens: 1 },
          }),
      });
      globalThis.fetch = fetchMock;

      await providerAdapter.embed(["hello"]);

      const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
      expect(JSON.parse(String(init.body))).toMatchObject({ model: "embedding" });
    });

    it("throws on non-ok response with body text", async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 503,
        text: () => Promise.resolve("Service Unavailable"),
      });

      await expect(providerAdapter.embed(["test"])).rejects.toThrow(
        "embedding failed: 503 Service Unavailable",
      );
    });
  });

  describe("timeout", () => {
    it("aborts chat request after timeout", async () => {
      globalThis.fetch = vi.fn().mockImplementation((_url, init) => {
        return new Promise((_resolve, reject) => {
          init.signal?.addEventListener("abort", () => {
            reject(new Error("Aborted"));
          });
        });
      });

      const adapter = createProviderAdapter({ timeoutMs: 50 });
      await expect(adapter.chat("test")).rejects.toThrow();
    });
  });
});
