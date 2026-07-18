import { afterEach, describe, expect, it, vi } from "vitest";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe("mastra import chain (CopilotKit /info module init)", () => {
  it("loads when DATABASE_URL is missing in production (InMemoryStore fallback)", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("DATABASE_URL", "");
    vi.stubEnv("GEMINI_API_KEY", "test-key");
    await expect(import("./index")).resolves.toBeDefined();
  });
});
