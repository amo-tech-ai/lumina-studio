// IPI-536 — route helpers so no Planner file hardcodes a route string literal.
// Every internal Planner link must go through these functions.

export function plannerRoute(): string {
  return "/app/planner";
}

export function plannerDashboardRoute(): string {
  return "/app/planner/dashboard";
}

export function plannerInstanceRoute(instanceId: string): string {
  return `/app/planner/${instanceId}`;
}

export function plannerSettingsRoute(instanceId: string): string {
  return `/app/planner/${instanceId}/settings`;
}
