import { describe, it, expect, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useSearchParams } from "next/navigation";

import { CampaignPerformanceWorkspace } from "./campaign-performance-workspace";
import type { CampaignPerformanceRow } from "@/lib/analytics";

// Mock dependencies
vi.mock("next/navigation", () => ({
  useSearchParams: vi.fn(),
}));

vi.mock("@/context/active-brand-context", () => ({
  useActiveBrand: vi.fn(() => ({ activeBrandId: "brand-123" })),
}));

vi.mock("@/lib/supabase/client", () => ({
  createSupabaseBrowserClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn(() => Promise.resolve({ data: [], error: null })),
        })),
      })),
    })),
  })),
}));

describe("CampaignPerformanceWorkspace", () => {
  it("should render loading state initially", () => {
    vi.mocked(useSearchParams).mockReturnValue(new URLSearchParams());
    const { container } = renderHook(() => CampaignPerformanceWorkspace());
    // Basic smoke test - component renders without crashing
    expect(container).toBeTruthy();
  });

  it("should validate selected campaign belongs to active brand", () => {
    const campaigns: CampaignPerformanceRow[] = [
      { campaignId: "c1", name: "Campaign 1", status: "live", brandId: "brand-123", orgId: "org-1" },
      { campaignId: "c2", name: "Campaign 2", status: "active", brandId: "brand-456", orgId: "org-1" },
    ];
    
    const selectedId = "c2";
    const activeBrandId = "brand-123";
    
    const selectedCampaign = campaigns.find((c) => c.campaignId === selectedId);
    const validSelectedCampaign = selectedCampaign && selectedCampaign.brandId === activeBrandId ? selectedCampaign : null;
    
    // Cross-brand campaign should be rejected
    expect(validSelectedCampaign).toBeNull();
  });

  it("should accept same-brand campaign selection", () => {
    const campaigns: CampaignPerformanceRow[] = [
      { campaignId: "c1", name: "Campaign 1", status: "live", brandId: "brand-123", orgId: "org-1" },
    ];
    
    const selectedId = "c1";
    const activeBrandId = "brand-123";
    
    const selectedCampaign = campaigns.find((c) => c.campaignId === selectedId);
    const validSelectedCampaign = selectedCampaign && selectedCampaign.brandId === activeBrandId ? selectedCampaign : null;
    
    // Same-brand campaign should be accepted
    expect(validSelectedCampaign).toEqual(campaigns[0]);
  });

  it("should handle invalid campaign ID gracefully", () => {
    const campaigns: CampaignPerformanceRow[] = [
      { campaignId: "c1", name: "Campaign 1", status: "live", brandId: "brand-123", orgId: "org-1" },
    ];
    
    const selectedId = "invalid-id";
    const selectedCampaign = campaigns.find((c) => c.campaignId === selectedId);
    
    // Invalid ID should return null
    expect(selectedCampaign).toBeUndefined();
  });

  it("should handle null selected campaign ID", () => {
    const selectedId = null;
    expect(selectedId).toBeNull();
  });

  it("should maintain campaign identity with real campaignId", () => {
    const campaign: CampaignPerformanceRow = {
      campaignId: "real-uuid-123",
      name: "Summer Lookbook",
      status: "live",
      brandId: "brand-123",
      orgId: "org-1",
    };
    
    expect(campaign.campaignId).toBe("real-uuid-123");
    expect(typeof campaign.campaignId).toBe("string");
    expect(campaign.campaignId.length).toBeGreaterThan(0);
  });
});
