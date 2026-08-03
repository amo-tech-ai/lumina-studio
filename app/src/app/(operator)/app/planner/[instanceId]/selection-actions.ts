"use server";

// IPI-551 · PLN-S4b — Server Action AdaptivePanel calls to resolve a
// PlannerSelection (from selection.ts) into the entity it points at. Thin
// wrapper, same authenticatedClient() shape as settings/actions.ts and this
// directory's own actions.ts: authenticate first, then delegate to the
<<<<<<< HEAD
// existing typed reads (getInstanceDetail/listMembers) — never a duplicate
// access check, since both already fail closed for cross-org/inaccessible/
// deleted ids.
=======
// existing typed reads (getInstanceDetail/listMembers/listWorkflowPhases) —
// never a duplicate access check, since both already fail closed for
// cross-org/inaccessible/deleted ids.
//
// IPI-579 — "phase" now resolves: the phase row comes from the
// instance's workflow template (listWorkflowPhases) and its tasks from the
// instance detail, via the shared resolvePhaseSelection (same grouping
// semantics the Timeline renders). Resolution shares the timeline's
// permission gate: getInstanceDetail fails closed for anyone without
// canRead, so a phase selection can never leak task detail.
//
// IPI-582 — task resolution also returns canUpdateTasks + assignee options
// for the AdaptivePanel edit form. Permissions come from the existing
// getEffectivePermissions wrapper; assignee names from
// planner_get_member_names (viewer+ assigned). No second permission model.
>>>>>>> origin/main
//
// Never throws: the caller's job on any failure here is "fall back to
// Intelligence mode," not surface a broken Detail panel, so every branch —
// including an unexpected error — resolves to `{ ok: false }`.

<<<<<<< HEAD
import { getInstanceDetail, listMembers } from "@/lib/planner/queries";
import type { PlannerSelectionType } from "@/lib/planner/selection";
import type { PlannerMember, PlannerTask } from "@/lib/planner/types";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type ResolvedPlannerSelection =
  | { kind: "task"; task: PlannerTask }
  | { kind: "member"; member: PlannerMember };
=======
import { getEffectivePermissions } from "@/lib/planner/permissions";
import { getInstanceDetail, listMembers, listWorkflowPhases } from "@/lib/planner/queries";
import { resolvePhaseSelection } from "@/lib/planner/planner-phase-selection";
import type { PlannerSelectionType } from "@/lib/planner/selection";
import type { PlannerMember, PlannerPhase, PlannerTask } from "@/lib/planner/types";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type PlannerAssigneeOption = {
  userId: string;
  displayName: string;
};

export type ResolvedPlannerSelection =
  | {
      kind: "task";
      task: PlannerTask;
      canUpdateTasks: boolean;
      assignees: PlannerAssigneeOption[];
      /** True when planner_get_member_names failed — do not treat [] as valid. */
      assigneesUnavailable?: boolean;
    }
  | { kind: "member"; member: PlannerMember }
  | { kind: "phase"; phase: PlannerPhase; tasks: PlannerTask[] };
>>>>>>> origin/main

type ActionResult =
  | { ok: true; data: ResolvedPlannerSelection }
  | { ok: false };

<<<<<<< HEAD
async function isAuthenticated(): Promise<boolean> {
=======
async function authenticatedClient() {
>>>>>>> origin/main
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
<<<<<<< HEAD
  return !error && Boolean(user);
=======
  if (error || !user) return null;
  return supabase;
>>>>>>> origin/main
}

export async function resolvePlannerSelectionAction(
  instanceId: string,
  selection: { type: PlannerSelectionType; id: string },
): Promise<ActionResult> {
  try {
<<<<<<< HEAD
    if (!(await isAuthenticated())) return { ok: false };
=======
    const supabase = await authenticatedClient();
    if (!supabase) return { ok: false };
>>>>>>> origin/main

    if (selection.type === "task") {
      const result = await getInstanceDetail(instanceId);
      if (!result.ok) return { ok: false };
      const task = result.data.tasks.find((t) => t.id === selection.id);
      if (!task) return { ok: false };
<<<<<<< HEAD
      return { ok: true, data: { kind: "task", task } };
=======

      // Fail closed to read-only if the permission RPC throws — never unlock
      // the edit form on an uncertain answer.
      let canUpdateTasks = false;
      try {
        canUpdateTasks = (await getEffectivePermissions(instanceId, supabase)).canUpdateTasks;
      } catch {
        canUpdateTasks = false;
      }

      let assignees: PlannerAssigneeOption[] = [];
      let assigneesUnavailable = false;
      if (canUpdateTasks) {
        // planner_get_member_names is assignment-scoped (viewer+) and does not
        // require manager-only assignments_select_org — safe for contributors.
        const { data: names, error: namesError } = await supabase.rpc(
          "planner_get_member_names",
          { p_instance_id: instanceId },
        );
        if (namesError) {
          // Empty list would look like "no members" and mis-render the assignee
          // select as Unassigned — fail closed for reassignment only.
          assigneesUnavailable = true;
        } else {
          assignees = (names ?? []).map((n: { user_id: string; display_name: string }) => ({
            userId: n.user_id,
            displayName: n.display_name?.trim() ? n.display_name : "Unnamed member",
          }));
        }
      }

      return {
        ok: true,
        data: { kind: "task", task, canUpdateTasks, assignees, assigneesUnavailable },
      };
>>>>>>> origin/main
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

<<<<<<< HEAD
    // "phase" — always fails closed. There is no per-instance
    // phase-progress/gate-status data contract yet (out of scope for
    // IPI-551; owned by a future ticket), so a phase selection can never
    // resolve. `phase` stays a legal PlannerSelectionType for parsing/
    // serialization only — resolving one always falls back to Intelligence,
    // same code path as any other invalid selection.
=======
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
>>>>>>> origin/main
    return { ok: false };
  } catch {
    return { ok: false };
  }
}
