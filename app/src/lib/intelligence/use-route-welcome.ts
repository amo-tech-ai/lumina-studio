// IPI-197 — Dynamic welcome messages based on route + context
// Implements 06-ai-workflows.md greeting matrix for all 8 operator routes

import { useEffect, useState } from "react";

interface WelcomeContext {
  brandName?: string;
  brandDna?: number;
  weakestPillar?: string;
  brandCount?: number;
  shootCount?: number;
  shootName?: string;
  selectionCount?: number;
  campaignName?: string;
  campaignHealth?: number;
  creatorName?: string;
  creatorFit?: number;
  channelName?: string;
  channelReadiness?: number;
  kpiSummary?: string;
  pendingApprovals?: number;
  hasBrands?: boolean;
}

interface UseRouteWelcomeOptions {
  pathname: string;
  brandId?: string | null;
  context?: WelcomeContext;
}

/**
 * Generates contextual welcome messages for CopilotSidebar based on current route.
 *
 * @example
 * // Brand Detail
 * useRouteWelcome({
 *   pathname: "/app/brand/abc-123",
 *   brandId: "abc-123",
 *   context: { brandName: "Nike", brandDna: 87, weakestPillar: "Visual" }
 * })
 * // Returns: "Nike — DNA 87% — improve Visual score for maximum impact"
 */
export function useRouteWelcome({
  pathname,
  brandId,
  context = {},
}: UseRouteWelcomeOptions): string {
  const [welcome, setWelcome] = useState<string>(getWelcomeMessage(pathname, brandId, context));

  useEffect(() => {
    setWelcome(getWelcomeMessage(pathname, brandId, context));
  }, [pathname, brandId, context]);

  return welcome;
}

function getWelcomeMessage(
  pathname: string,
  brandId?: string | null,
  context: WelcomeContext = {}
): string {
  // Command Center (/app)
  if (pathname === "/app") {
    if (context.kpiSummary && context.pendingApprovals !== undefined) {
      return `${context.kpiSummary} · ${context.pendingApprovals} approval${context.pendingApprovals !== 1 ? "s" : ""} pending`;
    }
    const brandCount = context.brandCount ?? 0;
    const shootCount = context.shootCount ?? 0;
    return `Portfolio: ${brandCount} brand${brandCount !== 1 ? "s" : ""} · ${shootCount} shoot${shootCount !== 1 ? "s" : ""} in progress`;
  }

  // Brand Detail (/app/brand/[id])
  if (pathname.startsWith("/app/brand/") && brandId) {
    if (context.brandName && context.brandDna !== undefined) {
      const pillarNote = context.weakestPillar
        ? ` — improve ${context.weakestPillar} score for maximum impact`
        : "";
      return `${context.brandName} — DNA ${context.brandDna}%${pillarNote}`;
    }
    return "Loading brand details...";
  }

  // Brand List (/app/brand)
  if (pathname === "/app/brand" || pathname.startsWith("/app/brand?")) {
    const count = context.brandCount ?? 0;
    if (count === 0) {
      return "No brands yet — add your first brand to get started";
    }
    const weakest = context.weakestPillar
      ? ` · ${context.weakestPillar} has improvement opportunities`
      : "";
    return `${count} brand${count !== 1 ? "s" : ""} in portfolio${weakest}`;
  }

  // Shoot Detail (/app/shoots/[id])
  if (pathname.startsWith("/app/shoots/") && pathname.split("/").length > 3) {
    if (context.shootName) {
      const gap = context.shootCount ? ` — ${context.shootCount} deliverable${context.shootCount !== 1 ? "s" : ""} missing` : "";
      return `${context.shootName}${gap} — review coverage and assign resources`;
    }
    return "Loading shoot details...";
  }

  // Shoots List (/app/shoots)
  if (pathname === "/app/shoots" || pathname.startsWith("/app/shoots?")) {
    const count = context.shootCount ?? 0;
    if (count === 0) {
      return "No shoots yet — plan your first production";
    }
    return `${count} shoot${count !== 1 ? "s" : ""} — check for blockers and coverage gaps`;
  }

  // Assets (/app/assets)
  if (pathname === "/app/assets" || pathname.startsWith("/app/assets?")) {
    const selected = context.selectionCount ?? 0;
    if (selected > 0) {
      return `${selected} asset${selected !== 1 ? "s" : ""} selected — review DNA match and suggest improvements`;
    }
    return "Review asset DNA compliance — flag low matches for replacement";
  }

  // Campaigns (/app/campaigns)
  if (pathname === "/app/campaigns" || pathname.startsWith("/app/campaigns?")) {
    if (context.campaignName && context.campaignHealth !== undefined) {
      return `${context.campaignName} — Health ${context.campaignHealth}% — check deliverable coverage`;
    }
    return "Review campaign health and deliverable gaps";
  }

  // Matching (/app/matching)
  if (pathname === "/app/matching" || pathname.startsWith("/app/matching?")) {
    if (context.creatorName && context.creatorFit !== undefined) {
      return `${context.creatorName} — ${context.creatorFit}% fit — one of your strongest matches`;
    }
    return "Find high-fit creators and flag brand safety risks";
  }

  // Channel Preview (/app/preview)
  if (pathname === "/app/preview" || pathname.startsWith("/app/preview?")) {
    if (context.channelName && context.channelReadiness !== undefined) {
      const status = context.channelReadiness >= 90 ? "ready to publish" : "needs review";
      return `${context.channelName} — Readiness ${context.channelReadiness}% — ${status}`;
    }
    return "Check safe zones and DNA compliance for channel publishing";
  }

  // Onboarding (/app/onboarding)
  if (pathname === "/app/onboarding" || pathname.startsWith("/app/onboarding?")) {
    return "Complete brand onboarding to unlock intelligence features";
  }

  // Fallback for unknown routes
  return "Ask about your portfolio, shoots, assets, or campaigns";
}
