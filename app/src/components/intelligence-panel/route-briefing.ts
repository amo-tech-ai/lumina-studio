export type RouteBriefing = {
  section: string;
  headline: string;
  nextActions: string[];
};

const DEFAULT_ACTIONS = ["Plan a shoot", "Review brands", "Open Assets"];

export function resolveRouteBriefing(pathname: string): RouteBriefing {
  if (pathname === "/app" || pathname === "/app/") {
    return {
      section: "Command Center",
      headline: "Portfolio overview — pending approvals and weakest brands surface here.",
      nextActions: ["Plan a shoot", "Review approvals", "Improve a brand"],
    };
  }
  if (pathname.startsWith("/app/brand")) {
    return {
      section: "Brand Hub",
      headline: "Brand DNA, scores, and approvals for the active brand.",
      nextActions: ["Explain DNA scores", "Re-analyze brand", "View assets"],
    };
  }
  if (pathname.startsWith("/app/shoots/new")) {
    return {
      section: "Shoot Wizard",
      headline: "Step through brief, deliverables, and shot list with HITL gates.",
      nextActions: ["Improve brief", "Add deliverables", "Review shot list"],
    };
  }
  if (pathname.startsWith("/app/shoots/")) {
    return {
      section: "Shoot Detail",
      headline: "Active shoot context — tabs for shots, budget, and deliverables.",
      nextActions: ["Improve shot list", "Adjust budget", "Add deliverables"],
    };
  }
  if (pathname.startsWith("/app/shoots")) {
    return {
      section: "Shoots",
      headline: "Plan and track production shoots for the active brand.",
      nextActions: ["Start a shoot", "Review planning shoots", "Open latest shoot"],
    };
  }
  if (pathname.startsWith("/app/assets")) {
    return {
      section: "Assets",
      headline: "Review asset DNA compliance and bulk actions.",
      nextActions: ["Explain DNA match", "Filter blocked assets", "Link to campaign"],
    };
  }
  if (pathname.startsWith("/app/campaigns")) {
    return {
      section: "Campaigns",
      headline: "Campaign health, deliverables, and creative approvals.",
      nextActions: ["Explain campaign health", "Duplicate campaign", "Add deliverable"],
    };
  }
  if (pathname.startsWith("/app/matching")) {
    return {
      section: "Matching",
      headline: "Creator fit scores and shortlist actions.",
      nextActions: ["Explain creator fit", "Refresh matches", "Add to shortlist"],
    };
  }
  if (pathname.startsWith("/app/preview")) {
    return {
      section: "Channel Preview",
      headline: "Per-channel crop, safe zones, and readiness.",
      nextActions: ["Check IG safe zone", "Compare channels", "Explain readiness"],
    };
  }
  if (pathname.startsWith("/app/onboarding")) {
    return {
      section: "Onboarding",
      headline: "Brand intake funnel — crawl and DNA bootstrap.",
      nextActions: ["Continue intake", "Review crawl status", "Approve brand draft"],
    };
  }
  return {
    section: "Operator",
    headline: "Choose a workspace section to get contextual guidance.",
    nextActions: DEFAULT_ACTIONS,
  };
}
