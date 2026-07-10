import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";

import { findGroqModelsConfigPath } from "./groq-models-path";
import {
  assertGroqTierCapabilities,
  GEMINI_MODELS,
  getGroqModelEntry,
  loadGroqModelsConfig,
  resolveAiProvider,
  resolveAiRoutingMode,
  resolveGatewayModelId,
  resolveGroqModelId,
  resolveModel,
  resolveProviderOptions,
  shouldRouteTierViaGateway,
} from "./provider";

describe("AI provider (GROQ-002 / GROQ-004)", () => {
  const original = {
    AI_PROVIDER: process.env.AI_PROVIDER,
    AI_ROUTING_MODE: process.env.AI_ROUTING_MODE,
    AI_GATEWAY_URL: process.env.AI_GATEWAY_URL,
    AI_GATEWAY_API_KEY: process.env.AI_GATEWAY_API_KEY,
    AI_MODEL_DEFAULT: process.env.AI_MODEL_DEFAULT,
    AI_MODEL_FAST: process.env.AI_MODEL_FAST,
    AI_MODEL_STRUCTURED: process.env.AI_MODEL_STRUCTURED,
    AI_GATEWAY_ALLOW_TOOL_TIERS: process.env.AI_GATEWAY_ALLOW_TOOL_TIERS,
    GROQ_API_KEY: process.env.GROQ_API_KEY,
    GEMINI_API_KEY: process.env.GEMINI_API_KEY,
    GEMINI_MODEL: process.env.GEMINI_MODEL,
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

  it("loads SSOT allowlist from bundled groq-models.ssot.json", () => {
    const disk = loadGroqModelsConfig();
    expect(getGroqModelEntry(disk.defaults.default)).toBeDefined();
    expect(disk.models.length).toBeGreaterThan(0);
  });

  it("keeps groq-models.ssot.json in sync with config/groq-models.json", () => {
    const repoConfig = join(process.cwd(), "..", "config", "groq-models.json");
    const onDisk = JSON.parse(readFileSync(repoConfig, "utf8"));
    // $schema is intentionally stripped from the bundled copy (dangling relative path there).
    delete onDisk.$schema;
    expect(loadGroqModelsConfig()).toEqual(onDisk);
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

    it("throws a clear, diagnostic error instead of silently falling back to a hardcoded guess when no config exists", () => {
      const root = mkdtempSync(join(tmpdir(), "groq-path-missing-test-"));
      try {
        // No config/groq-models.json anywhere under `root` — every ancestor hop should fail.
        expect(() => findGroqModelsConfigPath(root)).toThrow(
          /Could not find config\/groq-models\.json within \d+ ancestor directories/,
        );
      } finally {
        rmSync(root, { recursive: true, force: true });
      }
    });
  });

  it("resolveModel uses Gemini when AI_PROVIDER=gemini", () => {
    process.env.AI_PROVIDER = "gemini";
    process.env.GEMINI_API_KEY = "test-key";
    delete process.env.GEMINI_MODEL;
    delete process.env.AI_ROUTING_MODE;
    const model = resolveModel();
    expect(model.provider).toBe("google.generative-ai");
    expect(model.modelId).toBe(GEMINI_MODELS.default);
    expect(getGroqModelEntry("llama-3.3-70b-versatile")?.parallelTools).toBe(true);
  });

  it("resolveModel uses Groq when AI_PROVIDER=groq (no live key needed — client construction only)", () => {
    process.env.AI_PROVIDER = "groq";
    process.env.GROQ_API_KEY = "test-groq-key";
    delete process.env.AI_ROUTING_MODE;
    const model = resolveModel("default");
    expect(model.provider).toBe("groq.chat");
    expect(model.modelId).toBe("llama-3.3-70b-versatile");
  });

  it("resolveModel throws without GROQ_API_KEY when AI_PROVIDER=groq", () => {
    process.env.AI_PROVIDER = "groq";
    delete process.env.GROQ_API_KEY;
    delete process.env.AI_ROUTING_MODE;
    expect(() => resolveModel("default")).toThrow(/GROQ_API_KEY is required/);
  });

  describe("AI_ROUTING_MODE=gateway (IPI-454 AC-F)", () => {
    it("routes tool-free fast tier through openai-compatible gateway", () => {
      process.env.AI_ROUTING_MODE = "gateway";
      process.env.AI_GATEWAY_URL = "http://gateway.test:8787";
      process.env.AI_GATEWAY_API_KEY = "gw-key";
      delete process.env.AI_MODEL_FAST;
      delete process.env.AI_GATEWAY_ALLOW_TOOL_TIERS;
      const model = resolveModel("fast");
      expect(model.provider).toBe("ipix-ai-gateway.chat");
      expect(model.modelId).toBe("fast");
    });

    it("defaults base to localhost:8787 when AI_GATEWAY_URL unset", () => {
      process.env.AI_ROUTING_MODE = "gateway";
      delete process.env.AI_GATEWAY_URL;
      delete process.env.AI_GATEWAY_API_KEY;
      delete process.env.AI_GATEWAY_ALLOW_TOOL_TIERS;
      const model = resolveModel("fast");
      expect(model.provider).toBe("ipix-ai-gateway.chat");
      expect(model.modelId).toBe("fast");
    });

    it("sends Worker registry keys, not Gemini model ids", () => {
      process.env.AI_ROUTING_MODE = "gateway";
      process.env.AI_GATEWAY_ALLOW_TOOL_TIERS = "1";
      delete process.env.AI_MODEL_STRUCTURED;
      expect(resolveGatewayModelId("structured")).toBe("structured");
      expect(resolveModel("structured").modelId).toBe("structured");
    });

    it("ignores Gemini-id AI_MODEL_* overrides (would miss Worker registry)", () => {
      process.env.AI_MODEL_STRUCTURED = "gemini-3.1-pro-preview";
      expect(resolveGatewayModelId("structured")).toBe("structured");
    });

    it("honors AI_MODEL_* overrides only when they are Worker registry keys", () => {
      process.env.AI_MODEL_FAST = "structured";
      expect(resolveGatewayModelId("fast")).toBe("structured");
    });

    it("keeps vision on direct Gemini when gateway mode is on", () => {
      process.env.AI_ROUTING_MODE = "gateway";
      process.env.AI_PROVIDER = "gemini";
      process.env.GEMINI_API_KEY = "test-gemini-key";
      delete process.env.GEMINI_MODEL;
      delete process.env.GROQ_MODEL_VISION;
      delete process.env.AI_GATEWAY_ALLOW_TOOL_TIERS;
      expect(shouldRouteTierViaGateway("vision")).toBe(false);
      const model = resolveModel("vision");
      expect(model.provider).toBe("google.generative-ai");
      expect(model.modelId).toBe(GEMINI_MODELS.default);
    });

    it("keeps default/structured on direct so Mastra tools stay on the SDK path", () => {
      process.env.AI_ROUTING_MODE = "gateway";
      process.env.AI_PROVIDER = "gemini";
      process.env.GEMINI_API_KEY = "test-gemini-key";
      delete process.env.AI_GATEWAY_ALLOW_TOOL_TIERS;
      expect(shouldRouteTierViaGateway("default")).toBe(false);
      expect(shouldRouteTierViaGateway("structured")).toBe(false);
      expect(resolveModel("default").provider).toBe("google.generative-ai");
    });

    it("allows tool tiers through gateway only with AI_GATEWAY_ALLOW_TOOL_TIERS=1", () => {
      process.env.AI_ROUTING_MODE = "gateway";
      process.env.AI_GATEWAY_ALLOW_TOOL_TIERS = "1";
      expect(shouldRouteTierViaGateway("default")).toBe(true);
      expect(resolveModel("default").provider).toBe("ipix-ai-gateway.chat");
      expect(resolveModel("default").modelId).toBe("default");
    });

    it("keeps Gemini provider options when gateway mode is on (tool tiers stay direct)", () => {
      process.env.AI_ROUTING_MODE = "gateway";
      process.env.AI_PROVIDER = "gemini";
      expect(resolveProviderOptions()).toEqual({
        google: { thinkingConfig: { thinkingBudget: 0 } },
      });
    });

    it("rejects invalid AI_ROUTING_MODE", () => {
      process.env.AI_ROUTING_MODE = "banana";
      expect(() => resolveAiRoutingMode()).toThrow(/AI_ROUTING_MODE/);
    });
  });

  describe("vision tier guard (A6 — defer Groq cutover until golden eval)", () => {
    it("forces Gemini for vision tier when AI_PROVIDER=groq and GROQ_MODEL_VISION is unset", () => {
      process.env.AI_PROVIDER = "groq";
      process.env.GROQ_API_KEY = "test-groq-key";
      process.env.GEMINI_API_KEY = "test-gemini-key";
      delete process.env.GROQ_MODEL_VISION;
      delete process.env.GEMINI_MODEL;
      const model = resolveModel("vision");
      expect(model.provider).toBe("google.generative-ai");
      expect(model.modelId).toBe(GEMINI_MODELS.default);
    });

    it("uses Groq for vision tier once GROQ_MODEL_VISION is explicitly configured", () => {
      process.env.AI_PROVIDER = "groq";
      process.env.GROQ_API_KEY = "test-groq-key";
      process.env.GROQ_MODEL_VISION = "meta-llama/llama-4-scout-17b-16e-instruct";
      const model = resolveModel("vision");
      expect(model.provider).toBe("groq.chat");
      expect(model.modelId).toBe("meta-llama/llama-4-scout-17b-16e-instruct");
    });

    it("still uses Gemini for vision tier when AI_PROVIDER=gemini regardless of GROQ_MODEL_VISION", () => {
      process.env.AI_PROVIDER = "gemini";
      process.env.GEMINI_API_KEY = "test-gemini-key";
      delete process.env.GROQ_MODEL_VISION;
      delete process.env.GEMINI_MODEL;
      const model = resolveModel("vision");
      expect(model.provider).toBe("google.generative-ai");
      expect(model.modelId).toBe(GEMINI_MODELS.default);
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
