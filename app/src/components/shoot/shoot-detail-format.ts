import type { CrewRole, ShootAssetStatus, ShotStatus } from "@/lib/shoot/get-shoot-detail";

export function formatMoney(amount: number | null, currency: string | null): string {
  if (amount == null) return "—";
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency ?? "USD",
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `$${amount.toLocaleString()}`;
  }
}

export function formatShootDate(iso: string | null): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  // ponytail: pin to UTC so SSR/hydration render the same day regardless of TZ.
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });
}

export const CREW_ROLE_LABEL: Record<CrewRole, string> = {
  photographer: "Photographer",
  model: "Model",
  stylist: "Stylist",
  makeup_artist: "Makeup Artist",
  hair_stylist: "Hair Stylist",
  assistant: "Assistant",
  producer: "Producer",
  other: "Other",
};

export const SHOT_STATUS_LABEL: Record<ShotStatus, string> = {
  pending: "Pending",
  captured: "Captured",
  approved: "Approved",
};

const SHOT_STATUS_DOT: Record<ShotStatus, string> = {
  pending: "var(--color-text-muted)",
  captured: "var(--color-info)",
  approved: "var(--color-approved)",
};

export function shotStatusDot(status: ShotStatus): string {
  return SHOT_STATUS_DOT[status] ?? SHOT_STATUS_DOT.pending;
}

export const ASSET_STATUS_LABEL: Record<ShootAssetStatus, string> = {
  pending: "Pending",
  approved: "Approved",
  flagged: "Flagged",
  rejected: "Rejected",
};

/** Crew initials from role only — no resolved person name is available in shoot.shoot_crew. */
export function crewInitials(role: CrewRole): string {
  return CREW_ROLE_LABEL[role]?.slice(0, 2).toUpperCase() ?? "?";
}

/** shoot.shoot_deliverables.status has no fixed DB enum (free text) — used by
 *  both the Overview and Deliverables tabs, so it lives here once. */
export function deliverableDot(status: string | null): string {
  const known = new Set(["draft", "in_progress", "ready", "delivered", "pending", "approved"]);
  if (!status || !known.has(status)) return "var(--color-text-muted)";
  if (status === "delivered" || status === "ready" || status === "approved") return "var(--color-approved)";
  if (status === "pending") return "var(--color-warning-text)";
  return "var(--color-text-muted)"; // "draft" / "in_progress"
}
