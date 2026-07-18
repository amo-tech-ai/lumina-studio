import { afterEach, describe, expect, it, vi } from "vitest";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("isCopilotIntelligenceEnabled", () => {
  it("returns false when license token is missing", async () => {
    const { isCopilotIntelligenceEnabled } = await import("./intelligence-config");
    expect(isCopilotIntelligenceEnabled()).toBe(false);
  });

  it("returns false when license is set but intelligence vars are incomplete", async () => {
    vi.stubEnv("COPILOTKIT_LICENSE_TOKEN", "ck-test");
    vi.stubEnv("INTELLIGENCE_API_KEY", "intel-key");
    const { isCopilotIntelligenceEnabled } = await import("./intelligence-config");
    expect(isCopilotIntelligenceEnabled()).toBe(false);
  });

  it("returns true when license and all intelligence vars are set", async () => {
    vi.stubEnv("COPILOTKIT_LICENSE_TOKEN", "ck-test");
    vi.stubEnv("INTELLIGENCE_API_KEY", "intel-key");
    vi.stubEnv("INTELLIGENCE_API_URL", "https://intel.example");
    vi.stubEnv("INTELLIGENCE_GATEWAY_WS_URL", "wss://intel.example/ws");
    const { isCopilotIntelligenceEnabled } = await import("./intelligence-config");
    expect(isCopilotIntelligenceEnabled()).toBe(true);
  });
});
