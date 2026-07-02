import type { BrandIntakeStatus } from "@/lib/brand-hub";

/** DC filter chips — explicit mapping to production `brand_intake_status` enum. */
export type BrandListFilter = "all" | "active" | "analysing" | "draft";

export const BRAND_LIST_FILTERS: BrandListFilter[] = [
  "all",
  "active",
  "analysing",
  "draft",
];

export const BRAND_LIST_FILTER_LABELS: Record<BrandListFilter, string> = {
  all: "All",
  active: "Active",
  analysing: "Analysing",
  draft: "Draft",
};

/** Statuses that indicate an in-flight pipeline (DC "Analysing" chip). */
export const ANALYSING_INTAKE_STATUSES: readonly BrandIntakeStatus[] = [
  "crawl_running",
  "crawl_complete",
  "analysis_running",
];

/** Statuses for operational brands with completed scoring (DC "Active" chip). */
export const ACTIVE_INTAKE_STATUSES: readonly BrandIntakeStatus[] = [
  "ready",
  "scores_complete",
];

/** Statuses for pre-ready / intake states (DC "Draft" chip). */
export const DRAFT_INTAKE_STATUSES: readonly BrandIntakeStatus[] = [
  "brand_created",
  "draft_ready",
];

export function isAnalysingIntakeStatus(
  status: BrandIntakeStatus | string | null | undefined,
): boolean {
  return ANALYSING_INTAKE_STATUSES.includes(status as BrandIntakeStatus);
}

export function matchesBrandListFilter(
  filter: BrandListFilter,
  intakeStatus: BrandIntakeStatus | string | null | undefined,
  hasDnaScore: boolean,
): boolean {
  if (filter === "all") return true;

  const status = (intakeStatus ?? "brand_created") as BrandIntakeStatus;

  if (status === "failed") {
    return filter === "draft";
  }

  switch (filter) {
    case "active":
      return ACTIVE_INTAKE_STATUSES.includes(status) && hasDnaScore;
    case "analysing":
      return isAnalysingIntakeStatus(status);
    case "draft":
      return (
        DRAFT_INTAKE_STATUSES.includes(status) ||
        (!hasDnaScore && !isAnalysingIntakeStatus(status))
      );
    default:
      return true;
  }
}

export function brandListCountLabel(
  brands: { intakeStatus: string | null; dnaScore: number }[],
): string {
  const total = brands.length;
  if (total === 0) return "0 brands";

  let active = 0;
  let analysing = 0;
  let draft = 0;

  for (const brand of brands) {
    const hasDna = brand.dnaScore > 0;
    if (matchesBrandListFilter("active", brand.intakeStatus, hasDna)) active += 1;
    else if (matchesBrandListFilter("analysing", brand.intakeStatus, hasDna)) analysing += 1;
    else if (matchesBrandListFilter("draft", brand.intakeStatus, hasDna)) draft += 1;
  }

  const parts = [`${total} brand${total === 1 ? "" : "s"}`];
  if (active > 0) parts.push(`${active} active`);
  if (analysing > 0) parts.push(`${analysing} analysing`);
  if (draft > 0) parts.push(`${draft} draft`);

  return parts.join(" · ");
}
