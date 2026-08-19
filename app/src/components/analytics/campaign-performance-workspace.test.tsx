/**
 * @vitest-environment jsdom
 */
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { resolveValidCampaign } from "@/lib/analytics";

const replace = vi.fn();
let paramsString = "";
let pathname = "/app/analytics/campaigns";

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(paramsString),
  usePathname: () => pathname,
  useRouter: () => ({ replace }),
}));

const activeBrandIdMock = vi.fn(() => ({ activeBrandId: "brand-123" }));
vi.mock("@/context/active-brand-context", () => ({
  useActiveBrand: () => activeBrandIdMock(),
}));

const fromMock = vi.fn();
vi.mock("@/lib/supabase/client", () => ({
  createSupabaseBrowserClient: () => ({ from: fromMock }),
}));

import { CampaignPerformanceWorkspace } from "./campaign-performance-workspace";

const LOOKBOOK = {
  id: "lookbook",
  name: "Summer Lookbook",
  status: "live",
  brand_id: "brand-123",
  org_id: "org-1",
};
const HOLIDAY = {
  id: "holiday",
  name: "Holiday Drop",
  status: "active",
  brand_id: "brand-123",
  org_id: "org-1",
};

function mockCampaigns(rows: typeof LOOKBOOK[]) {
  fromMock.mockImplementation((table: string) => {
    if (table === "campaigns") {
      return {
        select: () => ({
          eq: () => ({
            order: () => Promise.resolve({ data: rows, error: null }),
          }),
        }),
      };
    }
    return { select: () => ({ eq: () => Promise.resolve({ data: [], error: null }) }) };
  });
}

beforeEach(() => {
  replace.mockClear();
  paramsString = "";
  pathname = "/app/analytics/campaigns";
  activeBrandIdMock.mockReturnValue({ activeBrandId: "brand-123" });
});

afterEach(() => cleanup());

describe("CampaignPerformanceWorkspace", () => {
  it("imports the real resolveValidCampaign helper (not an in-file copy)", () => {
    expect(typeof resolveValidCampaign).toBe("function");
  });

  it("preselects a valid ?c= campaign and shows Unavailable KPIs", async () => {
    paramsString = "c=lookbook";
    mockCampaigns([LOOKBOOK, HOLIDAY]);
    render(<CampaignPerformanceWorkspace />);

    await waitFor(() => expect(screen.getByRole("button", { name: /Deselect Summer Lookbook/i })).toBeTruthy());
    expect(screen.getByRole("heading", { name: "Summer Lookbook" })).toBeTruthy();
    expect(screen.getAllByText("Unavailable").length).toBeGreaterThanOrEqual(6);
  });

  it("falls back when ?c= is an invalid id", async () => {
    paramsString = "c=missing";
    mockCampaigns([LOOKBOOK, HOLIDAY]);
    render(<CampaignPerformanceWorkspace />);

    await waitFor(() => expect(screen.getByRole("button", { name: /View Summer Lookbook/i })).toBeTruthy());
    expect(screen.queryByRole("heading", { name: "Summer Lookbook" })).toBeNull();
    expect(screen.queryByText(/ID: missing/)).toBeNull();
  });

  it("rejects a cross-brand campaign even if it appears in the loaded set", async () => {
    paramsString = "c=other-brand";
    mockCampaigns([
      LOOKBOOK,
      { ...HOLIDAY, id: "other-brand", name: "Other Brand Drop", brand_id: "brand-999" },
    ]);
    render(<CampaignPerformanceWorkspace />);

    await waitFor(() => expect(screen.getByRole("button", { name: /View Other Brand Drop/i })).toBeTruthy());
    expect(screen.queryByRole("heading", { name: "Other Brand Drop" })).toBeNull();
  });

  it("clicking a campaign calls router.replace with ?c= and preserves other params", async () => {
    paramsString = "from=overview";
    mockCampaigns([LOOKBOOK, HOLIDAY]);
    render(<CampaignPerformanceWorkspace />);

    await waitFor(() => expect(screen.getByRole("button", { name: /View Holiday Drop/i })).toBeTruthy());
    fireEvent.click(screen.getByRole("button", { name: /View Holiday Drop/i }));

    expect(replace).toHaveBeenCalledWith("/app/analytics/campaigns?from=overview&c=holiday", {
      scroll: false,
    });
  });

  it("clicking the selected campaign clears ?c= via router.replace", async () => {
    paramsString = "c=lookbook";
    mockCampaigns([LOOKBOOK, HOLIDAY]);
    render(<CampaignPerformanceWorkspace />);

    await waitFor(() => expect(screen.getByRole("button", { name: /Deselect Summer Lookbook/i })).toBeTruthy());
    fireEvent.click(screen.getByRole("button", { name: /Deselect Summer Lookbook/i }));

    expect(replace).toHaveBeenCalledWith("/app/analytics/campaigns", { scroll: false });
  });

  it("keeps ranking names shrinkable at 390px (min-width:0)", async () => {
    mockCampaigns([LOOKBOOK]);
    render(<CampaignPerformanceWorkspace />);

    await waitFor(() => expect(screen.getByRole("button", { name: /View Summer Lookbook/i })).toBeTruthy());
    const nameCell = screen.getByText("Summer Lookbook").parentElement;
    expect(nameCell?.className).toContain("campaign-name");
    expect(nameCell?.style.minWidth).toBe("0px");
  });
});
