import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

import { providerAdapter } from "./provider-adapter";

describe("providerAdapter", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.AI_GATEWAY_URL = "http://localhost:4111";
    process.env.AI_GATEWAY_API_KEY = "test-key";
  });

  afterEach(() => {
    process.env = { ...originalEnv };
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
