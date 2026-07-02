import { describe, expect, it } from "vitest";

import { brandDetailGreeting, brandDetailHeroChip } from "./brand-detail-greeting";

describe("brandDetailGreeting", () => {
  it("returns no-DNA copy when score is zero", () => {
    expect(brandDetailGreeting("Zara", 0, [])).toMatch(/hasn't been analysed/i);
  });

  it("summarizes strongest and weakest pillars", () => {
    const msg = brandDetailGreeting("Nike", 87, [
      { score_type: "visual", score: 72 },
      { score_type: "audience", score: 94 },
    ]);
    expect(msg).toMatch(/Nike DNA: 87/);
    expect(msg).toMatch(/Strongest: Audience \(94\)/);
    expect(msg).toMatch(/Weakest: Visual \(72\)/);
  });
});

describe("brandDetailHeroChip", () => {
  it("maps intake status to chip label", () => {
    expect(brandDetailHeroChip("ready", 87)).toBe("active");
    expect(brandDetailHeroChip("crawl_running", 0)).toBe("analysing…");
    expect(brandDetailHeroChip("brand_created", 0)).toBe("not analysed");
  });
});
