import { describe, expect, it } from "vitest";
import {
  MAX_EMBED_INPUTS,
  isSupportedEmbeddingModel,
  resolveEmbeddingEntry,
  validateEmbeddingInput,
} from "./embed-validation";
import { mapProviderFailure } from "./gateway-errors";

describe("validateEmbeddingInput", () => {
  it("accepts a non-empty string", () => {
    expect(validateEmbeddingInput("hello")).toEqual({ ok: true, input: "hello" });
  });

  it("accepts a non-empty string array", () => {
    expect(validateEmbeddingInput(["a", "b"])).toEqual({
      ok: true,
      input: ["a", "b"],
    });
  });

  it("rejects empty array", () => {
    const result = validateEmbeddingInput([]);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.message).toMatch(/at least one/);
    }
  });

  it("rejects blank string", () => {
    expect(validateEmbeddingInput("   ").ok).toBe(false);
  });

  it("rejects array with blank element (no silent filter)", () => {
    expect(validateEmbeddingInput(["ok", "  "]).ok).toBe(false);
  });

  it("rejects oversized batch", () => {
    const input = Array.from({ length: MAX_EMBED_INPUTS + 1 }, (_, i) => `t${i}`);
    const result = validateEmbeddingInput(input);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.message).toMatch(/at most/);
    }
  });

  it("rejects non-string input", () => {
    expect(validateEmbeddingInput(42).ok).toBe(false);
  });
});

describe("resolveEmbeddingEntry / allowlist", () => {
  it("resolves embedding tier", () => {
    const entry = resolveEmbeddingEntry("embedding");
    expect(entry?.provider).toBe("workers-ai");
    expect(entry?.model).toBe("@cf/baai/bge-base-en-v1.5");
  });

  it("resolves explicit Workers AI model id", () => {
    expect(resolveEmbeddingEntry("@cf/baai/bge-base-en-v1.5")?.model).toBe(
      "@cf/baai/bge-base-en-v1.5",
    );
  });

  it("rejects chat default tier (no silent remap)", () => {
    expect(resolveEmbeddingEntry("default")).toBeUndefined();
    expect(isSupportedEmbeddingModel("default")).toBe(false);
  });

  it("rejects gemini chat model ids", () => {
    expect(resolveEmbeddingEntry("gemini-3.1-flash-lite")).toBeUndefined();
    expect(isSupportedEmbeddingModel("gemini-3.1-flash-lite")).toBe(false);
  });
});

describe("mapProviderFailure", () => {
  it("maps 429 to rate limited", () => {
    const mapped = mapProviderFailure(new Error("Workers AI embedding error 429: slow down"));
    expect(mapped).toMatchObject({
      status: 429,
      code: "provider_rate_limited",
      retryable: true,
      providerStatus: 429,
    });
  });

  it("maps unknown provider errors to 502 provider_error", () => {
    const mapped = mapProviderFailure(new Error("Workers AI embedding error 404: not found"));
    expect(mapped).toMatchObject({
      status: 502,
      code: "provider_error",
      retryable: false,
      providerStatus: 404,
    });
  });
});
