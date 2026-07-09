// IPI-410 · SCR-21 — booking status → StatusChip dot token map.
// Mirrors crm/status-tokens.ts convention: StatusChip stays domain-free,
// callers resolve their own tokens.
import type { BookingStatus } from "./validation";

export const BOOKING_STATUS_DOT: Record<BookingStatus, string> = {
  requested: "var(--color-warning)",
  quoted: "var(--color-info)",
  approved: "var(--color-info)",
  confirmed: "var(--color-approved)",
  declined: "var(--color-blocked)",
  expired: "var(--color-text-muted)",
  cancelled: "var(--color-blocked)",
};

export function bookingStatusLabel(status: string): string {
  return status.length ? status[0].toUpperCase() + status.slice(1) : status;
}
