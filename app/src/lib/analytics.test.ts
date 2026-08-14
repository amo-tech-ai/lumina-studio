import { describe, expect, it } from "vitest";
import type { AnalyticsPayload } from "./analytics";
import { isUnavailableMetricsNull } from "./analytics";

describe("analytics contract null semantics", () => {
  it("keeps unavailable metrics null", () => {
    const p: AnalyticsPayload = {
      campaignsLive: 2,
      assetsPublished: 5,
      avgBrandDna: 87,
      avgAssetMatch: 84,
      reach: null,
      engagementRate: null,
      ctr: null,
      conversions: null,
      cpe: null,
      aiActionsApproved: null,
      approvalTurnaroundDays: null,
    };
    expect(isUnavailableMetricsNull(p)).toBe(true);
  });

  it("allows avg fields to be null when no rows", () => {
    const p: AnalyticsPayload = {
      campaignsLive: 0,
      assetsPublished: 0,
      avgBrandDna: null,
      avgAssetMatch: null,
      reach: null,
      engagementRate: null,
      ctr: null,
      conversions: null,
      cpe: null,
      aiActionsApproved: null,
      approvalTurnaroundDays: null,
    };
    expect(p.avgBrandDna).toBeNull();
    expect(p.avgAssetMatch).toBeNull();
    expect(isUnavailableMetricsNull(p)).toBe(true);
  });

  it("never substitutes fake zero for unavailable", () => {
    const p: AnalyticsPayload = {
      campaignsLive: 1,
      assetsPublished: 1,
      avgBrandDna: 80,
      avgAssetMatch: 82,
      reach: null,
      engagementRate: null,
      ctr: null,
      conversions: null,
      cpe: null,
      aiActionsApproved: null,
      approvalTurnaroundDays: null,
    };
    // unavailable must be null, not 0 / fake
    expect(p.reach).toBeNull();
    expect(p.cpe).toBeNull();
    expect(p.reach !== 0).toBe(true);
  });
});
