import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const mockDoGenerate = vi.fn();
const mockDoStream = vi.fn();

vi.mock("@ai-sdk/openai-compatible", () => ({
  createOpenAICompatible: () => ({
    chatModel: () => ({
      doGenerate: (...args: unknown[]) => mockDoGenerate(...args),
      doStream: (...args: unknown[]) => mockDoStream(...args),
    }),
  }),
}));

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
  });

  describe("chat", () => {
    it("returns text from default tier", async () => {
      mockDoGenerate.mockResolvedValue({
        text: "Hello from AI",
        usage: { promptTokens: 10, completionTokens: 20 },
      });

      const result = await providerAdapter.chat("Say hello");

      expect(result.text).toBe("Hello from AI");
      expect(result.usage).toEqual({ promptTokens: 10, completionTokens: 20 });
    });

    it("passes temperature and maxTokens", async () => {
      mockDoGenerate.mockResolvedValue({ text: "ok" });

      await providerAdapter.chat("test", { temperature: 0.1, maxTokens: 100 });

      const callArgs = mockDoGenerate.mock.calls[0][0];
      expect(callArgs.temperature).toBe(0.1);
      expect(callArgs.maxTokens).toBe(100);
    });

    it("returns empty text on no response", async () => {
      mockDoGenerate.mockResolvedValue({});

      const result = await providerAdapter.chat("empty");

      expect(result.text).toBe("");
    });
  });

  describe("chatStream", () => {
    it("returns a readable stream", async () => {
      const asyncIterable = {
        [Symbol.asyncIterator]() {
          const chunks = [
            { type: "text-delta" as const, textDelta: "Hello " },
            { type: "text-delta" as const, textDelta: "world" },
          ];
          let i = 0;
          return {
            next() {
              if (i < chunks.length) return Promise.resolve({ value: chunks[i++], done: false });
              return Promise.resolve({ value: undefined, done: true });
            },
          };
        },
      };

      mockDoStream.mockResolvedValue({ stream: asyncIterable });

      const stream = providerAdapter.chatStream("test");
      const reader = stream.getReader();
      const chunks: string[] = [];

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(new TextDecoder().decode(value));
      }

      expect(chunks.join("")).toBe("Hello world");
    });
  });

  describe("structured", () => {
    it("returns parsed JSON object", async () => {
      mockDoGenerate.mockResolvedValue({
        text: JSON.stringify({ name: "test", score: 85 }),
        usage: { promptTokens: 15, completionTokens: 5 },
      });

      const schema = {
        type: "object",
        properties: { name: { type: "string" }, score: { type: "number" } },
      };

      const result = await providerAdapter.structured("Parse this", { schema });

      expect(result.object).toEqual({ name: "test", score: 85 });
      expect(result.usage).toEqual({ promptTokens: 15, completionTokens: 5 });
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
