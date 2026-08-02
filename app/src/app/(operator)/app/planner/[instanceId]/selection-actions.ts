"use server";

// IPI-551 · PLN-S4b — Server Action AdaptivePanel calls to resolve a
// PlannerSelection (from selection.ts) into the entity it points at. Thin
// wrapper, same authenticatedClient() shape as settings/actions.ts and this
// directory's own actions.ts: authenticate first, then delegate to the
// existing typed reads (getInstanceDetail/listMembers/listWorkflowPhases) —
// never a duplicate access check, since both already fail closed for
// cross-org/inaccessible/deleted ids.
//
// IPI-579 · PLN-S1B — "phase" now resolves: the phase row comes from the
// instance's workflow template (listWorkflowPhases) and its tasks from the
// instance detail, via the shared resolvePhaseSelection (same grouping
// semantics the Timeline renders). Resolution shares the timeline's
// permission gate: getInstanceDetail fails closed for anyone without
// canRead, so a phase selection can never leak task detail.
//
// Never throws: the caller's job on any failure here is "fall back to
// Intelligence mode," not surface a broken Detail panel, so every branch —
// including an unexpected error — resolves to `{ ok: false }`.

import { getInstanceDetail, listMembers, listWorkflowPhases } from "@/lib/planner/queries";
import { resolvePhaseSelection } from "@/lib/planner/planner-phase-selection";
import type { PlannerSelectionType } from "@/lib/planner/selection";
import type { PlannerMember, PlannerPhase, PlannerTask } from "@/lib/planner/types";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type ResolvedPlannerSelection =
  | { kind: "task"; task: PlannerTask }
  | { kind: "member"; member: PlannerMember }
  | { kind: "phase"; phase: PlannerPhase; tasks: PlannerTask[] };

type ActionResult =
  | { ok: true; data: ResolvedPlannerSelection }
  | { ok: false };

async function isAuthenticated(): Promise<boolean> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  return !error && Boolean(user);
}

export async function resolvePlannerSelectionAction(
  instanceId: string,
  selection: { type: PlannerSelectionType; id: string },
): Promise<ActionResult> {
  try {
    if (!(await isAuthenticated())) return { ok: false };

    if (selection.type === "task") {
      const result = await getInstanceDetail(instanceId);
      if (!result.ok) return { ok: false };
      const task = result.data.tasks.find((t) => t.id === selection.id);
      if (!task) return { ok: false };
      return { ok: true, data: { kind: "task", task } };
    }

    if (selection.type === "member") {
      const result = await listMembers(instanceId);
      if (!result.ok) return { ok: false };
      // Keyed on the assignment row id (member.id), not userId — matches
      // how member-table.tsx keys rows and how PlannerSelection.id is
      // documented in IPI-551.
      const member = result.data.find((m) => m.id === selection.id);
      if (!member) return { ok: false };
      return { ok: true, data: { kind: "member", member } };
    }

    if (selection.type === "phase") {
      const instanceResult = await getInstanceDetail(instanceId);
      if (!instanceResult.ok) return { ok: false };
      const phasesResult = await listWorkflowPhases(instanceResult.data.workflowId);
      if (!phasesResult.ok) return { ok: false };
      const resolved = resolvePhaseSelection(
        phasesResult.data,
        instanceResult.data.tasks,
        selection.id,
      );
      if (!resolved) return { ok: false };
      return { ok: true, data: { kind: "phase", ...resolved } };
    }

    // Any other type — always fails closed, same code path as any other
    // invalid selection: falls back to Intelligence mode.
    return { ok: false };
  } catch {
    return { ok: false };
  }
}
