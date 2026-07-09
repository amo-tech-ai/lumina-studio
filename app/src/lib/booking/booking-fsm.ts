// IPI-411 · SCR-22 — UI-facing view of the transition_booking FSM
// (supabase/migrations/20260703213000_ipi341_transition_booking_rpc.sql).
// Scoped to brand-operator actions only: no talent/agency "provide quote"
// UI exists yet (no talent portal), so that transition isn't rendered here
// even though the RPC allows it — add it when a talent-facing surface exists.
import type { BookingStatus } from "./validation";

export type BookingActionKind = "approve" | "decline" | "cancel" | "confirm";

const TERMINAL_STATUSES: BookingStatus[] = ["declined", "expired", "cancelled"];

export function allowedActions(status: BookingStatus, viewerRole: string): BookingActionKind[] {
  if (TERMINAL_STATUSES.includes(status)) return [];

  const actions: BookingActionKind[] = [];

  if (status === "approved" && viewerRole === "brand") {
    actions.push("confirm");
  }

  if (status === "requested" || status === "quoted") {
    if (viewerRole === "brand") actions.push("approve");
    actions.push("decline");
  }

  actions.push("cancel");

  return actions;
}

export const BOOKING_STEPPER_STATUSES: BookingStatus[] = ["requested", "quoted", "confirmed"];

export function stepperIndex(status: BookingStatus): number {
  if (status === "approved") return BOOKING_STEPPER_STATUSES.indexOf("quoted");
  const idx = BOOKING_STEPPER_STATUSES.indexOf(status);
  return idx === -1 ? 0 : idx;
}
