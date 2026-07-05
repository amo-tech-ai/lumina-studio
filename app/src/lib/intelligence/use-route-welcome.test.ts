/**
 * @vitest-environment jsdom
 */
import { describe, expect, it } from "vitest";
import { renderHook } from "@testing-library/react";
import { useRouteWelcome } from "./use-route-welcome";

describe("useRouteWelcome", () => {
  describe("Command Center (/app)", () => {
    it("shows neutral overview when counts unknown", () => {
      const { result } = renderHook(() =>
        useRouteWelcome({ pathname: "/app" })
      );
      expect(result.current).toBe("Portfolio overview — ask about brands, shoots, and pending approvals");
    });

    it("shows portfolio summary when both counts provided", () => {
      const { result } = renderHook(() =>
        useRouteWelcome({
          pathname: "/app",
          context: { brandCount: 2, shootCount: 5 },
        })
      );
      expect(result.current).toBe("Portfolio: 2 brands · 5 shoots in progress");
    });

    it("shows KPI summary when context available", () => {
      const { result } = renderHook(() =>
        useRouteWelcome({
          pathname: "/app",
          context: {
            kpiSummary: "Portfolio: 12 brands · 47 shoots",
            pendingApprovals: 3,
          },
        })
      );
      expect(result.current).toBe("Portfolio: 12 brands · 47 shoots · 3 approvals pending");
    });

    it("handles singular approval", () => {
      const { result } = renderHook(() =>
        useRouteWelcome({
          pathname: "/app",
          context: {
            kpiSummary: "Portfolio active",
            pendingApprovals: 1,
          },
        })
      );
      expect(result.current).toContain("1 approval pending");
    });
  });

  describe("Brand Detail (/app/brand/[id])", () => {
    it("shows loading state when brand not loaded", () => {
      const { result } = renderHook(() =>
        useRouteWelcome({
          pathname: "/app/brand/abc-123",
          brandId: "abc-123",
        })
      );
      expect(result.current).toBe("Loading brand details...");
    });

    it("shows brand name before DNA score is available", () => {
      const { result } = renderHook(() =>
        useRouteWelcome({
          pathname: "/app/brand/abc-123",
          brandId: "abc-123",
          context: { brandName: "Maaji" },
        })
      );
      expect(result.current).toBe(
        "Maaji — review DNA pillars, assets, and suggested improvements",
      );
    });

    it("shows brand DNA with weakest pillar", () => {
      const { result } = renderHook(() =>
        useRouteWelcome({
          pathname: "/app/brand/abc-123",
          brandId: "abc-123",
          context: {
            brandName: "Nike",
            brandDna: 87,
            weakestPillar: "Visual",
          },
        })
      );
      expect(result.current).toBe("Nike — DNA 87% — improve Visual score for maximum impact");
    });

    it("shows brand DNA without weakest pillar note", () => {
      const { result } = renderHook(() =>
        useRouteWelcome({
          pathname: "/app/brand/abc-123",
          brandId: "abc-123",
          context: {
            brandName: "Adidas",
            brandDna: 92,
          },
        })
      );
      expect(result.current).toBe("Adidas — DNA 92%");
    });
  });

  describe("Brand List (/app/brand)", () => {
    it("shows empty state when no brands", () => {
      const { result } = renderHook(() =>
        useRouteWelcome({
          pathname: "/app/brand",
          context: { brandCount: 0 },
        })
      );
      expect(result.current).toBe("No brands yet — add your first brand to get started");
    });

    it("shows brand count with weakest pillar", () => {
      const { result } = renderHook(() =>
        useRouteWelcome({
          pathname: "/app/brand",
          context: {
            brandCount: 12,
            weakestPillar: "Visual",
          },
        })
      );
      expect(result.current).toBe("12 brands in portfolio · Visual has improvement opportunities");
    });

    it("handles singular brand", () => {
      const { result } = renderHook(() =>
        useRouteWelcome({
          pathname: "/app/brand",
          context: { brandCount: 1 },
        })
      );
      expect(result.current).toBe("1 brand in portfolio");
    });
  });

  describe("Shoots List (/app/shoots)", () => {
    it("shows neutral message when shoot count unknown", () => {
      const { result } = renderHook(() =>
        useRouteWelcome({ pathname: "/app/shoots" })
      );
      expect(result.current).toBe("Review shoots — check for blockers and coverage gaps");
    });

    it("shows empty state when no shoots", () => {
      const { result } = renderHook(() =>
        useRouteWelcome({
          pathname: "/app/shoots",
          context: { shootCount: 0 },
        })
      );
      expect(result.current).toBe("No shoots yet — plan your first production");
    });

    it("shows shoot count", () => {
      const { result } = renderHook(() =>
        useRouteWelcome({
          pathname: "/app/shoots",
          context: { shootCount: 47 },
        })
      );
      expect(result.current).toBe("47 shoots — check for blockers and coverage gaps");
    });
  });

  describe("Shoot Detail (/app/shoots/[id])", () => {
    const SHOOT_ID = "11111111-1111-1111-1111-111111111111";

    it("shows loading state when shoot not loaded", () => {
      const { result } = renderHook(() =>
        useRouteWelcome({ pathname: `/app/shoots/${SHOOT_ID}` })
      );
      expect(result.current).toBe("Loading shoot details...");
    });

    it("shows shoot name with gaps", () => {
      const { result } = renderHook(() =>
        useRouteWelcome({
          pathname: `/app/shoots/${SHOOT_ID}`,
          context: {
            shootName: "Nike Spring '26",
            shootCount: 3,
          },
        })
      );
      expect(result.current).toBe("Nike Spring '26 — 3 deliverables missing — review coverage and assign resources");
    });
  });

  describe("Assets (/app/assets)", () => {
    it("shows default message when no selection", () => {
      const { result } = renderHook(() =>
        useRouteWelcome({ pathname: "/app/assets" })
      );
      expect(result.current).toBe("Review asset DNA compliance — flag low matches for replacement");
    });

    it("shows selection count", () => {
      const { result } = renderHook(() =>
        useRouteWelcome({
          pathname: "/app/assets",
          context: { selectionCount: 3 },
        })
      );
      expect(result.current).toBe("3 assets selected — review DNA match and suggest improvements");
    });
  });

  describe("Campaigns (/app/campaigns)", () => {
    it("shows default message when no campaign loaded", () => {
      const { result } = renderHook(() =>
        useRouteWelcome({ pathname: "/app/campaigns" })
      );
      expect(result.current).toBe("Review campaign health and deliverable gaps");
    });

    it("shows campaign with health score", () => {
      const { result } = renderHook(() =>
        useRouteWelcome({
          pathname: "/app/campaigns",
          context: {
            campaignName: "Nike Fall '26",
            campaignHealth: 78,
          },
        })
      );
      expect(result.current).toBe("Nike Fall '26 — Health 78% — check deliverable coverage");
    });
  });

  describe("Matching (/app/matching)", () => {
    it("shows default message when no creator loaded", () => {
      const { result } = renderHook(() =>
        useRouteWelcome({ pathname: "/app/matching" })
      );
      expect(result.current).toBe(
        "Find talent that fits your shoot brief — filter by shoot type, budget, and availability",
      );
    });

    it("shows creator with fit score", () => {
      const { result } = renderHook(() =>
        useRouteWelcome({
          pathname: "/app/matching",
          context: {
            creatorName: "Sofia Marlowe",
            creatorFit: 94,
          },
        })
      );
      expect(result.current).toBe("Sofia Marlowe — 94% fit — one of your strongest matches");
    });
  });

  describe("Channel Preview (/app/preview)", () => {
    it("shows default message when no channel loaded", () => {
      const { result } = renderHook(() =>
        useRouteWelcome({ pathname: "/app/preview" })
      );
      expect(result.current).toBe("Check safe zones and DNA compliance for channel publishing");
    });

    it("shows channel ready to publish (≥90%)", () => {
      const { result } = renderHook(() =>
        useRouteWelcome({
          pathname: "/app/preview",
          context: {
            channelName: "Instagram Feed",
            channelReadiness: 92,
          },
        })
      );
      expect(result.current).toBe("Instagram Feed — Readiness 92% — ready to publish");
    });

    it("shows channel needs review (<90%)", () => {
      const { result } = renderHook(() =>
        useRouteWelcome({
          pathname: "/app/preview",
          context: {
            channelName: "TikTok",
            channelReadiness: 82,
          },
        })
      );
      expect(result.current).toBe("TikTok — Readiness 82% — needs review");
    });
  });

  describe("Onboarding (/app/onboarding)", () => {
    it("shows onboarding message", () => {
      const { result } = renderHook(() =>
        useRouteWelcome({ pathname: "/app/onboarding" })
      );
      expect(result.current).toBe("Complete brand onboarding to unlock intelligence features");
    });
  });

  describe("Trailing slash edge cases", () => {
    it("treats /app/shoots/ as shoots list, not detail", () => {
      const { result } = renderHook(() =>
        useRouteWelcome({
          pathname: "/app/shoots/",
          context: { shootCount: 3 },
        })
      );

      // Should return list welcome, not detail welcome
      expect(result.current).toBe("3 shoots — check for blockers and coverage gaps");
    });
  });

  describe("Query string edge cases", () => {
    it("strips query params from shoot detail path", () => {
      const { result } = renderHook(() =>
        useRouteWelcome({
          pathname: "/app/shoots/11111111-1111-1111-1111-111111111111?tab=assets",
          context: { shootName: "Nike Spring '26" },
        })
      );
      expect(result.current).toContain("Nike Spring '26");
    });

    it("strips query params from brand detail path", () => {
      const { result } = renderHook(() =>
        useRouteWelcome({
          pathname: "/app/brand/22222222-2222-2222-2222-222222222222?tab=scores",
          context: {
            brandName: "Nike",
            brandDna: 87,
          },
        })
      );
      expect(result.current).toBe("Nike — DNA 87%");
    });
  });

  describe("Unknown routes", () => {
    it("shows fallback message", () => {
      const { result } = renderHook(() =>
        useRouteWelcome({ pathname: "/app/unknown" })
      );
      expect(result.current).toBe("Ask about your portfolio, shoots, assets, or campaigns");
    });
  });

  describe("CRM routes (IPI-368)", () => {
    it("welcomes on companies list", () => {
      const { result } = renderHook(() =>
        useRouteWelcome({ pathname: "/app/crm/companies" }),
      );
      expect(result.current).toContain("Companies");
    });

    it("welcomes on pipeline detail", () => {
      const { result } = renderHook(() =>
        useRouteWelcome({ pathname: "/app/crm/pipeline/" + "550e8400-e29b-41d4-a716-446655440000" }),
      );
      expect(result.current).toContain("Deal detail");
    });
  });

  describe("Dynamic updates", () => {
    it("updates welcome when pathname changes", () => {
      const { result, rerender } = renderHook(
        ({ pathname }) => useRouteWelcome({ pathname, context: { brandCount: 5, shootCount: 10 } }),
        { initialProps: { pathname: "/app/brand" } }
      );

      expect(result.current).toContain("brands in portfolio");

      rerender({ pathname: "/app/shoots" });
      expect(result.current).toContain("shoots");
    });

    it("updates welcome when context changes", () => {
      const { result, rerender } = renderHook(
        ({ context }) => useRouteWelcome({ pathname: "/app/assets", context }),
        { initialProps: { context: {} } }
      );

      expect(result.current).toBe("Review asset DNA compliance — flag low matches for replacement");

      rerender({ context: { selectionCount: 5 } });
      expect(result.current).toBe("5 assets selected — review DNA match and suggest improvements");
    });
  });
});
