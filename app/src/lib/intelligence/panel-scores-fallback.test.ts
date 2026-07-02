import { describe, expect, it } from "vitest";

import {
  COMMAND_CENTER_SCORES_FALLBACK,
  resolvePanelScores,
} from "./panel-scores-fallback";

describe("resolvePanelScores", () => {
  it("returns real scores when present", () => {
    const scores = { dna: 91, pillars: { visual: 80, audience: 85, consistency: 90, commerce_readiness: 75 } };
    expect(resolvePanelScores(scores, true)).toBe(scores);
  });

  it("returns null when no scores and CC fallback disabled", () => {
    expect(resolvePanelScores(null, false)).toBeNull();
  });

  it("returns DC placeholder only when CC fallback enabled", () => {
    expect(resolvePanelScores(null, true)).toEqual(COMMAND_CENTER_SCORES_FALLBACK);
  });
});
