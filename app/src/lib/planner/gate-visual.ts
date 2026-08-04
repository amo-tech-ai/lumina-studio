// IPI-483 · PLN-ENG-002 (PR3) — map persisted InstanceGate status onto the
// Timeline/Kanban diamond visuals (SCR-32). Completing tasks alone never
// yields Approved; that requires listInstanceGates / gate_approvals.

import type { GateUiStatus, InstanceGate } from "./types";
import type { GateVisualState, TimelineModel, TimelinePhase } from "./planner-view-model";

/** Reachable → amber "ready" diamond (SCR-32 wording: Ready for approval). */
export function gateUiToVisual(status: GateUiStatus): GateVisualState {
  switch (status) {
    case "approved":
      return "approved";
    case "reachable":
      return "ready";
    case "discarded":
      return "discarded";
    case "locked":
    default:
      return "locked";
  }
}

export const GATE_STATUS_LABEL: Record<GateUiStatus, string> = {
  locked: "Locked",
  reachable: "Ready for approval",
  approved: "Approved",
  discarded: "Discarded",
};

/** Overlay listInstanceGates onto a TimelineModel built from task completion alone. */
export function applyInstanceGates(
  model: TimelineModel,
  gates: InstanceGate[],
): TimelineModel {
  if (gates.length === 0) return model;
  const byPhase = new Map(gates.map((g) => [g.phaseId, g]));

  const mapRow = (row: TimelinePhase): TimelinePhase => {
    const gate = byPhase.get(row.phase.id);
    if (!gate || !row.phase.gateType) return row;
    return { ...row, gate: gateUiToVisual(gate.status), gateRequiredRole: gate.requiredRole };
  };

  return {
    ...model,
    phases: model.phases.map(mapRow),
    scheduled: model.scheduled.map(mapRow),
    unscheduled: model.unscheduled.map(mapRow),
    invalid: model.invalid.map(mapRow),
  };
}
