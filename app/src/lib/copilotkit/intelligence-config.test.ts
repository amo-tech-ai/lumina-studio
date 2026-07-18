import { afterEach, describe, expect, it, vi } from "vitest";

import { COPILOT_INTELLIGENCE_ENV_KEYS } from "./intelligence-config";

function stubIntelligenceEnvUnset(): void {
  for (const key of COPILOT_INTELLIGENCE_ENV_KEYS) {
    vi.stubEnv(key, "");
  }
}

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("isCopilotIntelligenceEnvComplete", () => {
  it("returns false when license token is missing", async () => {
    stubIntelligenceEnvUnset();
    const { isCopilotIntelligenceEnvComplete } = await import("./intelligence-config");
    expect(isCopilotIntelligenceEnvComplete()).toBe(false);
  });

  it("returns false when license is set but intelligence vars are incomplete", async () => {
    stubIntelligenceEnvUnset();
    vi.stubEnv("COPILOTKIT_LICENSE_TOKEN", "ck-test");
    vi.stubEnv("INTELLIGENCE_API_KEY", "intel-key");
    const { isCopilotIntelligenceEnvComplete } = await import("./intelligence-config");
    expect(isCopilotIntelligenceEnvComplete()).toBe(false);
  });

  it("returns true when license and all intelligence vars are set", async () => {
    stubIntelligenceEnvUnset();
    vi.stubEnv("COPILOTKIT_LICENSE_TOKEN", "ck-test");
    vi.stubEnv("INTELLIGENCE_API_KEY", "intel-key");
    vi.stubEnv("INTELLIGENCE_API_URL", "https://intel.example");
    vi.stubEnv("INTELLIGENCE_GATEWAY_WS_URL", "wss://intel.example/ws");
    const { isCopilotIntelligenceEnvComplete } = await import("./intelligence-config");
    expect(isCopilotIntelligenceEnvComplete()).toBe(true);
  });
});

describe("isCopilotKitThreadsEnabled", () => {
  it("returns false when env is incomplete", async () => {
    stubIntelligenceEnvUnset();
    const { isCopilotKitThreadsEnabled } = await import("./intelligence-config");
    expect(isCopilotKitThreadsEnabled()).toBe(false);
  });

  it("returns false when env is complete but CopilotKitIntelligence is not wired", async () => {
    stubIntelligenceEnvUnset();
    vi.stubEnv("COPILOTKIT_LICENSE_TOKEN", "ck-test");
    vi.stubEnv("INTELLIGENCE_API_KEY", "intel-key");
    vi.stubEnv("INTELLIGENCE_API_URL", "https://intel.example");
    vi.stubEnv("INTELLIGENCE_GATEWAY_WS_URL", "wss://intel.example/ws");
    const { isCopilotKitThreadsEnabled } = await import("./intelligence-config");
    expect(isCopilotKitThreadsEnabled()).toBe(false);
  });
});
