import { afterEach, describe, expect, it } from "vitest";

import {
  assertGroqTierCapabilities,
  getGroqModelEntry,
  loadGroqModelsConfig,
  resolveAiProvider,
  resolveGroqModelId,
  resolveModel,
} from "./provider";

describe("AI provider (GROQ-002)", () => {
  const original = {
    AI_PROVIDER: process.env.AI_PROVIDER,
    GROQ_API_KEY: process.env.GROQ_API_KEY,
    GROQ_MODEL_DEFAULT: process.env.GROQ_MODEL_DEFAULT,
    GROQ_MODEL_STRUCTURED: process.env.GROQ_MODEL_STRUCTURED,
  };

  afterEach(() => {
    for (const [key, value] of Object.entries(original)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  });

  it("defaults AI_PROVIDER to gemini", () => {
    delete process.env.AI_PROVIDER;
    expect(resolveAiProvider()).toBe("gemini");
  });

  it("rejects unknown AI_PROVIDER values", () => {
    process.env.AI_PROVIDER = "anthropic";
    expect(() => resolveAiProvider()).toThrow(/invalid/);
  });

  it("resolveGroqModelId reads env override then defaults", () => {
    const disk = loadGroqModelsConfig();
    delete process.env.GROQ_MODEL_DEFAULT;
    expect(resolveGroqModelId("default")).toBe(disk.defaults.default);
    process.env.GROQ_MODEL_DEFAULT = "qwen/qwen3-32b";
    expect(resolveGroqModelId("default")).toBe("qwen/qwen3-32b");
  });

  it("flags allowlist entries missing from groq-models.json", () => {
    process.env.GROQ_MODEL_STRUCTURED = "not-in-allowlist";
    expect(() => resolveGroqModelId("structured")).toThrow(/allowlist/);
  });

  it("assertGroqTierCapabilities enforces strict JSON tier", () => {
    process.env.GROQ_MODEL_STRUCTURED = "openai/gpt-oss-20b";
    const entry = assertGroqTierCapabilities("structured", { strictJson: true });
    expect(entry.strictStructured).toBe(true);
  });

  it("assertGroqTierCapabilities rejects gpt-oss for parallel tools", () => {
    process.env.GROQ_MODEL_DEFAULT = "openai/gpt-oss-120b";
    expect(() =>
      assertGroqTierCapabilities("default", { parallelTools: true }),
    ).toThrow(/parallel tool/);
  });

  it("assertGroqTierCapabilities accepts llama for parallel tools", () => {
    process.env.GROQ_MODEL_DEFAULT = "llama-3.3-70b-versatile";
    const entry = assertGroqTierCapabilities("default", { parallelTools: true });
    expect(entry.parallelTools).toBe(true);
  });

  it("loads SSOT allowlist from repo config/groq-models.json", () => {
    const disk = loadGroqModelsConfig();
    expect(getGroqModelEntry(disk.defaults.default)).toBeDefined();
    expect(disk.models.length).toBeGreaterThan(0);
  });

  it("resolveModel uses Gemini when AI_PROVIDER=gemini", () => {
    process.env.AI_PROVIDER = "gemini";
    process.env.GEMINI_API_KEY = "test-key";
    const model = resolveModel();
    expect(model).toBeDefined();
    expect(getGroqModelEntry("llama-3.3-70b-versatile")?.parallelTools).toBe(true);
  });
});
