import { describe, expect, it } from "vitest";

import {
  BASE_SCORE_TYPES,
  EXTENDED_SCORE_TYPES,
  ALL_SCORE_TYPES,
  computeDnaScore,
  scoreColor,
  scoreLabel,
  isBaseScoreType,
  filterScores,
} from "@/lib/brand-scores";

describe("BASE_SCORE_TYPES", () => {
  it("has exactly 4 base types", () => {
    expect(BASE_SCORE_TYPES).toHaveLength(4);
    expect(BASE_SCORE_TYPES).toContain("visual");
    expect(BASE_SCORE_TYPES).toContain("audience");
    expect(BASE_SCORE_TYPES).toContain("consistency");
    expect(BASE_SCORE_TYPES).toContain("commerce_readiness");
  });
});

describe("EXTENDED_SCORE_TYPES", () => {
  it("has exactly 6 extended types", () => {
    expect(EXTENDED_SCORE_TYPES).toHaveLength(6);
    expect(EXTENDED_SCORE_TYPES).toContain("brand_clarity");
    expect(EXTENDED_SCORE_TYPES).toContain("content_strength");
    expect(EXTENDED_SCORE_TYPES).toContain("social_presence");
    expect(EXTENDED_SCORE_TYPES).toContain("digital_experience");
    expect(EXTENDED_SCORE_TYPES).toContain("sustainability_signal");
    expect(EXTENDED_SCORE_TYPES).toContain("photography_readiness");
  });
});

describe("ALL_SCORE_TYPES", () => {
  it("has 10 total types", () => {
    expect(ALL_SCORE_TYPES).toHaveLength(10);
  });
});

describe("computeDnaScore", () => {
  it("returns null for empty scores", () => {
    expect(computeDnaScore([])).toBeNull();
  });

  it("returns null when no base scores present", () => {
    const scores = [
      { score_type: "brand_clarity", score: 70 },
      { score_type: "social_presence", score: 60 },
    ];
    expect(computeDnaScore(scores)).toBeNull();
  });

  it("computes AVG of only base 4 scores", () => {
    const scores = [
      { score_type: "visual", score: 80 },
      { score_type: "audience", score: 90 },
      { score_type: "consistency", score: 70 },
      { score_type: "commerce_readiness", score: 60 },
    ];
    expect(computeDnaScore(scores)).toBe(75);
  });

  it("ignores non-base scores in DNA calculation", () => {
    const scores = [
      { score_type: "visual", score: 80 },
      { score_type: "audience", score: 90 },
      { score_type: "consistency", score: 70 },
      { score_type: "commerce_readiness", score: 60 },
      { score_type: "brand_clarity", score: 10 },
      { score_type: "social_presence", score: 10 },
    ];
    expect(computeDnaScore(scores)).toBe(75);
  });

  it("handles partial base scores", () => {
    const scores = [
      { score_type: "visual", score: 80 },
      { score_type: "audience", score: 100 },
    ];
    expect(computeDnaScore(scores)).toBe(90);
  });

  it("rounds to nearest integer", () => {
    const scores = [
      { score_type: "visual", score: 83 },
      { score_type: "audience", score: 84 },
      { score_type: "consistency", score: 85 },
      { score_type: "commerce_readiness", score: 86 },
    ];
    expect(computeDnaScore(scores)).toBe(85);
  });
});

describe("scoreColor", () => {
  it("returns green for score >= 80", () => {
    expect(scoreColor(80)).toBe("#059669");
    expect(scoreColor(100)).toBe("#059669");
  });

  it("returns amber for score >= 50 and < 80", () => {
    expect(scoreColor(50)).toBe("#D97706");
    expect(scoreColor(79)).toBe("#D97706");
  });

  it("returns red for score < 50", () => {
    expect(scoreColor(0)).toBe("#DC2626");
    expect(scoreColor(49)).toBe("#DC2626");
  });
});

describe("scoreLabel", () => {
  it('returns "Strong" for >= 80', () => {
    expect(scoreLabel(85)).toBe("Strong");
  });

  it('returns "Needs Work" for >= 50 and < 80', () => {
    expect(scoreLabel(65)).toBe("Needs Work");
  });

  it('returns "Attention" for < 50', () => {
    expect(scoreLabel(30)).toBe("Attention");
  });
});

describe("isBaseScoreType", () => {
  it("returns true for base types", () => {
    expect(isBaseScoreType("visual")).toBe(true);
    expect(isBaseScoreType("consistency")).toBe(true);
  });

  it("returns false for extended types", () => {
    expect(isBaseScoreType("brand_clarity")).toBe(false);
    expect(isBaseScoreType("social_presence")).toBe(false);
  });

  it("returns false for dna_readiness", () => {
    expect(isBaseScoreType("dna_readiness")).toBe(false);
  });
});

describe("filterScores", () => {
  it("removes dna_readiness rows", () => {
    const scores = [
      { score_type: "visual" },
      { score_type: "dna_readiness" },
      { score_type: "audience" },
    ];
    expect(filterScores(scores)).toHaveLength(2);
    expect(filterScores(scores).map((s) => s.score_type)).not.toContain("dna_readiness");
  });

  it("passes through clean scores unchanged", () => {
    const scores = [
      { score_type: "visual" },
      { score_type: "audience" },
    ];
    expect(filterScores(scores)).toHaveLength(2);
  });

  it("handles empty array", () => {
    expect(filterScores([])).toHaveLength(0);
  });
});
