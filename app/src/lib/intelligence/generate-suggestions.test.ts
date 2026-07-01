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
});
