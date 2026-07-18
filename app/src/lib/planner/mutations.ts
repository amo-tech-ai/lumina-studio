// IPI-575 · PLN-DATA-001C — thin error-mapping wrappers around the 3
// planner_* member-mutation RPCs (migration 20260714100000). Follows the
// same idiom as app/src/lib/crm/convert-deal.ts: authorization lives inside
// the SECURITY DEFINER function, this layer only maps `raise exception`
// substrings to a typed result — but returns Planner's own MutationResult<T>
// (no `status` field), matching IPI-536's recorded decision that Planner
// mutations don't wrap an external API.

import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database, Json } from "@/types/supabase";

import { PlannerEngine } from "./engine";
import { getEffectivePermissions } from "./permissions";
import { getInstanceDetail, listDependencies, listWorkflowPhases } from "./queries";
import type {
  CreateInstanceParams,
  MutationResult,
  PersistedViewType,
  PlannerRole,
  PlannerTaskStatus,
} from "./types";

type Db = SupabaseClient<Database>;

const engine = new PlannerEngine();

export type MemberAssignment = {
  id: string;
  instanceId: string;
  userId: string;
  role: PlannerRole;
};

function toAssignment(row: { id: string; instance_id: string; user_id: string; role: string }): MemberAssignment {
  return {
    id: row.id,
    instanceId: row.instance_id,
    userId: row.user_id,
    role: row.role as PlannerRole,
  };
}

// SEC-004 cloaks "no account" vs. "not in org" behind one message so a caller
// can't probe registration status. The RPC only raises user_not_available
// post-migration (20260714211800, PR #390) — until that migration has landed
// everywhere this app code runs, it may still raise the pre-migration codes.
// Recognize all three but map them to the *same* message, so a schema that's
// momentarily behind never regresses to UNKNOWN_ERROR or reopens the leak.
const USER_UNAVAILABLE_CODES = ["user_not_available", "no_account_found", "user_not_in_org"];

function memberMutationError(fn: string, message: string): MutationResult<never> {
  const code =
    ["invalid_role", "instance_not_found", "insufficient_role_for_target", "insufficient_role",
      ...USER_UNAVAILABLE_CODES, "already_member", "member_not_found", "last_owner_protected"]
      .find((known) => message.includes(known)) ?? "UNKNOWN_ERROR";

  if (code === "UNKNOWN_ERROR") {
    // Never forward the raw Postgres message — same idiom as convert-deal.ts.
    console.error(`[planner/mutations] ${fn} rpc failed:`, message);
    return { ok: false, error: { code: "UNKNOWN_ERROR", message: "The request could not be completed." } };
  }

  const humanMessage: Record<string, string> = {
    invalid_role: "That role can't be assigned here.",
    instance_not_found: "This plan could not be found.",
    insufficient_role: "You don't have permission to do that.",
    insufficient_role_for_target: "Only an owner can perform that action.",
    user_not_available: "That person is not available to invite.",
    no_account_found: "That person is not available to invite.",
    user_not_in_org: "That person is not available to invite.",
    already_member: "That person is already a member.",
    member_not_found: "That member could not be found.",
    last_owner_protected: "A plan must always have at least one owner.",
  };

  return { ok: false, error: { code: USER_UNAVAILABLE_CODES.includes(code) ? "user_not_available" : code, message: humanMessage[code] } };
}

export async function inviteMember(
  { instanceId, email, role }: { instanceId: string; email: string; role: PlannerRole },
  client: Db,
): Promise<MutationResult<MemberAssignment>> {
  const { data, error } = await client
    .rpc("planner_invite_member", { p_instance_id: instanceId, p_email: email, p_role: role })
    .single();

  if (error) return memberMutationError("planner_invite_member", error.message ?? "");
  if (!data) return memberMutationError("planner_invite_member", "no row returned");

  return { ok: true, data: toAssignment(data) };
}

