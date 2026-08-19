import { describe, expect, it } from "vitest";
import type { AnalyticsPayload, CampaignPerformancePayload, CampaignPerformanceRow } from "./analytics";
import { isUnavailableMetricsNull, resolveValidCampaign } from "./analytics";

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

  it("models campaign performance as per-campaign rows with identity", () => {
    const payload: CampaignPerformancePayload = {
      campaigns: [
        { campaignId: "111", name: "Spring", status: "live", brandId: "b1", orgId: "o1" },
        { campaignId: "222", name: "Air Max", status: "planning", brandId: "b1", orgId: "o1" },
      ],
    };
    expect(payload.campaigns).toHaveLength(2);
    expect(payload.campaigns[0].campaignId).toBe("111");
    expect(payload.campaigns[1].status).toBe("planning");
  });
});

describe("resolveValidCampaign", () => {
  const lookbook: CampaignPerformanceRow = {
    campaignId: "lookbook",
    name: "Summer Lookbook",
    status: "live",
    brandId: "brand-123",
    orgId: "org-1",
  };
  const holiday: CampaignPerformanceRow = {
    campaignId: "holiday",
    name: "Holiday Drop",
    status: "active",
    brandId: "brand-456",
    orgId: "org-1",
  };
  const campaigns = [lookbook, holiday];

  it("accepts a same-brand campaign from ?c=", () => {
    expect(resolveValidCampaign(campaigns, "lookbook", "brand-123")).toEqual(lookbook);
  });

  it("rejects an invalid campaign id", () => {
    expect(resolveValidCampaign(campaigns, "missing", "brand-123")).toBeNull();
  });

  it("rejects a cross-brand campaign even if the id is in the list", () => {
    expect(resolveValidCampaign(campaigns, "holiday", "brand-123")).toBeNull();
  });

  it("falls back when selected id or brand is missing", () => {
    expect(resolveValidCampaign(campaigns, null, "brand-123")).toBeNull();
    expect(resolveValidCampaign(campaigns, "lookbook", null)).toBeNull();
  });

  it("rejects a stale selection after the active brand changes", () => {
    expect(resolveValidCampaign(campaigns, "lookbook", "brand-123")).toEqual(lookbook);
    expect(resolveValidCampaign(campaigns, "lookbook", "brand-456")).toBeNull();
  });
});
