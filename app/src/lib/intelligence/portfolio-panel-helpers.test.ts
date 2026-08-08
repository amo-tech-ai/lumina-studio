import { describe, expect, it } from "vitest";

import type { IntelligencePortfolio } from "@/lib/intelligence/panel-contract";

import {
  portfolioBarColor,
  portfolioBarWidth,
  portfolioCountLabel,
  portfolioDotColor,
  portfolioScoreColor,
  resolvePortfolioForDisplay,
} from "./portfolio-panel-helpers";

const portfolio: IntelligencePortfolio = {
  brandCount: 2,
  avgDna: 71,
  healthRows: [
    { brandId: "b1", name: "Aurelia", score: 82 },
    { brandId: "b2", name: "Nordwell", score: 60 },
  ],
  needsAttention: null,
};

describe("portfolioCountLabel", () => {
  it("pluralizes everything except a single brand", () => {
    expect(portfolioCountLabel(0)).toBe("0 brands");
    expect(portfolioCountLabel(1)).toBe("1 brand");
    expect(portfolioCountLabel(12)).toBe("12 brands");
  });
});

describe("portfolioBarWidth", () => {
  it("clamps the score into the 0–100 percent range", () => {
    expect(portfolioBarWidth(-25)).toBe("0%");
    expect(portfolioBarWidth(0)).toBe("0%");
    expect(portfolioBarWidth(47)).toBe("47%");
    expect(portfolioBarWidth(100)).toBe("100%");
    expect(portfolioBarWidth(180)).toBe("100%");
  });
});

describe("score-driven colors", () => {
  it.each([
    [portfolioDotColor, "var(--color-approved, #059669)", "var(--color-warning, #d97706)", "var(--color-blocked, #dc2626)"],
    [portfolioScoreColor, "var(--color-text-primary, #111)", "var(--color-warning-text, #92400e)", "var(--color-blocked, #dc2626)"],
    [portfolioBarColor, "var(--dna-bar-high, #059669)", "var(--dna-bar-mid, #d97706)", "var(--dna-bar-low, #dc2626)"],
  ])("uses the 80/60 thresholds", (color, high, mid, low) => {
    expect(color(100)).toBe(high);
    expect(color(80)).toBe(high);
    expect(color(79)).toBe(mid);
    expect(color(60)).toBe(mid);
    expect(color(59)).toBe(low);
    expect(color(0)).toBe(low);
  });
});

describe("resolvePortfolioForDisplay", () => {
  it("returns an empty portfolio when none is provided", () => {
    expect(resolvePortfolioForDisplay(undefined, false)).toEqual({
      brandCount: 0,
      avgDna: 0,
      healthRows: [],
      needsAttention: null,
    });
  });

  it("returns the portfolio unchanged regardless of the demo padding flag", () => {
    expect(resolvePortfolioForDisplay(portfolio, false)).toBe(portfolio);
    expect(resolvePortfolioForDisplay(portfolio, true)).toBe(portfolio);
  });
});