export async function updateRole(
  { instanceId, userId, role }: { instanceId: string; userId: string; role: PlannerRole },
  client: Db,
): Promise<MutationResult<MemberAssignment>> {
  const { data, error } = await client
    .rpc("planner_update_role", { p_instance_id: instanceId, p_target_user_id: userId, p_new_role: role })
    .single();

  if (error) return memberMutationError("planner_update_role", error.message ?? "");
  if (!data) return memberMutationError("planner_update_role", "no row returned");

  return { ok: true, data: toAssignment(data) };
}

export async function removeAssignment(
  { instanceId, userId }: { instanceId: string; userId: string },
  client: Db,
): Promise<MutationResult<MemberAssignment>> {
  const { data, error } = await client
    .rpc("planner_remove_assignment", { p_instance_id: instanceId, p_target_user_id: userId })
    .single();

  if (error) return memberMutationError("planner_remove_assignment", error.message ?? "");
  if (!data) return memberMutationError("planner_remove_assignment", "no row returned");

  return { ok: true, data: toAssignment(data) };
}

// IPI-649 · PLN-DATA-001B-M — task mutation adapters. `shiftTask`/`updateTask`
// call the transactional RPCs from PR #418; the RPC itself is the authority
// on authorization, concurrency, and idempotency, matching the member
// mutations above — this layer only maps `{ok:false, code}` JSON responses
// to MutationResult, never a `raise exception` substring (that idiom is
// specific to the flat-row member RPCs; these two return jsonb directly).
//
// idempotencyKey is caller-owned, not generated here: a retry of the *same*
// logical mutation must reuse the *same* key so the RPC can detect and
// replay it. Generating a fresh key inside this function on every call would
// silently defeat the whole idempotency mechanism.

type PlannerRpcResult<T> = { ok: true; replayed: boolean } & T | { ok: false; code: string; conflicts?: unknown };

export type ShiftTaskResult = {
  replayed: boolean;
  changedTasks: Array<{ taskId: string; updatedAt: string }>;
};

export type UpdateTaskResult = {
  replayed: boolean;
  taskId: string;
  updatedAt: string;
};

const TASK_MUTATION_MESSAGES: Record<string, string> = {
  UNAUTHENTICATED: "Sign in to edit this plan.",
  FORBIDDEN: "You don't have permission to edit this task.",
  NOT_FOUND: "This task could not be found.",
  STALE_VERSION: "This task changed since you last viewed it. Refresh and try again.",
  DEPENDENCY_CHANGED: "This plan's schedule changed since you last viewed it. Refresh and try again.",
  IDEMPOTENCY_CONFLICT: "This request conflicts with one already in progress. Refresh and try again.",
  INVALID_INPUT: "That request wasn't valid.",
  INSTANCE_TERMINAL: "This plan is archived or cancelled and can no longer be edited.",
};

function taskMutationError(fn: string, code: string): MutationResult<never> {
  const message = TASK_MUTATION_MESSAGES[code];
  if (!message) {
    // Never forward the raw Postgres message — same idiom as convert-deal.ts.
    console.error(`[planner/mutations] ${fn} rpc failed:`, code);
    return { ok: false, error: { code: "UNKNOWN_ERROR", message: "The request could not be completed." } };
  }
  return { ok: false, error: { code, message } };
}

