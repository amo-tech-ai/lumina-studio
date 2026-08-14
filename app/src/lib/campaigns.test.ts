import { describe, expect, it } from "vitest";

import {
  CAMPAIGN_FILTERS,
  campaignCountLabel,
  campaignStatusDot,
  campaignStatusLabel,
  deliverableProgress,
  formatCampaignDates,
  matchesCampaignFilter,
} from "./campaigns";

describe("campaign helpers (ponytail: smallest proof, no DB)", () => {
  it("labels known statuses and falls back to Unknown", () => {
    expect(campaignStatusLabel("planning")).toBe("Planning");
    expect(campaignStatusLabel("active")).toBe("Active");
    expect(campaignStatusLabel("bad" as never)).toBe("Unknown");
  });
  it("returns distinct dot token for unknown so it does not masquerade as planning", () => {
    expect(campaignStatusDot("unknown" as never)).toBe("var(--color-text-muted)");
  });
  it("matches filter correctly (all passes, unknown never matches real)", () => {
    expect(matchesCampaignFilter("all", "live")).toBe(true);
    expect(matchesCampaignFilter("active", "active")).toBe(true);
    expect(matchesCampaignFilter("active", "planning")).toBe(false);
    expect(matchesCampaignFilter("planning", "bogus" as never)).toBe(false);
  });
  it("builds count label honestly (0, 1, active count)", () => {
    expect(campaignCountLabel([])).toBe("No campaigns yet");
    expect(campaignCountLabel([{ status: "active" }])).toBe("1 campaign · 1 active");
    expect(campaignCountLabel([{ status: "planning" }, { status: "active" }])).toBe("2 campaigns · 1 active");
  });
  it("formats dates from real fields only, null when none", () => {
    expect(formatCampaignDates(null, null)).toBeNull();
    expect(formatCampaignDates("2026-03-01", null)).toMatch(/Mar/);
    expect(formatCampaignDates("2026-03-01", "2026-05-15")).toMatch(/Mar.*May|Mar – May/);
  });
  it("aggregates deliverable progress from real rows only", () => {
    expect(deliverableProgress([]).label).toBe("No deliverables");
    expect(deliverableProgress([]).pct).toBe(0);
    const prog = deliverableProgress([
      { status: "approved" } as never,
      { status: "pending" } as never,
      { status: "approved" } as never,
    ]);
    expect(prog).toEqual({ total: 3, approved: 2, pct: 67, label: "2/3 deliverables · 67%" });
  });
  it("exposes 5 real status filters (all + 4 enum values)", () => {
    expect(CAMPAIGN_FILTERS).toEqual(["all", "planning", "active", "live", "complete"]);
  });
});
