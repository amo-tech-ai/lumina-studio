"use server";

// IPI-649 · PLN-DATA-001B-M — Server Actions consumed by IPI-582's Workspace
// UI. Each action only authenticates the caller and delegates to
// mutations.ts — all authorization (assignment, role, cross-org) and
// concurrency/idempotency checking lives inside the
// planner_shift_task/planner_update_task RPCs themselves, matching
// settings/actions.ts's "thin wrapper" precedent. Client code must never
// call these RPCs directly.
//
// idempotencyKey is caller-supplied, not generated here: the client
// generates it once when the user initiates the action and must reuse the
// same key for every retry of that same logical mutation (network failure,
// double-submit, drag-and-drop retry). Generating a fresh key on the server
// on every invocation would defeat the RPC's idempotency/replay contract.

import { revalidatePath } from "next/cache";

import { expandProposedGateChanges } from "@/lib/planner/gate-approve-expand";
import {
  approveGate,
  discardGate,
  setViewConfig,
  shiftTask,
  updateTask,
  type ApproveGateResult,
  type DiscardGateResult,
  type GateChangedTask,
  type ShiftTaskResult,
  type UpdateTaskResult,
} from "@/lib/planner/mutations";
import { getInstanceDetail, listDependencies } from "@/lib/planner/queries";
import type { PersistedViewType, PlannerTaskStatus } from "@/lib/planner/types";
import { createSupabaseServerClient } from "@/lib/supabase/server";

import type { MutationResult } from "@/lib/planner/types";

/**
 * Client-proposed date shifts for Approve.
 * expectedUpdatedAt is the CAS token from the task row the operator previewed
 * (never re-read fresh for proposal roots — that would bless concurrent edits).
 */
export type GateProposedChange = {
  taskId: string;
  newStartDate: string;
  newEndDate: string;
  expectedUpdatedAt: string;
};

async function authenticatedClient(): Promise<MutationResult<Awaited<ReturnType<typeof createSupabaseServerClient>>>> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return { ok: false, error: { code: "UNAUTHENTICATED", message: "Sign in to edit this plan." } };
  }

  return { ok: true, data: supabase };
}

export async function shiftTaskAction(
  instanceId: string,
  rootTaskId: string,
  deltaDays: number,
  idempotencyKey: string,
  /** CAS token from the task version the operator previewed. */
  expectedUpdatedAt: string,
): Promise<MutationResult<ShiftTaskResult>> {
  const client = await authenticatedClient();
  if (!client.ok) return client;

  const result = await shiftTask(
    { instanceId, rootTaskId, deltaDays, idempotencyKey, expectedUpdatedAt },
    client.data,
  );
  if (result.ok) revalidatePath(`/app/planner/${instanceId}`);
  return result;
}

export async function updateTaskAction(
  instanceId: string,
  taskId: string,
  expectedUpdatedAt: string,
  patch: Partial<{
    title: string;
    description: string | null;
    status: PlannerTaskStatus;
    assigneeUserId: string | null;
  }>,
  idempotencyKey: string,
): Promise<MutationResult<UpdateTaskResult>> {
  const client = await authenticatedClient();
  if (!client.ok) return client;

  const result = await updateTask(
    { taskId, instanceId, expectedUpdatedAt, idempotencyKey, patch },
    client.data,
  );
  if (result.ok) revalidatePath(`/app/planner/${instanceId}`);
  return result;
}

export async function setViewConfigAction(
  instanceId: string,
  input: {
    defaultView?: PersistedViewType;
    filters?: Record<string, unknown>;
    sortConfig?: Record<string, unknown>;
  },
): Promise<MutationResult<{ instanceId: string }>> {
  const client = await authenticatedClient();
  if (!client.ok) return client;

  const result = await setViewConfig({ instanceId, ...input }, client.data);
  if (result.ok) revalidatePath(`/app/planner/${instanceId}`);
  return result;
}

