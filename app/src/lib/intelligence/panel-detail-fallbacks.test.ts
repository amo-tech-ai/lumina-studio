import { describe, expect, it } from "vitest";

import { resolveBrandDetailExtras } from "./panel-detail-fallbacks";
import type { IntelligencePanelData } from "./panel-contract";

const BRAND_ID = "11111111-1111-1111-1111-111111111111";

const baseData: IntelligencePanelData = {
  brand: { id: BRAND_ID, name: "Acme", status: "ready" },
  scores: {
    dna: 87,
    pillars: { visual: 72, audience: 90, consistency: 88, commerce_readiness: 81 },
  },
};

describe("resolveBrandDetailExtras", () => {
  it("does not fabricate DNA history when API omits dnaHistory", () => {
    const extras = resolveBrandDetailExtras(baseData, BRAND_ID);
    expect(extras.dnaHistory).toBeUndefined();
  });

  it("passes through real DNA history from API", () => {
    const history = [
      { date: "Jan 5", score: 80, note: "Baseline crawl", barHeight: "80%" },
    ];
    const extras = resolveBrandDetailExtras({ ...baseData, dnaHistory: history }, BRAND_ID);
    expect(extras.dnaHistory).toEqual(history);
  });

  it("still resolves visual identity when dnaHistory is absent", () => {
    const extras = resolveBrandDetailExtras(baseData, BRAND_ID);
    expect(extras.visualIdentity?.visualScore).toBe(72);
    expect(extras.visualIdentity?.sampleUrls.length).toBeGreaterThan(0);
  });
});
