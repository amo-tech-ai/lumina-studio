import { describe, expect, it } from "vitest";

import { resolveHealthPillars } from "./panel-helpers";
import type { IntelligencePanelData } from "./panel-contract";

describe("resolveHealthPillars", () => {
  it("returns explicit health when present", () => {
    const data: IntelligencePanelData = {
      brand: null,
      scores: { dna: 80, pillars: { visual: 90, audience: 70, consistency: 75, commerce_readiness: 60 } },
      health: [{ key: "brand", label: "Brand", score: 80 }],
      approvals: { pendingCount: 0, items: [] },
    };
    expect(resolveHealthPillars(data)).toEqual([{ key: "brand", label: "Brand", score: 80 }]);
  });

  it("derives pillars from scores when health is absent", () => {
    const data: IntelligencePanelData = {
      brand: null,
      scores: { dna: 87, pillars: { visual: 92, audience: 85, consistency: 88, commerce_readiness: 81 } },
      approvals: { pendingCount: 0, items: [] },
    };
    const pillars = resolveHealthPillars(data);
    expect(pillars).toHaveLength(4);
    expect(pillars?.[0]).toMatchObject({ key: "brand", score: 87 });
  });

  it("maps voice pillar from audience score only", () => {
    const data: IntelligencePanelData = {
      brand: null,
      scores: {
        dna: 80,
        pillars: { visual: 90, audience: 85, consistency: 99, commerce_readiness: 60 },
      },
      approvals: { pendingCount: 0, items: [] },
    };
    const pillars = resolveHealthPillars(data);
    expect(pillars?.find((p) => p.key === "voice")).toMatchObject({ score: 85 });
  });

  it("returns null when scores are missing", () => {
    const data: IntelligencePanelData = {
      brand: null,
      scores: null,
      approvals: { pendingCount: 0, items: [] },
    };
    expect(resolveHealthPillars(data)).toBeNull();
  });
});
