import { describe, expect, it } from "vitest";
import { computeMatchScore } from "./match-score";
import type { TalentResult } from "./types";

function talent(overrides: Partial<TalentResult> = {}): TalentResult {
  return {
    id: "t1",
    display_name: "Jordan Reyes",
    bio: null,
    measurements: {},
    languages: ["en"],
    travel_ready: true,
    verification_status: "unverified",
    ai_tags: {},
    is_agency_represented: false,
    rate_tier: "$$",
    is_available: false,
    ...overrides,
  };
}

describe("computeMatchScore", () => {
  it("scores an unavailable, unverified, untagged talent at the 60 baseline", () => {
    const result = computeMatchScore({ talent: talent() });
    expect(result.score).toBe(60);
    expect(result.confidence).toBe(65);
    expect(result.why).toContain("availability not confirmed");
  });

  it("adds availability, representation, and shoot-type bonuses up to 100", () => {
    const result = computeMatchScore({
      talent: talent({
        is_available: true,
        is_agency_represented: true,
        verification_status: "verified",
        ai_tags: { shoot_types: ["editorial"] },
      }),
      shootType: "editorial",
      representationPreferred: "agency",
    });
    expect(result.score).toBe(100);
    expect(result.confidence).toBe(90);
    expect(result.why).toContain("available for the requested dates");
    expect(result.why).toContain("agency representation matches your preference");
    expect(result.why).toContain("tagged for editorial work");
  });
});
