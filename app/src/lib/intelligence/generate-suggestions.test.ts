import { describe, expect, it } from "vitest";

import { generateSuggestions } from "./generate-suggestions";

describe("generateSuggestions", () => {
  it("flags visual score of 0 as needing review", () => {
    const out = generateSuggestions({ visual: 0, commerce_readiness: 80, consistency: 50 });
    expect(out.some((s) => s.title.includes("Visual"))).toBe(true);
  });

  it("includes high consistency insight when score >= 85", () => {
    const out = generateSuggestions({ visual: 80, commerce_readiness: 80, consistency: 90 });
    expect(out.some((s) => s.title.includes("consistency"))).toBe(true);
  });

  it("returns no suggestions when score map is empty (no false positives)", () => {
    expect(generateSuggestions({})).toEqual([]);
  });

  it("skips pillars with null scores", () => {
    const out = generateSuggestions({ visual: null, commerce_readiness: undefined, consistency: 90 });
    expect(out.some((s) => s.title.includes("Visual"))).toBe(false);
    expect(out.some((s) => s.title.includes("Commerce"))).toBe(false);
    expect(out.some((s) => s.title.includes("consistency"))).toBe(true);
  });
});
