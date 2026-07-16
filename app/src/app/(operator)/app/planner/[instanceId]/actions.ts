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

import {
  setViewConfig,
  shiftTask,
  updateTask,
  type ShiftTaskResult,
  type UpdateTaskResult,
} from "@/lib/planner/mutations";
import type { PersistedViewType, PlannerTaskStatus } from "@/lib/planner/types";
import { createSupabaseServerClient } from "@/lib/supabase/server";

import type { MutationResult } from "@/lib/planner/types";

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
): Promise<MutationResult<ShiftTaskResult>> {
  const client = await authenticatedClient();
  if (!client.ok) return client;

  const result = await shiftTask(
    { instanceId, rootTaskId, deltaDays, idempotencyKey },
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
