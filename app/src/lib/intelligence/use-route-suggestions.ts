// IPI-197 — Dynamic suggestion chips based on route + context
// Maps to 06-ai-workflows.md quick-action matrix for all 8 operator routes

import { useMemo } from "react";

interface SuggestionChip {
  title: string;
  message: string;
}

interface SuggestionsContext {
  hasBrands?: boolean;
  hasSelection?: boolean;
  brandLoaded?: boolean;
  shootLoaded?: boolean;
  campaignLoaded?: boolean;
  creatorLoaded?: boolean;
  channelLoaded?: boolean;
}

interface UseRouteSuggestionsOptions {
  pathname: string;
  context?: SuggestionsContext;
}

/**
 * Generates route-specific suggestion chips for CopilotSidebar.
 *
 * @example
 * // Brand Detail with brand loaded
 * useRouteSuggestions({
 *   pathname: "/app/brand/abc-123",
 *   context: { brandLoaded: true }
 * })
 * // Returns: [
 * //   { title: "Improve Visual score", message: "..." },
 * //   { title: "Plan a shoot", message: "..." },
 * //   { title: "Review assets", message: "..." }
 * // ]
 */
export function useRouteSuggestions({
  pathname,
  context = {},
}: UseRouteSuggestionsOptions): SuggestionChip[] {
  return useMemo(
    () => getSuggestionsForRoute(pathname, context),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [pathname, context.hasBrands, context.hasSelection, context.brandLoaded, context.shootLoaded, context.campaignLoaded, context.creatorLoaded, context.channelLoaded]
  );
}

function getSuggestionsForRoute(
  pathname: string,
  context: SuggestionsContext
): SuggestionChip[] {
  // Command Center (/app)
  if (pathname === "/app") {
    return [
      { title: "Plan a shoot", message: "Open the shoot wizard to plan a new production." },
      { title: "Review approvals", message: "Show me pending approvals that need attention." },
      { title: "Improve a brand", message: "Which brand has the most improvement potential?" },
    ];
  }

  // Brand Detail (/app/brand/[id])
  if (pathname.startsWith("/app/brand/") && pathname.split("/").length > 3) {
    if (context.brandLoaded) {
      return [
        { title: "Improve Visual score", message: "Show me suggestions to improve this brand's Visual DNA score." },
        { title: "Plan a shoot", message: "Plan a shoot for this brand." },
        { title: "Review assets", message: "Show me this brand's assets and their DNA match scores." },
      ];
    }
    return [
      { title: "Analyze brand", message: "Run DNA analysis on this brand." },
      { title: "View portfolio", message: "Go back to the brand portfolio." },
    ];
  }

  // Brand List (/app/brand)
  if (pathname === "/app/brand" || pathname.startsWith("/app/brand?")) {
    if (context.hasBrands) {
      return [
        { title: "Improve visuals", message: "Which brand has the weakest Visual score?" },
        { title: "Plan a shoot", message: "Plan a shoot for one of my brands." },
        { title: "Review assets", message: "Show me assets that need DNA review." },
      ];
    }
    return [
      { title: "Add new brand", message: "Add my first brand to get started." },
      { title: "Example brand", message: "Show me an example brand with full DNA analysis." },
    ];
  }

  // Shoot Detail (/app/shoots/[id])
  if (pathname.startsWith("/app/shoots/") && pathname.split("/").length > 3) {
    if (context.shootLoaded) {
      return [
        { title: "Review Assets", message: "Open the Assets tab to review this shoot's coverage." },
        { title: "Fix all issues", message: "Show me all issues with this shoot and suggest fixes." },
        { title: "Export plan", message: "Download the production brief for this shoot." },
      ];
    }
    return [
      { title: "View all shoots", message: "Go back to the shoots list." },
    ];
  }

  // Shoots List (/app/shoots)
  if (pathname === "/app/shoots" || pathname.startsWith("/app/shoots?")) {
    return [
      { title: "Plan a shoot", message: "Open the shoot wizard to plan a new production." },
      { title: "Find blockers", message: "Which shoots have missing deliverables or blockers?" },
      { title: "Summarize", message: "Give me a summary of all shoots in production." },
    ];
  }

  // Assets (/app/assets)
  if (pathname === "/app/assets" || pathname.startsWith("/app/assets?")) {
    if (context.hasSelection) {
      return [
        { title: "Review low matches", message: "Show me assets with DNA match below 70%." },
        { title: "Suggest replacements", message: "Suggest higher-match alternatives for flagged assets." },
        { title: "Bulk tag", message: "Help me tag these selected assets." },
      ];
    }
    return [
      { title: "Show all assets", message: "Display all assets in the portfolio." },
      { title: "Filter by brand", message: "Filter assets by a specific brand." },
      { title: "Upload assets", message: "How do I upload new assets?" },
    ];
  }

  // Campaigns (/app/campaigns)
  if (pathname === "/app/campaigns" || pathname.startsWith("/app/campaigns?")) {
    if (context.campaignLoaded) {
      return [
        { title: "Campaign health", message: "Explain this campaign's health score and what impacts it." },
        { title: "Deliverable gaps", message: "Which deliverables are missing from this campaign?" },
        { title: "Export plan", message: "Download the campaign brief with all deliverables." },
      ];
    }
    return [
      { title: "Create campaign", message: "How do I create a new campaign?" },
      { title: "View all campaigns", message: "Show me all campaigns in the portfolio." },
    ];
  }

  // Matching (/app/matching)
  if (pathname === "/app/matching" || pathname.startsWith("/app/matching?")) {
    if (context.creatorLoaded) {
      return [
        { title: "Find 90%+ fits", message: "Show me creators with 90% or higher fit scores." },
        { title: "More TikTok", message: "Find TikTok creators with high engagement rates." },
        { title: "Flag risks", message: "Which creators have brand safety concerns?" },
      ];
    }
    return [
      { title: "Start matching", message: "How does creator matching work?" },
      { title: "View all creators", message: "Show me all creators in the network." },
    ];
  }

  // Channel Preview (/app/preview)
  if (pathname === "/app/preview" || pathname.startsWith("/app/preview?")) {
    if (context.channelLoaded) {
      return [
        { title: "Check safe zones", message: "Highlight safe zone violations in the preview." },
        { title: "Suggest crops", message: "What are the optimal crops for this channel?" },
        { title: "Export all", message: "Batch download all channel-ready assets." },
      ];
    }
    return [
      { title: "Select channel", message: "Which channel should I preview?" },
    ];
  }

  // Onboarding (/app/onboarding)
  if (pathname === "/app/onboarding" || pathname.startsWith("/app/onboarding?")) {
    return [
      { title: "Complete onboarding", message: "Help me complete the brand onboarding flow." },
      { title: "Skip for now", message: "Can I skip onboarding and explore first?" },
    ];
  }

  // Fallback for unknown routes
  return [
    { title: "Brands", message: "Open the Brands workspace." },
    { title: "Shoots", message: "Open the Shoots workspace." },
    { title: "Assets", message: "Open the Assets workspace." },
  ];
}