export async function shiftTask(
  {
    instanceId,
    rootTaskId,
    deltaDays,
    idempotencyKey,
  }: { instanceId: string; rootTaskId: string; deltaDays: number; idempotencyKey: string },
  client: Db,
): Promise<MutationResult<ShiftTaskResult>> {
  const [detailResult, depsResult] = await Promise.all([
    getInstanceDetail(instanceId),
    listDependencies(instanceId),
  ]);

  if (!detailResult.ok) return { ok: false, error: detailResult.error };
  if (!depsResult.ok) return { ok: false, error: depsResult.error };

  const taskMap = new Map(detailResult.data.tasks.map((task) => [task.id, task]));
  const dependencies = depsResult.data;

  if (!taskMap.has(rootTaskId)) {
    return taskMutationError("planner_shift_task", "NOT_FOUND");
  }

  // Re-fetch dates AND updated_at together, for every task the engine is
  // about to reason about, immediately before computing the shift — a
  // deliberately narrow, local query rather than extending getInstanceDetail's
  // shared, intentionally column-minimized read. This closes the
  // stale-dates-before-shift-RPC gap (Cursor HIGH / codex P1): the old code
  // computed the shift from the earlier getInstanceDetail() read, then
  // separately re-fetched only updated_at right before the RPC call — if a
  // concurrent edit changed a task's dates AND updated_at in between, the
  // freshly-fetched updated_at would match the current row (passing the
  // RPC's CAS check) while the dates being sent were still the stale ones,
  // silently overwriting the concurrent edit instead of failing
  // STALE_VERSION. Fetching both together, from the same query, guarantees
  // the engine computation and the CAS check share one snapshot.
  const taskIds = [...taskMap.keys()];
  const { data: freshRows, error: freshError } = await client
    .schema("planner")
    .from("tasks")
    .select("id, start_date, end_date, updated_at")
    .in("id", taskIds);

  if (freshError || !freshRows) {
    return taskMutationError("planner_shift_task", "NOT_FOUND");
  }

  const freshById = new Map(freshRows.map((row) => [row.id, row]));

  // Overlay fresh dates onto every task the engine is about to reason
  // about (dependency-graph participants, not just the ones that end up
  // changed) so the shift is computed from current state. A task missing
  // from this re-fetch (deleted/made inaccessible since the earlier
  // getInstanceDetail read) keeps its stale snapshot dates here — that's
  // fine for a task that merely participates in the dependency graph, but
  // NOT fine for a task the engine actually decides to write to (see the
  // changedIds guard below, which is where a missing row must hard-fail).
  for (const [id, task] of taskMap) {
    const fresh = freshById.get(id);
    if (fresh) taskMap.set(id, { ...task, startDate: fresh.start_date, endDate: fresh.end_date });
  }

  const { updated, conflicts } = engine.shiftTask(rootTaskId, deltaDays, taskMap, dependencies);
  if (conflicts.length > 0) {
    return { ok: false, error: { code: "DEPENDENCY_CHANGED", message: conflicts.join(" ") } };
  }

  const changedIds = [...updated.entries()]
    .filter(([id, task]) => {
      const before = taskMap.get(id);
      return before && (before.startDate !== task.startDate || before.endDate !== task.endDate);
    })
    .map(([id]) => id);

  if (changedIds.length === 0) {
    return { ok: true, data: { replayed: false, changedTasks: [] } };
  }

  // Only the tasks actually being written need a fresh row to CAS against —
  // narrowing this guard to changedIds (rather than every task in the
  // instance) means an unrelated task being deleted elsewhere no longer
  // fails a valid shift of tasks that don't touch it (Sentry MEDIUM).
  for (const id of changedIds) {
    if (!freshById.has(id)) {
      return taskMutationError("planner_shift_task", "NOT_FOUND");
    }
  }

  const changedTasks = changedIds.map((id) => {
    const task = updated.get(id)!;
    const fresh = freshById.get(id)!; // guaranteed present by the guard above
    return {
      taskId: id,
      expectedUpdatedAt: fresh.updated_at,
      newStartDate: task.startDate,
      newEndDate: task.endDate,
    };
  });

  const expectedDependencyEdges = dependencies
    .filter((dep) => changedIds.includes(dep.fromTaskId) || changedIds.includes(dep.toTaskId))
    .map((dep) => ({ fromTaskId: dep.fromTaskId, toTaskId: dep.toTaskId, lagDays: dep.lagDays }));

  const { data, error } = await client.rpc("planner_shift_task", {
    p_instance_id: instanceId,
    p_root_task_id: rootTaskId,
    p_delta_days: deltaDays,
    p_idempotency_key: idempotencyKey,
    p_changed_tasks: changedTasks,
    p_expected_dependency_edges: expectedDependencyEdges,
  });

  if (error || !data) {
    console.error("[planner/mutations] planner_shift_task rpc failed:", error?.message ?? "empty response");
    return { ok: false, error: { code: "UNKNOWN_ERROR", message: "The request could not be completed." } };
  }

  const result = data as PlannerRpcResult<ShiftTaskResult>;
  if (!result.ok) return taskMutationError("planner_shift_task", result.code);

  return { ok: true, data: { replayed: result.replayed, changedTasks: result.changedTasks } };
}

