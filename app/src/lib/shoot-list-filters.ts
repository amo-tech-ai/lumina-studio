/** DC filter chips — explicit mapping to production `shoot.shoot_status` enum (5 values). */
export type ShootStatus =
  | "planning"
  | "active"
  | "post_production"
  | "complete"
  | "archived";

export type ShootListFilter = "all" | ShootStatus;

export const SHOOT_LIST_FILTERS: ShootListFilter[] = [
  "all",
  "planning",
  "active",
  "post_production",
  "complete",
  "archived",
];

export const SHOOT_STATUS_LABELS: Record<ShootStatus, string> = {
  planning: "Planning",
  active: "Active",
  post_production: "Post-Production",
  complete: "Complete",
  archived: "Archived",
};

export const SHOOT_LIST_FILTER_LABELS: Record<ShootListFilter, string> = {
  all: "All",
  ...SHOOT_STATUS_LABELS,
};

/** Dot color per status — references `tokens.css` component tokens, never a raw hex. */
export const SHOOT_STATUS_DOT_TOKEN: Record<ShootStatus, string> = {
  planning: "var(--status-planning-text)",
  active: "var(--status-active-text)",
  post_production: "var(--status-post-text)",
  complete: "var(--status-complete-text)",
  archived: "var(--status-archived-text)",
};

const KNOWN_STATUSES = new Set<string>(Object.keys(SHOOT_STATUS_LABELS));

/** Missing/invalid statuses get a distinct token so they don't masquerade as "planning". */
type NormalizedStatus = ShootStatus | "unknown";

function normalizeStatus(status: string | null | undefined): NormalizedStatus {
  return status && KNOWN_STATUSES.has(status) ? (status as ShootStatus) : "unknown";
}

export function shootStatusLabel(status: string | null | undefined): string {
  const normalized = normalizeStatus(status);
  return normalized === "unknown" ? "Unknown" : SHOOT_STATUS_LABELS[normalized];
}

export function shootStatusDotToken(status: string | null | undefined): string {
  const normalized = normalizeStatus(status);
  return normalized === "unknown"
    ? "var(--color-text-muted)"
    : SHOOT_STATUS_DOT_TOKEN[normalized];
}

export function matchesShootListFilter(
  filter: ShootListFilter,
  status: string | null | undefined,
): boolean {
  if (filter === "all") return true;
  return normalizeStatus(status) === filter;
}

export function shootListCountLabel(shoots: { status: string | null }[]): string {
  const total = shoots.length;
  if (total === 0) return "No shoots planned";
  // DC parity: "in production" counts shoots actively being shot (dc.html renderVals countLabel).
  const inProduction = shoots.filter((s) => normalizeStatus(s.status) === "active").length;
  return `${total} shoot${total === 1 ? "" : "s"} · ${inProduction} in production`;
}
