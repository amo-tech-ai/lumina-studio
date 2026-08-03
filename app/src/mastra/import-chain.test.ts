import { afterEach, describe, expect, it, vi } from "vitest";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe("mastra import chain (CopilotKit /info module init)", () => {
<<<<<<< HEAD
  it("loads when DATABASE_URL is missing in production (lazy storage — no throw at import)", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("VERCEL", "1");
    vi.stubEnv("DATABASE_URL", "");
    vi.stubEnv("GEMINI_API_KEY", "test-key");
    await expect(import("./index")).resolves.toBeDefined();
  });
=======
  // Cold @/mastra import is valid but can exceed Vitest's 5s default under parallel load.
  it(
    "loads when DATABASE_URL is missing in production (lazy storage — no throw at import)",
    { timeout: 20_000 },
    async () => {
      vi.stubEnv("NODE_ENV", "production");
      vi.stubEnv("VERCEL", "1");
      vi.stubEnv("DATABASE_URL", "");
      vi.stubEnv("GEMINI_API_KEY", "test-key");
      await expect(import("./index")).resolves.toBeDefined();
    },
  );
>>>>>>> origin/main
});