export async function updateTask(
  {
    taskId,
    instanceId,
    expectedUpdatedAt,
    idempotencyKey,
    patch,
  }: {
    taskId: string;
    instanceId: string;
    expectedUpdatedAt: string;
    idempotencyKey: string;
    patch: Partial<{
      title: string;
      description: string | null;
      status: PlannerTaskStatus;
      assigneeUserId: string | null;
    }>;
  },
  client: Db,
): Promise<MutationResult<UpdateTaskResult>> {
  const dbPatch: Record<string, unknown> = {};
  if (patch.title !== undefined) dbPatch.title = patch.title;
  if (patch.description !== undefined) dbPatch.description = patch.description;
  if (patch.status !== undefined) dbPatch.status = patch.status;
  if (patch.assigneeUserId !== undefined) dbPatch.assignee_user_id = patch.assigneeUserId;

  if (Object.keys(dbPatch).length === 0) {
    return taskMutationError("planner_update_task", "INVALID_INPUT");
  }

  const { data, error } = await client.rpc("planner_update_task", {
    p_task_id: taskId,
    p_instance_id: instanceId,
    p_expected_updated_at: expectedUpdatedAt,
    p_idempotency_key: idempotencyKey,
    p_patch: dbPatch as Json,
  });

  if (error || !data) {
    console.error("[planner/mutations] planner_update_task rpc failed:", error?.message ?? "empty response");
    return { ok: false, error: { code: "UNKNOWN_ERROR", message: "The request could not be completed." } };
  }

  const result = data as PlannerRpcResult<UpdateTaskResult>;
  if (!result.ok) return taskMutationError("planner_update_task", result.code);

  return { ok: true, data: { replayed: result.replayed, taskId: result.taskId, updatedAt: result.updatedAt } };
}

// setViewConfig needs no RPC: planner.view_configs already has
// user_id = auth.uid() RLS on all 4 verbs (view_configs_select_own/
// _insert_own/_update_own/_delete_own, confirmed live) and a real
// UNIQUE (user_id, instance_id) constraint — a plain upsert through the
// schema-scoped client already respects RLS for row ownership. RLS alone
// doesn't verify plan access though, so an explicit getEffectivePermissions
// check (matching getViewConfig's) runs first — see below. "list" is never
// persisted as
// default_view — the DB CHECK constraint on planner.view_configs already
// rejects it (excludes "list" from its allowed values); this function simply
// never includes default_view in the patch when the caller's active view is
// "list", leaving it untouched rather than attempting (and failing) to write it.
export async function setViewConfig(
  {
    instanceId,
    defaultView,
    filters,
    sortConfig,
  }: {
    instanceId: string;
    defaultView?: PersistedViewType;
    filters?: Record<string, unknown>;
    sortConfig?: Record<string, unknown>;
  },
  client: Db,
): Promise<MutationResult<{ instanceId: string }>> {
  const {
    data: { user },
  } = await client.auth.getUser();

  if (!user) {
    return { ok: false, error: { code: "UNAUTHENTICATED", message: "Sign in to save your view preference." } };
  }

  // Same assignment-level access gate getViewConfig() (queries.ts) applies
  // before reading: view_configs' own RLS (view_configs_*_own) only checks
  // user_id = auth.uid(), so on its own it never verifies the caller still
  // has access to the referenced instance — a revoked assignment (or anyone
  // who merely knows the instance UUID) could otherwise still upsert their
  // own row against it. getEffectivePermissions throws on RPC failure (see
  // resolveReadPermissions in queries.ts), so treat that the same way too.
  let canRead: boolean;
  try {
    canRead = (await getEffectivePermissions(instanceId, client)).canRead;
  } catch (err) {
    console.error("[planner/mutations] setViewConfig permission check failed:", err);
    return { ok: false, error: { code: "UNKNOWN_ERROR", message: "Your view preference could not be saved." } };
  }
  if (!canRead) {
    // Enumeration-safe "not found" message, matching getViewConfig() —
    // never reveal that the instance exists to a caller without access.
    return { ok: false, error: { code: "INVALID_INPUT", message: "This plan could not be found." } };
  }

  const patch: {
    user_id: string;
    instance_id: string;
    default_view?: string;
    filters?: Json;
    sort_config?: Json;
  } = { user_id: user.id, instance_id: instanceId };
  if (defaultView !== undefined) patch.default_view = defaultView;
  if (filters !== undefined) patch.filters = filters as Json;
  if (sortConfig !== undefined) patch.sort_config = sortConfig as Json;

  const { error } = await client
    .schema("planner")
    .from("view_configs")
    .upsert(patch, { onConflict: "user_id,instance_id" });

  if (error) {
    console.error("[planner/mutations] setViewConfig upsert failed:", error.message);
    return { ok: false, error: { code: "UNKNOWN_ERROR", message: "Your view preference could not be saved." } };
  }

  return { ok: true, data: { instanceId } };
}

