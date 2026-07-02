import { describe, expect, it } from "vitest";

import {
  matchesBrandListFilter,
  brandListCountLabel,
  isAnalysingIntakeStatus,
} from "./brand-list-filters";

describe("brand-list-filters", () => {
  it("maps active filter to ready and scores_complete with DNA", () => {
    expect(matchesBrandListFilter("active", "ready", true)).toBe(true);
    expect(matchesBrandListFilter("active", "scores_complete", true)).toBe(true);
    expect(matchesBrandListFilter("active", "ready", false)).toBe(false);
  });

  it("maps analysing filter to pipeline statuses", () => {
    expect(isAnalysingIntakeStatus("crawl_running")).toBe(true);
    expect(matchesBrandListFilter("analysing", "analysis_running", false)).toBe(true);
    expect(matchesBrandListFilter("analysing", "ready", true)).toBe(false);
  });

  it("maps draft filter to brand_created and no-DNA states", () => {
    expect(matchesBrandListFilter("draft", "brand_created", false)).toBe(true);
    expect(matchesBrandListFilter("draft", "draft_ready", true)).toBe(true);
    expect(matchesBrandListFilter("draft", "failed", false)).toBe(true);
  });

  it("builds count label from portfolio mix", () => {
    expect(
      brandListCountLabel([
        { intakeStatus: "ready", dnaScore: 87 },
        { intakeStatus: "analysis_running", dnaScore: 0 },
        { intakeStatus: "brand_created", dnaScore: 0 },
      ]),
    ).toBe("3 brands · 1 active · 1 analysing · 1 draft");
  });
});
