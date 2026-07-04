// IPI-51 · DASH-005 + IPI-247 · DESIGN-070 — maps /app/* pathnames to Mastra agent IDs.
// SSOT: tasks/design-docs/handoff/07-navigation-map.md · AGENT-MAP.md
// Keep agent ID strings in sync with app/src/mastra/index.ts agents registry.

const DEFAULT_AGENT = "production-planner";

const BOOKING_WIZARD_PATH = /^\/app\/matching\/talent\/[^/]+\/book(\/|$)/;

// Ordered: most specific first so /app/shoots/new beats /app/shoots.
const ROUTE_MAP: [prefix: string, agentId: string][] = [
  ["/app/crm", "crm-assistant"], // IPI-368 · CRM-AI-002
  ["/app/shoots", "production-planner"],
  ["/app/campaigns", "creative-director"],
  ["/app/brand", "brand-intelligence"],  // IPI-130
  ["/app/assets", "creative-director"],  // IPI-247 · DESIGN-070
  ["/app/bookings", "booking"],  // IPI-348 · MODELGATE-10
  ["/app/model", "booking"],  // IPI-348
  ["/app/roster", "booking"],  // IPI-348
  ["/app/matching", "model-match"],  // IPI-308 · MODEL-P2 (was social-discovery — a placeholder route, never functionally exercised)
  ["/app/preview", "visual-identity"],  // IPI-247
  ["/app/onboarding", "brand-intelligence"],  // IPI-247
];

export function resolveAgentId(pathname: string): string {
  if (BOOKING_WIZARD_PATH.test(pathname)) {
    return "booking";
  }

  for (const [prefix, agentId] of ROUTE_MAP) {
    if (pathname === prefix || pathname.startsWith(prefix + "/")) {
      return agentId;
    }
  }
  return DEFAULT_AGENT;
}