// IPI-483 · PLN-ENG-002 (PR3) — thin wrappers around approveGate / discardGate.
// Auth here; authz + CAS + atomicity stay in the SECURITY DEFINER RPCs.

export async function approveGateAction(
  instanceId: string,
  phaseId: string,
  idempotencyKey: string,
  proposedChanges: GateProposedChange[] = [],
): Promise<MutationResult<ApproveGateResult>> {
  const client = await authenticatedClient();
  if (!client.ok) return client;

  const [depsResult, detailResult] = await Promise.all([
    listDependencies(instanceId),
    proposedChanges.length > 0
      ? getInstanceDetail(instanceId)
      : Promise.resolve(null),
  ]);
  if (!depsResult.ok) return { ok: false, error: depsResult.error };

  // Always CAS the full live dependency graph — a filtered/empty edges array
  // falsely trips DEPENDENCY_CHANGED whenever the instance has any edges.
  const expectedDependencyEdges = depsResult.data.map((dep) => ({
    fromTaskId: dep.fromTaskId,
    toTaskId: dep.toTaskId,
    lagDays: dep.lagDays,
  }));

  let changedTasks: GateChangedTask[] = [];
  if (proposedChanges.length > 0) {
    if (!detailResult || !detailResult.ok) {
      return {
        ok: false,
        error: detailResult?.error ?? {
          code: "NOT_FOUND",
          message: "This gate could not be found.",
        },
      };
    }

    for (const change of proposedChanges) {
      if (!change.expectedUpdatedAt?.trim()) {
        return {
          ok: false,
          error: { code: "INVALID_INPUT", message: "That request wasn't valid." },
        };
      }
    }

    const expanded = expandProposedGateChanges(
      detailResult.data.tasks,
      depsResult.data,
      proposedChanges,
    );
    if (!expanded.ok) {
      return {
        ok: false,
        error: { code: "INVALID_INPUT", message: expanded.message },
      };
    }

    const proposalCas = new Map(
      proposedChanges.map((c) => [c.taskId, c.expectedUpdatedAt]),
    );
    const successorIds = expanded.changes
      .filter((c) => !c.fromProposal)
      .map((c) => c.taskId);

    const freshById = new Map<string, string>();
    if (successorIds.length > 0) {
      const { data: freshRows, error: freshError } = await client.data
        .schema("planner")
        .from("tasks")
        .select("id, updated_at")
        .in("id", successorIds);
      if (freshError || !freshRows) {
        return {
          ok: false,
          error: { code: "NOT_FOUND", message: "This gate could not be found." },
        };
      }
      for (const row of freshRows) freshById.set(row.id, row.updated_at);
    }

    for (const change of expanded.changes) {
      const expectedUpdatedAt = change.fromProposal
        ? proposalCas.get(change.taskId)
        : freshById.get(change.taskId);
      if (!expectedUpdatedAt) {
        return {
          ok: false,
          error: { code: "NOT_FOUND", message: "This gate could not be found." },
        };
      }
      changedTasks.push({
        taskId: change.taskId,
        expectedUpdatedAt,
        newStartDate: change.newStartDate,
        newEndDate: change.newEndDate,
      });
    }
  }

  // Date-only approve omits proposedDependencyEdges so the RPC skips cycle
  // detection; expectedDependencyEdges still carries the full graph for CAS.
  const result = await approveGate(
    {
      instanceId,
      phaseId,
      idempotencyKey,
      changedTasks,
      expectedDependencyEdges,
    },
    client.data,
  );
  if (result.ok) revalidatePath(`/app/planner/${instanceId}`);
  return result;
}

export async function discardGateAction(
  instanceId: string,
  phaseId: string,
  idempotencyKey: string,
  reason?: string | null,
): Promise<MutationResult<DiscardGateResult>> {
  const client = await authenticatedClient();
  if (!client.ok) return client;

  const result = await discardGate(
    { instanceId, phaseId, idempotencyKey, reason },
    client.data,
  );
  if (result.ok) revalidatePath(`/app/planner/${instanceId}`);
  return result;
}
