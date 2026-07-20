/**
 * IPI-731 · NAV-001 — Paths for the CopilotKit `navigateTo` frontend tool.
 *
 * Hub sections map to `/app/{section}`. Aliases (crm companies hub, shoot wizard)
 * map to concrete routes the agent cannot express as a bare hub slug.
 */

/** On-disk operator hub folders — keep aligned with marketing-routes / panel tests. */
export const HUB_SECTIONS = [
  "brand",
  "onboarding",
  "shoots",
  "assets",
  "campaigns",
  "matching",
  "preview",
  "crm",
] as const;

/** Extra navigateTo targets that are not hub folder names. */
export const NAV_ALIASES = ["shoot-wizard"] as const;

export const NAV_TARGETS = [...HUB_SECTIONS, ...NAV_ALIASES] as const;

export type NavTarget = (typeof NAV_TARGETS)[number];

export function resolveNavigateToPath(section: NavTarget): string {
  if (section === "crm") return "/app/crm/companies";
  if (section === "shoot-wizard") return "/app/shoots/new";
  return `/app/${section}`;
}
