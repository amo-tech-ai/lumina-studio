import type { CrewRole, ShootAssetStatus, ShotStatus } from "@/lib/shoot/get-shoot-detail";

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

/** shoot.shoot_deliverables.status has no DB CHECK constraint (free text).
 *  "planned"/"covered"/"delivered" are the values seen in production (verified
 *  live); "draft"/"in_progress"/"pending"/"ready"/"approved" are kept as
 *  defensive synonyms in case another writer uses different lifecycle names.
 *  Shared by the Overview and Deliverables tabs so they can never disagree. */
const DELIVERABLE_READY = new Set(["delivered", "covered", "ready", "approved"]);
const DELIVERABLE_IN_PROGRESS = new Set(["planned", "pending", "in_progress"]);

/** Normalizes case/whitespace — status is free text with no DB constraint, so
 *  "Delivered"/"READY"/"delivered " from another writer should still match. */
function normalizeDeliverableStatus(status: string | null): string | null {
  return status ? status.trim().toLowerCase() : null;
}

export function isDeliverableReady(status: string | null): boolean {
  const normalized = normalizeDeliverableStatus(status);
  return !!normalized && DELIVERABLE_READY.has(normalized);
}

export function deliverableDot(status: string | null): string {
  if (isDeliverableReady(status)) return "var(--color-approved)";
  const normalized = normalizeDeliverableStatus(status);
  if (normalized && DELIVERABLE_IN_PROGRESS.has(normalized)) return "var(--color-warning-text)";
  return "var(--color-text-muted)"; // "draft" / unrecognized
}
