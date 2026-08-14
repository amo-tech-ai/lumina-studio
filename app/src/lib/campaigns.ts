/** Campaign helpers — reuse-first for /app/campaigns (DESIGN-058). */
import type { Database } from "@/types/supabase";

export type CampaignStatus = Database["public"]["Enums"]["campaign_status"];
export type CampaignObjective = Database["public"]["Enums"]["campaign_objective_type"];
export type DeliverableStatus = Database["public"]["Enums"]["deliverable_status"];

export const CAMPAIGN_STATUSES: CampaignStatus[] = ["planning", "active", "live", "complete"];
export type CampaignFilter = "all" | CampaignStatus;
export const CAMPAIGN_FILTERS: CampaignFilter[] = ["all", ...CAMPAIGN_STATUSES];

export const CAMPAIGN_STATUS_LABELS: Record<CampaignStatus, string> = {
  planning: "Planning",
  active: "Active",
  live: "Live",
  complete: "Complete",
};

export const CAMPAIGN_FILTER_LABELS: Record<CampaignFilter, string> = {
  all: "All",
  ...CAMPAIGN_STATUS_LABELS,
};

export const CAMPAIGN_STATUS_DOT: Record<CampaignStatus, string> = {
  planning: "var(--status-planning-text, var(--color-text-muted))",
  active: "var(--status-active-text, var(--color-approved))",
  live: "var(--color-approved)",
  complete: "var(--color-text-muted)",
};

export const CAMPAIGN_OBJECTIVE_LABELS: Record<CampaignObjective, string> = {
  brand_awareness: "Brand awareness",
  product_launch: "Product launch",
  conversion: "Conversion",
  retention: "Retention",
  community: "Community",
  seo_discovery: "SEO & discovery",
  ecommerce_direct: "E-commerce direct",
};

const KNOWN = new Set<string>(CAMPAIGN_STATUSES);

function normalizeStatus(s: string | null | undefined): CampaignStatus | "unknown" {
  return s && KNOWN.has(s) ? (s as CampaignStatus) : "unknown";
}

export function campaignStatusLabel(s: string | null | undefined): string {
  const n = normalizeStatus(s);
  return n === "unknown" ? "Unknown" : CAMPAIGN_STATUS_LABELS[n];
}
export function campaignStatusDot(s: string | null | undefined): string {
  const n = normalizeStatus(s);
  return n === "unknown" ? "var(--color-text-muted)" : CAMPAIGN_STATUS_DOT[n];
}
export function matchesCampaignFilter(filter: CampaignFilter, status: string | null | undefined): boolean {
  if (filter === "all") return true;
  return normalizeStatus(status) === filter;
}
export function campaignCountLabel(campaigns: { status: string | null }[]): string {
  const total = campaigns.length;
  if (total === 0) return "No campaigns yet";
  const active = campaigns.filter((c) => normalizeStatus(c.status) === "active").length;
  return `${total} campaign${total === 1 ? "" : "s"} · ${active} active`;
}
export function formatCampaignDates(start: string | null | undefined, end: string | null | undefined): string | null {
  if (!start && !end) return null;
  const fmt = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" });
  const s = start ? fmt.format(new Date(start + "T12:00:00")) : null;
  const e = end ? fmt.format(new Date(end + "T12:00:00")) : null;
  if (s && e) return `${s} – ${e}`;
  return s ?? e;
}
export function campaignObjectiveLabel(o: CampaignObjective | null | undefined): string | null {
  if (!o) return null;
  return CAMPAIGN_OBJECTIVE_LABELS[o] ?? o.replace(/_/g, " ");
}

export type CampaignRow = Database["public"]["Tables"]["campaigns"]["Row"];
export type DeliverableRow = Database["public"]["Tables"]["campaign_deliverables"]["Row"];

export function deliverableProgress(deliverables: DeliverableRow[]): { total: number; approved: number; pct: number; label: string } {
  const total = deliverables.length;
  if (total === 0) return { total: 0, approved: 0, pct: 0, label: "No deliverables" };
  const approved = deliverables.filter((d) => d.status === "approved").length;
  const pct = Math.round((approved / total) * 100);
  return { total, approved, pct, label: `${approved}/${total} deliverables · ${pct}%` };
}
