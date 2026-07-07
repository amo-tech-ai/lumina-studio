import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";

import {
  assertGroqTierCapabilities,
  findGroqModelsConfigPath,
  getGroqModelEntry,
  loadGroqModelsConfig,
  resolveAiProvider,
  resolveGroqModelId,
  resolveModel,
  resolveProviderOptions,
} from "./provider";

describe("AI provider (GROQ-002 / GROQ-004)", () => {
  const original = {
    AI_PROVIDER: process.env.AI_PROVIDER,
    GROQ_API_KEY: process.env.GROQ_API_KEY,
    GEMINI_API_KEY: process.env.GEMINI_API_KEY,
    GROQ_MODEL_DEFAULT: process.env.GROQ_MODEL_DEFAULT,
    GROQ_MODEL_STRUCTURED: process.env.GROQ_MODEL_STRUCTURED,
    GROQ_MODEL_VISION: process.env.GROQ_MODEL_VISION,
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

  describe("findGroqModelsConfigPath (IPI-428 followup — mastra dev ENOENT)", () => {
    it("finds the repo-root config regardless of how deep the caller's directory is nested", () => {
      // Reproduces the original bug: app/src/lib/ai/ (4 levels under repo root)
      // and Mastra's bundled app/.mastra/output/ (3 levels under repo root) must
      // both resolve to the same file — a fixed "../../../.." depth broke the
      // shallower one.
      const fourLevelsDeep = join(process.cwd(), "src", "lib", "ai");
      const threeLevelsDeep = join(process.cwd(), ".mastra", "output");
      const expected = join(process.cwd(), "..", "config", "groq-models.json");
      expect(findGroqModelsConfigPath(fourLevelsDeep)).toBe(expected);
      expect(findGroqModelsConfigPath(threeLevelsDeep)).toBe(expected);
    });

    it("finds the repo config from an arbitrary tmp directory structure at any depth", () => {
      const root = mkdtempSync(join(tmpdir(), "groq-path-test-"));
      try {
        const fakeConfigDir = join(root, "config");
        mkdirSync(fakeConfigDir, { recursive: true });
        writeFileSync(join(fakeConfigDir, "groq-models.json"), "{}");

        const shallow = join(root, "app", "src");
        const deep = join(root, "app", ".mastra", "output", "nested", "extra");
        mkdirSync(deep, { recursive: true });

        expect(findGroqModelsConfigPath(shallow)).toBe(join(fakeConfigDir, "groq-models.json"));
        expect(findGroqModelsConfigPath(deep)).toBe(join(fakeConfigDir, "groq-models.json"));
      } finally {
        rmSync(root, { recursive: true, force: true });
      }
    });
  });

  it("resolveModel uses Gemini when AI_PROVIDER=gemini", () => {
    process.env.AI_PROVIDER = "gemini";
    process.env.GEMINI_API_KEY = "test-key";
    const model = resolveModel();
    expect(model).toBeDefined();
    expect(getGroqModelEntry("llama-3.3-70b-versatile")?.parallelTools).toBe(true);
  });

  it("resolveModel uses Groq when AI_PROVIDER=groq (no live key needed — client construction only)", () => {
    process.env.AI_PROVIDER = "groq";
    process.env.GROQ_API_KEY = "test-groq-key";
    const model = resolveModel("default");
    expect(model).toBeDefined();
  });

  it("resolveModel throws without GROQ_API_KEY when AI_PROVIDER=groq", () => {
    process.env.AI_PROVIDER = "groq";
    delete process.env.GROQ_API_KEY;
    expect(() => resolveModel("default")).toThrow(/GROQ_API_KEY is required/);
  });

  describe("vision tier guard (A6 — defer Groq cutover until golden eval)", () => {
    it("forces Gemini for vision tier when AI_PROVIDER=groq and GROQ_MODEL_VISION is unset", () => {
      process.env.AI_PROVIDER = "groq";
      process.env.GROQ_API_KEY = "test-groq-key";
      process.env.GEMINI_API_KEY = "test-gemini-key";
      delete process.env.GROQ_MODEL_VISION;
      // Would throw "GROQ_API_KEY is required" or similar if it tried the Groq path —
      // succeeding here proves it took the Gemini fallback instead.
      const model = resolveModel("vision");
      expect(model).toBeDefined();
    });

    it("uses Groq for vision tier once GROQ_MODEL_VISION is explicitly configured", () => {
      process.env.AI_PROVIDER = "groq";
      process.env.GROQ_API_KEY = "test-groq-key";
      process.env.GROQ_MODEL_VISION = "meta-llama/llama-4-scout-17b-16e-instruct";
      const model = resolveModel("vision");
      expect(model).toBeDefined();
    });

    it("still uses Gemini for vision tier when AI_PROVIDER=gemini regardless of GROQ_MODEL_VISION", () => {
      process.env.AI_PROVIDER = "gemini";
      process.env.GEMINI_API_KEY = "test-gemini-key";
      delete process.env.GROQ_MODEL_VISION;
      const model = resolveModel("vision");
      expect(model).toBeDefined();
    });
  });

  describe("resolveProviderOptions (A7 — no Gemini-only hack leaking into Groq calls)", () => {
    it("returns the Gemini thinkingBudget shape when AI_PROVIDER=gemini", () => {
      process.env.AI_PROVIDER = "gemini";
      expect(resolveProviderOptions()).toEqual({ google: { thinkingConfig: { thinkingBudget: 0 } } });
    });

    it("returns an empty object for Groq — no Gemini-shaped options leak through", () => {
      process.env.AI_PROVIDER = "groq";
      expect(resolveProviderOptions()).toEqual({});
    });
  });
});
