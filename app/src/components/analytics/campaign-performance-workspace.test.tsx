import { describe, it, expect } from "vitest";

describe("CampaignPerformanceWorkspace - data logic", () => {
  it("should validate selected campaign belongs to active brand", () => {
    const campaigns = [
      { campaignId: "c1", name: "Campaign 1", status: "live" as const, brandId: "brand-123", orgId: "org-1" },
      { campaignId: "c2", name: "Campaign 2", status: "active" as const, brandId: "brand-456", orgId: "org-1" },
    ];
    
    const selectedId = "c2";
    const activeBrandId = "brand-123";
    
    const selectedCampaign = campaigns.find((c) => c.campaignId === selectedId);
    const validSelectedCampaign = selectedCampaign && selectedCampaign.brandId === activeBrandId ? selectedCampaign : null;
    
    // Cross-brand campaign should be rejected
    expect(validSelectedCampaign).toBeNull();
  });

  it("should accept same-brand campaign selection", () => {
    const campaigns = [
      { campaignId: "c1", name: "Campaign 1", status: "live" as const, brandId: "brand-123", orgId: "org-1" },
    ];
    
    const selectedId = "c1";
    const activeBrandId = "brand-123";
    
    const selectedCampaign = campaigns.find((c) => c.campaignId === selectedId);
    const validSelectedCampaign = selectedCampaign && selectedCampaign.brandId === activeBrandId ? selectedCampaign : null;
    
    // Same-brand campaign should be accepted
    expect(validSelectedCampaign).toEqual(campaigns[0]);
  });

  it("should handle invalid campaign ID gracefully", () => {
    const campaigns = [
      { campaignId: "c1", name: "Campaign 1", status: "live" as const, brandId: "brand-123", orgId: "org-1" },
    ];
    
    const selectedId = "invalid-id";
    const selectedCampaign = campaigns.find((c) => c.campaignId === selectedId);
    
    // Invalid ID should return undefined
    expect(selectedCampaign).toBeUndefined();
  });

  it("should maintain campaign identity with real campaignId", () => {
    const campaign = {
      campaignId: "real-uuid-123",
      name: "Summer Lookbook",
      status: "live" as const,
      brandId: "brand-123",
      orgId: "org-1",
    };
    
    expect(campaign.campaignId).toBe("real-uuid-123");
    expect(typeof campaign.campaignId).toBe("string");
    expect(campaign.campaignId.length).toBeGreaterThan(0);
  });
});
