// IPI-579 — shared phase-selection resolution. Not named
// `planner-task-selection.ts` because it selects PHASES: given the phase
// list and an instance's tasks, resolve a `?selection=phase:<uuid>` into the
// phase plus its tasks for the AdaptivePanel. Pure — shared by the
// server-side resolver (selection-actions.ts) and any client code, so phase
// grouping semantics live in exactly one place.

import type { PlannerPhase, PlannerTask } from "./types";
import { groupTasksByPhase } from "./planner-view-model";

export interface ResolvedPhaseSelection {
  phase: PlannerPhase;
  tasks: PlannerTask[];
}

export function resolvePhaseSelection(
  phases: PlannerPhase[],
  tasks: PlannerTask[],
  phaseId: string,
): ResolvedPhaseSelection | null {
  const phase = phases.find((p) => p.id === phaseId);
  if (!phase) return null;
  return { phase, tasks: groupTasksByPhase(tasks).get(phaseId) ?? [] };
}
