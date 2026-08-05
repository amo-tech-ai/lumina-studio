import { describe, expect, it } from "vitest";

import {
  MissingCloudflareAiBindingError,
  UnsupportedCapabilityError,
  UnsupportedTierError,
} from "./gateway-errors";

describe("MissingCloudflareAiBindingError", () => {
  it("names the agent that had no AI binding", () => {
    const error = new MissingCloudflareAiBindingError("production-planner");

    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe("MissingCloudflareAiBindingError");
    expect(error.message).toBe(
      'env.AI is not available for agent "production-planner" — falling back to legacy.',
    );
  });
});

describe("UnsupportedTierError", () => {
  it("names the tier with no Workers AI capability entry", () => {
    const error = new UnsupportedTierError("vision");

    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe("UnsupportedTierError");
    expect(error.message).toBe(
      'No Workers AI capability entry for tier "vision" — falling back to legacy.',
    );
  });
});

describe("UnsupportedCapabilityError", () => {
  it("names both the tier and the missing capability", () => {
    const error = new UnsupportedCapabilityError("fast", "structured");

    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe("UnsupportedCapabilityError");
    expect(error.message).toBe(
      'Tier "fast" does not support required capability "structured" — falling back to legacy.',
    );
  });
});
