import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../agents", () => ({
  socialDiscoveryAgent: { generate: vi.fn() },
  visualIdentityAgent: { generate: vi.fn() },
}));

import { socialDiscoveryAgent, visualIdentityAgent } from "../agents";
import {
  brandIntelligenceWorkflow,
  fanOutEnrichment,
} from "./brand-intelligence-workflow";

describe("brand-intelligence workflow", () => {
  it("has the correct workflow id", () => {
    expect(brandIntelligenceWorkflow.id).toBe("brand-intelligence");
  });
});

// Enrichment is best-effort: a failing agent must not block HITL approval, but the
// step must report whether anything actually succeeded (not a blanket enriched:true).
describe("fan-out-enrichment", () => {
  const social = vi.mocked(socialDiscoveryAgent.generate);
  const visual = vi.mocked(visualIdentityAgent.generate);
  const ctx = { getInitData: () => ({ brandId: "b1" }) } as never;

  beforeEach(() => vi.clearAllMocks());

  it("reports enriched=false when both agents reject", async () => {
    social.mockRejectedValue(new Error("social boom"));
    visual.mockRejectedValue(new Error("visual boom"));
    expect((await fanOutEnrichment.execute(ctx)).enriched).toBe(false);
  });

  it("reports enriched=true when at least one agent succeeds", async () => {
    social.mockResolvedValue({} as never);
    visual.mockRejectedValue(new Error("visual boom"));
    expect((await fanOutEnrichment.execute(ctx)).enriched).toBe(true);
  });
});
