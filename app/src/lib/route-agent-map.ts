// IPI-51 · DASH-005 — maps /app/* pathnames to Mastra agent IDs.
// Keep agent ID strings in sync with app/src/mastra/index.ts agents registry.
// ponytail: prefix-match only — no regex, no dynamic segments needed here.

const DEFAULT_AGENT = "production-planner";

// Ordered: most specific first so /app/shoots/new beats /app/shoots.
const ROUTE_MAP: [prefix: string, agentId: string][] = [
  ["/app/shoots", "production-planner"],
  ["/app/campaigns", "creative-director"],
  ["/app/brand", "brand-intelligence"],  // IPI-130
  ["/app/assets", "production-planner"],
  ["/app/matching", "production-planner"],
  ["/app/onboarding", "production-planner"],
];

export function resolveAgentId(pathname: string): string {
  for (const [prefix, agentId] of ROUTE_MAP) {
    if (pathname === prefix || pathname.startsWith(prefix + "/")) {
      return agentId;
    }
  }
  return DEFAULT_AGENT;
}
