// IPI-536 — recorded status state machine + UI treatment. Downstream tickets
// (mutations, dashboard, settings) read this instead of re-deriving valid
// transitions or badge styling per screen.

import type { PlannerInstanceStatus } from "./types";

const TRANSITIONS: Record<PlannerInstanceStatus, PlannerInstanceStatus[]> = {
  draft: ["planned", "cancelled"],
  planned: ["active", "cancelled"],
  active: ["blocked", "completed", "cancelled"],
  blocked: ["active", "cancelled"],
  completed: ["archived"],
  archived: [],
  cancelled: [],
};

export function isValidTransition(
  from: PlannerInstanceStatus,
  to: PlannerInstanceStatus,
): boolean {
  return TRANSITIONS[from].includes(to);
}

export type InstanceUiTone = "neutral" | "info" | "success" | "warning" | "danger";

export interface InstanceUiTreatment {
  label: string;
  tone: InstanceUiTone;
}

const UI_TREATMENT: Record<PlannerInstanceStatus, InstanceUiTreatment> = {
  draft: { label: "Draft", tone: "neutral" },
  planned: { label: "Planned", tone: "info" },
  active: { label: "Active", tone: "info" },
  blocked: { label: "Blocked", tone: "danger" },
  completed: { label: "Completed", tone: "success" },
  archived: { label: "Archived", tone: "neutral" },
  cancelled: { label: "Cancelled", tone: "neutral" },
};

// Falls back rather than indexing UI_TREATMENT directly: a status value can
// reach here that predates this union (e.g. a DB enum value added by a
// migration before this map is redeployed to match), so `status` is typed
// as the closed union but isn't guaranteed to be a member of it at runtime.
const FALLBACK_TREATMENT: InstanceUiTreatment = { label: "Unknown", tone: "neutral" };

export function getInstanceUiTreatment(
  status: PlannerInstanceStatus,
): InstanceUiTreatment {
  return UI_TREATMENT[status] ?? FALLBACK_TREATMENT;
}
