import { describe, expect, it } from "vitest";
import { buildPortfolioPanelData } from "./build-portfolio-panel-data";

describe("buildPortfolioPanelData", () => {
  const brands = [
    {
      id: "11111111-1111-1111-1111-111111111111",
      name: "Nike",
      intake_status: "scores_complete",
    },
    {
      id: "22222222-2222-2222-2222-222222222222",
      name: "Adidas",
      intake_status: "scores_complete",
    },
  ];

  it("aggregates avg DNA and per-brand health rows", () => {
    const result = buildPortfolioPanelData(
      brands,
      [
        { brand_id: brands[0].id, score_type: "visual", score: 72 },
        { brand_id: brands[0].id, score_type: "audience", score: 85 },
        { brand_id: brands[0].id, score_type: "consistency", score: 88 },
        { brand_id: brands[0].id, score_type: "commerce_readiness", score: 81 },
        { brand_id: brands[1].id, score_type: "visual", score: 90 },
        { brand_id: brands[1].id, score_type: "audience", score: 92 },
        { brand_id: brands[1].id, score_type: "consistency", score: 91 },
        { brand_id: brands[1].id, score_type: "commerce_readiness", score: 89 },
      ],
      [],
    );

    expect(result.portfolio?.brandCount).toBe(2);
    expect(result.portfolio?.avgDna).toBe(87);
    expect(result.portfolio?.healthRows).toHaveLength(2);
    expect(result.portfolio?.needsAttention?.brandName).toBe("Nike");
    expect(result.portfolio?.needsAttention?.score).toBe(72);
  });
});
