import { describe, expect, it } from "vitest";
import { buildPanelData } from "./build-panel-data";

describe("buildPanelData", () => {
  const brand = {
    id: "11111111-1111-1111-1111-111111111111",
    name: "Acme",
    intake_status: "scores_complete",
  };

  it("aggregates DNA pillars and pending draft approvals", () => {
    const result = buildPanelData(
      brand,
      [
        { score_type: "visual", score: 80 },
        { score_type: "audience", score: 70 },
        { score_type: "consistency", score: 90 },
        { score_type: "commerce_readiness", score: 60 },
      ],
      [
        {
          id: "22222222-2222-2222-2222-222222222222",
          name: "Beta",
          intake_status: "draft_ready",
        },
      ],
    );

    expect(result.scores?.dna).toBe(75);
    expect(result.scores?.pillars.visual).toBe(80);
    expect(result.approvals.pendingCount).toBe(1);
    expect(result.approvals.items[0].href).toBe("/app/brand/22222222-2222-2222-2222-222222222222");
  });

  it("returns portfolio approvals without brand scores when brand is null", () => {
    const result = buildPanelData(null, null, [
      {
        id: "33333333-3333-3333-3333-333333333333",
        name: "Gamma",
        intake_status: "draft_ready",
      },
    ]);

    expect(result.brand).toBeNull();
    expect(result.scores).toBeNull();
    expect(result.approvals.pendingCount).toBe(1);
  });
});
