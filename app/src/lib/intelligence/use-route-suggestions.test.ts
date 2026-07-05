/**
 * @vitest-environment jsdom
 */
import { describe, expect, it } from "vitest";
import { renderHook } from "@testing-library/react";
import { useRouteSuggestions } from "./use-route-suggestions";

describe("useRouteSuggestions", () => {
  describe("Command Center (/app)", () => {
    it("returns Command Center suggestions", () => {
      const { result } = renderHook(() =>
        useRouteSuggestions({ pathname: "/app" })
      );

      expect(result.current).toHaveLength(3);
      expect(result.current[0].title).toBe("Plan a shoot");
      expect(result.current[1].title).toBe("Review approvals");
      expect(result.current[2].title).toBe("Improve a brand");
    });
  });

  describe("Brand Detail (/app/brand/[id])", () => {
    const BRAND_ID = "22222222-2222-2222-2222-222222222222";

    it("shows analyze suggestions when brand not loaded", () => {
      const { result } = renderHook(() =>
        useRouteSuggestions({
          pathname: `/app/brand/${BRAND_ID}`,
          context: { brandLoaded: false },
        })
      );

      expect(result.current).toHaveLength(2);
      expect(result.current[0].title).toBe("Analyze brand");
      expect(result.current[1].title).toBe("View portfolio");
    });

    it("shows improvement suggestions when brand loaded", () => {
      const { result } = renderHook(() =>
        useRouteSuggestions({
          pathname: `/app/brand/${BRAND_ID}`,
          context: { brandLoaded: true },
        })
      );

      expect(result.current).toHaveLength(3);
      expect(result.current[0].title).toBe("Improve Visual score");
      expect(result.current[1].title).toBe("Plan a shoot");
      expect(result.current[2].title).toBe("Review assets");
    });
  });

  describe("Brand List (/app/brand)", () => {
    it("shows onboarding suggestions when no brands", () => {
      const { result } = renderHook(() =>
        useRouteSuggestions({
          pathname: "/app/brand",
          context: { hasBrands: false },
        })
      );

      expect(result.current).toHaveLength(2);
      expect(result.current[0].title).toBe("Add new brand");
      expect(result.current[1].title).toBe("Example brand");
    });

    it("shows portfolio suggestions when brands exist", () => {
      const { result } = renderHook(() =>
        useRouteSuggestions({
          pathname: "/app/brand",
          context: { hasBrands: true },
        })
      );

      expect(result.current).toHaveLength(3);
      expect(result.current[0].title).toBe("Improve visuals");
      expect(result.current[1].title).toBe("Plan a shoot");
      expect(result.current[2].title).toBe("Review assets");
    });
  });

  describe("Shoots List (/app/shoots)", () => {
    it("returns shoot planning suggestions", () => {
      const { result } = renderHook(() =>
        useRouteSuggestions({ pathname: "/app/shoots" })
      );

      expect(result.current).toHaveLength(3);
      expect(result.current[0].title).toBe("Plan a shoot");
      expect(result.current[1].title).toBe("Find blockers");
      expect(result.current[2].title).toBe("Summarize");
    });
  });

  describe("Shoot Detail (/app/shoots/[id])", () => {
    const SHOOT_ID = "11111111-1111-1111-1111-111111111111";

    it("shows view all when shoot not loaded", () => {
      const { result } = renderHook(() =>
        useRouteSuggestions({
          pathname: `/app/shoots/${SHOOT_ID}`,
          context: { shootLoaded: false },
        })
      );

      expect(result.current).toHaveLength(1);
      expect(result.current[0].title).toBe("View all shoots");
    });

    it("shows shoot detail suggestions when loaded", () => {
      const { result } = renderHook(() =>
        useRouteSuggestions({
          pathname: `/app/shoots/${SHOOT_ID}`,
          context: { shootLoaded: true },
        })
      );

      expect(result.current).toHaveLength(3);
      expect(result.current[0].title).toBe("Review Assets");
      expect(result.current[1].title).toBe("Fix all issues");
      expect(result.current[2].title).toBe("Export plan");
    });
  });

  describe("Assets (/app/assets)", () => {
    it("shows general asset suggestions when no selection", () => {
      const { result } = renderHook(() =>
        useRouteSuggestions({
          pathname: "/app/assets",
          context: { hasSelection: false },
        })
      );

      expect(result.current).toHaveLength(3);
      expect(result.current[0].title).toBe("Show all assets");
      expect(result.current[1].title).toBe("Filter by brand");
      expect(result.current[2].title).toBe("Upload assets");
    });

    it("shows selection-specific suggestions when assets selected", () => {
      const { result } = renderHook(() =>
        useRouteSuggestions({
          pathname: "/app/assets",
          context: { hasSelection: true },
        })
      );

      expect(result.current).toHaveLength(3);
      expect(result.current[0].title).toBe("Review low matches");
      expect(result.current[1].title).toBe("Suggest replacements");
      expect(result.current[2].title).toBe("Bulk tag");
    });
  });

  describe("Campaigns (/app/campaigns)", () => {
    it("shows creation suggestions when no campaign loaded", () => {
      const { result } = renderHook(() =>
        useRouteSuggestions({
          pathname: "/app/campaigns",
          context: { campaignLoaded: false },
        })
      );

      expect(result.current).toHaveLength(2);
      expect(result.current[0].title).toBe("Create campaign");
      expect(result.current[1].title).toBe("View all campaigns");
    });

    it("shows campaign detail suggestions when loaded", () => {
      const { result } = renderHook(() =>
        useRouteSuggestions({
          pathname: "/app/campaigns",
          context: { campaignLoaded: true },
        })
      );

      expect(result.current).toHaveLength(3);
      expect(result.current[0].title).toBe("Campaign health");
      expect(result.current[1].title).toBe("Deliverable gaps");
      expect(result.current[2].title).toBe("Export plan");
    });
  });

  describe("Matching (/app/matching)", () => {
    it("shows starter suggestions when no creator loaded", () => {
      const { result } = renderHook(() =>
        useRouteSuggestions({
          pathname: "/app/matching",
          context: { creatorLoaded: false },
        })
      );

      expect(result.current).toHaveLength(2);
      expect(result.current[0].title).toBe("Start matching");
      expect(result.current[1].title).toBe("View all talent");
    });

    it("shows creator matching suggestions when loaded", () => {
      const { result } = renderHook(() =>
        useRouteSuggestions({
          pathname: "/app/matching",
          context: { creatorLoaded: true },
        })
      );

      expect(result.current).toHaveLength(3);
      expect(result.current[0].title).toBe("Find 90%+ fits");
      expect(result.current[1].title).toBe("Available now");
      expect(result.current[2].title).toBe("Check budget fit");
    });
  });

  describe("Channel Preview (/app/preview)", () => {
    it("shows channel selection when no channel loaded", () => {
      const { result } = renderHook(() =>
        useRouteSuggestions({
          pathname: "/app/preview",
          context: { channelLoaded: false },
        })
      );

      expect(result.current).toHaveLength(1);
      expect(result.current[0].title).toBe("Select channel");
    });

    it("shows preview suggestions when channel loaded", () => {
      const { result } = renderHook(() =>
        useRouteSuggestions({
          pathname: "/app/preview",
          context: { channelLoaded: true },
        })
      );

      expect(result.current).toHaveLength(3);
      expect(result.current[0].title).toBe("Check safe zones");
      expect(result.current[1].title).toBe("Suggest crops");
      expect(result.current[2].title).toBe("Export all");
    });
  });

  describe("Onboarding (/app/onboarding)", () => {
    it("returns onboarding suggestions", () => {
      const { result } = renderHook(() =>
        useRouteSuggestions({ pathname: "/app/onboarding" })
      );

      expect(result.current).toHaveLength(2);
      expect(result.current[0].title).toBe("Complete onboarding");
      expect(result.current[1].title).toBe("Skip for now");
    });
  });

  describe("Query string edge cases", () => {
    it("strips query params from shoot detail path", () => {
      const { result } = renderHook(() =>
        useRouteSuggestions({
          pathname: "/app/shoots/11111111-1111-1111-1111-111111111111?tab=assets",
          context: { shootLoaded: true },
        })
      );

      expect(result.current[0].title).toBe("Review Assets");
    });

    it("strips query params from brand detail path", () => {
      const { result } = renderHook(() =>
        useRouteSuggestions({
          pathname: "/app/brand/11111111-1111-1111-1111-111111111111?tab=scores",
          context: { brandLoaded: true },
        })
      );

      expect(result.current[0].title).toBe("Improve Visual score");
    });
  });

  describe("Unknown routes", () => {
    it("returns fallback suggestions", () => {
      const { result } = renderHook(() =>
        useRouteSuggestions({ pathname: "/app/unknown" })
      );

      expect(result.current).toHaveLength(3);
      expect(result.current[0].title).toBe("Brands");
      expect(result.current[1].title).toBe("Shoots");
      expect(result.current[2].title).toBe("Assets");
    });
  });

  describe("Trailing slash edge cases", () => {
    it("treats /app/brand/ as brand list, not detail", () => {
      const { result } = renderHook(() =>
        useRouteSuggestions({
          pathname: "/app/brand/",
          context: { hasBrands: true },
        })
      );

      // Should return list suggestions, not detail suggestions
      expect(result.current[0].title).toBe("Improve visuals");
    });

    it("treats /app/shoots/ as shoots list, not detail", () => {
      const { result } = renderHook(() =>
        useRouteSuggestions({
          pathname: "/app/shoots/",
        })
      );

      // Should return list suggestions, not detail suggestions
      expect(result.current[0].title).toBe("Plan a shoot");
    });
  });

  describe("CRM routes (IPI-368)", () => {
    it("suggests search on companies list", () => {
      const { result } = renderHook(() =>
        useRouteSuggestions({ pathname: "/app/crm/companies" }),
      );
      expect(result.current[0].title).toBe("Search companies");
    });

    it("suggests stage moves on pipeline detail", () => {
      const { result } = renderHook(() =>
        useRouteSuggestions({
          pathname: "/app/crm/pipeline/550e8400-e29b-41d4-a716-446655440000",
        }),
      );
      expect(result.current[0].title).toBe("Move stage");
    });
  });

  describe("Dynamic updates", () => {
    it("updates suggestions when pathname changes", () => {
      const { result, rerender } = renderHook(
        ({ pathname }) => useRouteSuggestions({ pathname }),
        { initialProps: { pathname: "/app/brand" } }
      );

      expect(result.current[0].title).toBe("Add new brand");

      rerender({ pathname: "/app/shoots" });
      expect(result.current[0].title).toBe("Plan a shoot");
    });

    it("updates suggestions when context changes", () => {
      const { result, rerender } = renderHook(
        ({ context }) => useRouteSuggestions({ pathname: "/app/assets", context }),
        { initialProps: { context: { hasSelection: false } } }
      );

      expect(result.current[0].title).toBe("Show all assets");

      rerender({ context: { hasSelection: true } });
      expect(result.current[0].title).toBe("Review low matches");
    });
  });
});