export type CreateInstanceResult = {
  replayed: boolean;
  instanceId: string;
};

const INSTANCE_MUTATION_MESSAGES: Record<string, string> = {
  UNAUTHENTICATED: "Sign in to create a plan.",
  FORBIDDEN: "You don't have permission to create a plan for this organization.",
  NOT_FOUND: "The selected workflow or item could not be found.",
  INVALID_INPUT: "That request wasn't valid.",
  INSTANCE_ALREADY_EXISTS: "A plan already exists for this item and workflow.",
  IDEMPOTENCY_CONFLICT: "This request conflicts with one already in progress. Refresh and try again.",
};

function instanceMutationError(code: string): MutationResult<never> {
  const message = INSTANCE_MUTATION_MESSAGES[code];
  if (!message) {
    // Never forward the raw Postgres message — same idiom as taskMutationError.
    console.error("[planner/mutations] planner_create_instance rpc failed:", code);
    return { ok: false, error: { code: "UNKNOWN_ERROR", message: "The request could not be completed." } };
  }
  return { ok: false, error: { code, message } };
}

// Engine-computes/RPC-persists (PR 2 contract): PlannerEngine.buildSchedule()
// is the sole source of task dates (business-day arithmetic) and sort_order
// (phase.orderIndex) — the RPC only validates and persists what it's given,
// closing the calendar-day-vs-business-day gap the migration-only PR 1 left
// open. buildSchedule() also returns a finish_to_start dependency chain
// between consecutive phase tasks; that's deliberately discarded here and
// never sent to the RPC — v1 policy is no auto-generated dependency rows,
// since sequential dates alone aren't proof of a real dependency.
export async function createInstance(
  params: CreateInstanceParams & { idempotencyKey: string },
  client: Db,
): Promise<MutationResult<CreateInstanceResult>> {
  const phasesResult = await listWorkflowPhases(params.workflowId);
  if (!phasesResult.ok) return { ok: false, error: phasesResult.error };

  const { tasks } = engine.buildSchedule(phasesResult.data, params);

  const taskPayload = tasks.map((task) => ({
    phaseId: task.phaseId,
    title: task.title,
    startDate: task.startDate,
    endDate: task.endDate,
    durationDays: task.durationDays,
    sortOrder: task.sortOrder,
    priority: task.priority,
    assigneeUserId: task.assigneeUserId,
  }));

  const { data, error } = await client.rpc("planner_create_instance", {
    p_org_id: params.orgId,
    p_entity_type: params.entityType,
    p_entity_id: params.entityId,
    p_workflow_id: params.workflowId,
    p_name: params.name,
    p_planned_start: params.plannedStart,
    p_idempotency_key: params.idempotencyKey,
    p_tasks: taskPayload as unknown as Json,
    p_owner_user_id: params.ownerUserId,
  });

  if (error || !data) {
    console.error("[planner/mutations] planner_create_instance rpc failed:", error?.message ?? "empty response");
    return { ok: false, error: { code: "UNKNOWN_ERROR", message: "The request could not be completed." } };
  }

  const result = data as PlannerRpcResult<{ instanceId: string }>;
  if (!result.ok) return instanceMutationError(result.code);

  return { ok: true, data: { replayed: result.replayed, instanceId: result.instanceId } };
}
