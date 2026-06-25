import { describe, it, expect } from "vitest";
import { computeDnaScore, BASE_SCORE_TYPES } from "@/lib/brand-scores";

describe("computeDnaScore", () => {
  it("averages the four base score types", () => {
    const scores = BASE_SCORE_TYPES.map((score_type, i) => ({
      score_type,
      score: (i + 1) * 20,
    }));
    expect(computeDnaScore(scores)).toBe(50);
  });

  it("ignores dna_readiness legacy rows", () => {
    expect(
      computeDnaScore([
        { score_type: "visual", score: 80 },
        { score_type: "audience", score: 80 },
        { score_type: "consistency", score: 80 },
        { score_type: "commerce_readiness", score: 80 },
        { score_type: "dna_readiness", score: 0 },
      ]),
    ).toBe(80);
  });

  it("returns 0 when no base scores", () => {
    expect(computeDnaScore([])).toBe(0);
    expect(computeDnaScore(null)).toBe(0);
    expect(computeDnaScore([{ score_type: "dna_readiness", score: 99 }])).toBe(0);
  });

  it("returns 0 when any base score is missing", () => {
    expect(
      computeDnaScore([
        { score_type: "visual", score: 60 },
        { score_type: "audience", score: 80 },
      ]),
    ).toBe(0);
  });
});
