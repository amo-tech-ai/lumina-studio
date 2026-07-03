/** IPI-273 — Shoots List filter chips (DC Shoots List.v2.image-first.dc.html) */

export type ShootListFilter = "all" | "planning" | "post_production" | "active" | "complete";

export const SHOOT_LIST_FILTERS: ShootListFilter[] = [
  "all",
  "planning",
  "post_production",
  "active",
  "complete",
];

export const SHOOT_LIST_FILTER_LABELS: Record<ShootListFilter, string> = {
  all: "All",
  planning: "Draft",
  post_production: "Confirmed",
  active: "In Production",
  complete: "Complete",
};

export function shootStatusDisplay(status: string): { label: string; dot: string } {
  switch (status) {
    case "planning":
      return { label: "Draft", dot: "#c4c7cc" };
    case "post_production":
      return { label: "Confirmed", dot: "#9ca3af" };
    case "active":
      return { label: "In Production", dot: "#111111" };
    case "complete":
      return { label: "Complete", dot: "#6b7280" };
    case "archived":
      return { label: "Archived", dot: "#9ca3af" };
    default:
      return { label: status.replace(/_/g, " "), dot: "#9ca3af" };
  }
}

export function matchesShootListFilter(filter: ShootListFilter, status: string): boolean {
  if (filter === "all") return status !== "archived";
  return status === filter;
}

export function shootListCountLabel(shoots: { status: string }[]): string {
  if (shoots.length === 0) return "No shoots planned";
  const inProduction = shoots.filter((s) => s.status === "active").length;
  return `${shoots.length} shoot${shoots.length !== 1 ? "s" : ""} • ${inProduction} in production`;
}
