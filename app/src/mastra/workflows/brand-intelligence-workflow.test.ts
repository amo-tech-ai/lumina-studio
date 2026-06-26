import { describe, expect, it, vi } from "vitest";
import { brandIntelligenceWorkflow, fanOutEnrichment } from "./brand-intelligence-workflow";

describe("brand-intelligence workflow", () => {
  it("has the correct workflow id", () => {
    expect(brandIntelligenceWorkflow.id).toBe("brand-intelligence");
  });
});

// fan-out-enrichment guards a wiring bug: if the Mastra runtime/agents are missing it
// must fail loud, and `enriched` must reflect whether any agent actually succeeded.
const ctx = (mastra: unknown) =>
  ({ mastra, getInitData: () => ({ brandId: "b1" }) }) as never;

describe("fan-out-enrichment", () => {
  it("throws when the Mastra runtime is not injected", async () => {
    await expect(fanOutEnrichment.execute(ctx(undefined))).rejects.toThrow(
      /runtime not injected/,
    );
  });

  it("throws when an enrichment agent is missing", async () => {
    const mastra = {
      getAgent: (id: string) =>
        id === "social-discovery" ? { generate: vi.fn() } : undefined,
    };
    await expect(fanOutEnrichment.execute(ctx(mastra))).rejects.toThrow(
      /missing enrichment agent/,
    );
  });

  it("reports enriched=false when both agents reject, true when one succeeds", async () => {
    const reject = { generate: () => Promise.reject(new Error("boom")) };
    const ok = { generate: () => Promise.resolve({}) };
    const bothFail = { getAgent: () => reject };
    const oneOk = {
      getAgent: (id: string) => (id === "social-discovery" ? ok : reject),
    };
    expect((await fanOutEnrichment.execute(ctx(bothFail))).enriched).toBe(false);
    expect((await fanOutEnrichment.execute(ctx(oneOk))).enriched).toBe(true);
  });
});
