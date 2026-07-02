import { describe, it, expect } from "vitest";
import {
  collectDevEnvWarnings,
  findUnsatisfiedVendorKeys,
  requirementsForProvider,
  resolveAiProvider,
  shouldRequireIntelligence,
} from "./copilotkit-dev-env.mjs";

describe("copilotkit-dev-env", () => {
  it("defaults AI provider to gemini", () => {
    expect(resolveAiProvider({}, "")).toBe("gemini");
    expect(resolveAiProvider({ AI_PROVIDER: "openai" }, "")).toBe("openai");
  });

  it("requires GEMINI_API_KEY for gemini provider", () => {
    const reqs = requirementsForProvider("gemini");
    expect(reqs[0].key).toBe("GEMINI_API_KEY");
    const missing = findUnsatisfiedVendorKeys({}, "", reqs);
    expect(missing).toHaveLength(1);
  });

  it("requires OPENAI_API_KEY only when AI_PROVIDER=openai", () => {
    const reqs = requirementsForProvider("openai");
    expect(reqs[0].key).toBe("OPENAI_API_KEY");
    const { vendorFailures } = collectDevEnvWarnings(
      { AI_PROVIDER: "openai" },
      "",
    );
    expect(vendorFailures[0].requirement.key).toBe("OPENAI_API_KEY");
  });

  it("does not require Intelligence vars without license token", () => {
    expect(shouldRequireIntelligence({}, "")).toBe(false);
    const { intelligenceFailures } = collectDevEnvWarnings({}, "");
    expect(intelligenceFailures).toHaveLength(0);
  });

  it("requires Intelligence vars when license token is set", () => {
    expect(
      shouldRequireIntelligence({ COPILOTKIT_LICENSE_TOKEN: "ck-abc" }, ""),
    ).toBe(true);
    const { intelligenceFailures } = collectDevEnvWarnings(
      { COPILOTKIT_LICENSE_TOKEN: "ck-abc" },
      "",
    );
    expect(intelligenceFailures.map((e) => e.key)).toEqual([
      "INTELLIGENCE_API_URL",
      "INTELLIGENCE_GATEWAY_WS_URL",
      "INTELLIGENCE_API_KEY",
    ]);
  });

  it("passes when GEMINI_API_KEY is set in process env", () => {
    const { vendorFailures } = collectDevEnvWarnings(
      { GEMINI_API_KEY: "test-key" },
      "",
    );
    expect(vendorFailures).toHaveLength(0);
  });
});
