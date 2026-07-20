// IPI-197 — Dynamic suggestion chips based on route + context
// Maps to 06-ai-workflows.md quick-action matrix for all 8 operator routes

import { useMemo } from "react";
import {
  normalizeRoutePath,
  routeBrandId,
  routeShootId,
} from "./normalize-route-path";

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
 */
export function useRouteSuggestions({
  pathname,
  context = {},
}: UseRouteSuggestionsOptions): SuggestionChip[] {
  return useMemo(
    () => getSuggestionsForRoute(pathname, context),
    [
      pathname,
      context.hasBrands,
      context.hasSelection,
      context.brandLoaded,
      context.shootLoaded,
      context.campaignLoaded,
      context.creatorLoaded,
      context.channelLoaded,
    ],
  );
}

function getSuggestionsForRoute(
  pathname: string,
  context: SuggestionsContext,
): SuggestionChip[] {
  const normalizedPath = normalizeRoutePath(pathname);

  // Command Center (/app)
  if (normalizedPath === "/app") {
    return [
      {
        title: "Plan a shoot",
        // IPI-731 — explicit wizard path so navigateTo uses shoot-wizard, not shoots list.
        message:
          "Open the shoot wizard at /app/shoots/new (navigateTo shoot-wizard) to plan a new production.",
      },
      { title: "Review approvals", message: "Show me pending approvals that need attention." },
      { title: "Improve a brand", message: "Which brand has the most improvement potential?" },
    ];
  }

  // Brand Detail (/app/brand/[id])
  const brandId = routeBrandId(pathname);
  if (brandId) {
    if (context.brandLoaded) {
      return [
        { title: "Improve Visual score", message: "Show me suggestions to improve this brand's Visual DNA score." },
        {
          title: "Plan a shoot",
          message:
            "Open the shoot wizard at /app/shoots/new (navigateTo shoot-wizard) to plan a shoot for this brand.",
        },
        { title: "Review assets", message: "Show me this brand's assets and their DNA match scores." },
      ];
    }
    return [
      { title: "Analyze brand", message: "Run DNA analysis on this brand." },
      { title: "View portfolio", message: "Go back to the brand portfolio." },
    ];
  }

  // Brand List (/app/brand)
  if (normalizedPath === "/app/brand") {
    if (context.hasBrands) {
      return [
        { title: "Improve visuals", message: "Which brand has the weakest Visual score?" },
        {
          title: "Plan a shoot",
          message:
            "Open the shoot wizard at /app/shoots/new (navigateTo shoot-wizard) to plan a shoot for one of my brands.",
        },
        { title: "Review assets", message: "Show me assets that need DNA review." },
      ];
    }
    return [
      { title: "Add new brand", message: "Add my first brand to get started." },
      { title: "Example brand", message: "Show me an example brand with full DNA analysis." },
    ];
  }

  // Shoot Wizard (/app/shoots/new) — IPI-731; must not fall through to generic fallback
  if (normalizedPath === "/app/shoots/new") {
    return [
      {
        title: "Pick channels",
        message: "Help me choose deliverable channels for this new shoot.",
      },
      {
        title: "Suggest shoot type",
        message: "Recommend a shoot type and brief for this brand.",
      },
      {
        title: "View shoots list",
        message: "Open the shoots list at /app/shoots (navigateTo shoots).",
      },
    ];
  }

  // Shoot Detail (/app/shoots/[id])
  const shootId = routeShootId(pathname);
  if (shootId) {
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
  if (normalizedPath === "/app/shoots") {
    return [
      {
        title: "Plan a shoot",
        message:
          "Open the shoot wizard at /app/shoots/new (navigateTo shoot-wizard) to plan a new production.",
      },
      { title: "Find blockers", message: "Which shoots have missing deliverables or blockers?" },
      { title: "Summarize", message: "Give me a summary of all shoots in production." },
    ];
  }

  // Assets (/app/assets)
  if (normalizedPath === "/app/assets") {
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
  if (normalizedPath === "/app/campaigns") {
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
  if (normalizedPath === "/app/matching") {
    if (context.creatorLoaded) {
      return [
        { title: "Find 90%+ fits", message: "Show me talent with 90% or higher fit scores." },
        { title: "Available now", message: "Find talent available for my shoot dates." },
        { title: "Check budget fit", message: "Which talent fits my budget tier?" },
      ];
    }
    return [
      { title: "Start matching", message: "How does talent matching work?" },
      { title: "View all talent", message: "Show me all talent in the marketplace." },
    ];
  }

  // Channel Preview (/app/preview)
  if (normalizedPath === "/app/preview") {
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
  if (normalizedPath === "/app/onboarding") {
    return [
      { title: "Complete onboarding", message: "Help me complete the brand onboarding flow." },
      { title: "Skip for now", message: "Can I skip onboarding and explore first?" },
    ];
  }

  // CRM — Relationship Hub (IPI-368)
  if (normalizedPath.startsWith("/app/crm/companies/")) {
    return [
      { title: "Log a note", message: "Log a note on this company." },
      { title: "Find contacts", message: "Search contacts linked to this company." },
      { title: "View pipeline", message: "Show deals for this company." },
    ];
  }
  if (normalizedPath === "/app/crm/companies" || normalizedPath === "/app/crm") {
    return [
      { title: "Search companies", message: "Search companies in our CRM." },
      { title: "Open contacts", message: "Open the contacts list." },
      { title: "View pipeline", message: "Open the deal pipeline." },
    ];
  }
  if (normalizedPath.startsWith("/app/crm/contacts/")) {
    return [
      { title: "Log a call", message: "Log a call with this contact." },
      { title: "Find company", message: "Which company is this contact linked to?" },
    ];
  }
  if (normalizedPath === "/app/crm/contacts") {
    return [
      { title: "Search contacts", message: "Search contacts by name or email." },
      { title: "Open companies", message: "Open the companies list." },
    ];
  }
  if (normalizedPath.startsWith("/app/crm/pipeline/")) {
    return [
      { title: "Move stage", message: "Move this deal to the next non-terminal stage." },
      { title: "Log activity", message: "Log an activity on this deal." },
    ];
  }
  if (normalizedPath === "/app/crm/pipeline") {
    return [
      { title: "Summarize pipeline", message: "Summarize deals by stage." },
      { title: "Find stale deals", message: "Which deals have been stuck the longest?" },
    ];
  }

  // Fallback for unknown routes
  return [
    { title: "Brands", message: "Open the Brands workspace." },
    { title: "Shoots", message: "Open the Shoots workspace." },
    { title: "Assets", message: "Open the Assets workspace." },
  ];
}
