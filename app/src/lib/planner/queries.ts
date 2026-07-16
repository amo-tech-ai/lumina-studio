import type { PostgrestClient } from "@supabase/postgrest-js";
import type { SupabaseClient } from "@supabase/supabase-js";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Database } from "@/types/supabase";

import { getEffectivePermissions, type EffectivePermissions } from "./permissions";

import type {
  EntityType,
  PersistedViewType,
  PlannerAssignment,
  PlannerDependency,
  PlannerInstance,
  PlannerInstanceStatus,
  PlannerMember,
  PlannerTask,
  PlannerTaskStatus,
  PlannerViewConfig,
} from "./types";

type PlannerClient = PostgrestClient<
  Database,
  Database["__InternalSupabase"],
  "planner",
  Database["planner"]
>;
type InstanceRow = Database["planner"]["Tables"]["instances"]["Row"];

type DashboardTaskRow = {
  assignee_user_id: string | null;
  end_date: string | null;
  id: string;
  status: PlannerTaskStatus;
};

type DashboardInstanceRow = Pick<InstanceRow, "id" | "planned_end" | "status"> & {
  tasks: DashboardTaskRow[] | null;
};

type HubTaskRow = Pick<DashboardTaskRow, "end_date" | "id" | "status">;

type HubInstanceRow = InstanceRow & {
  tasks: HubTaskRow[] | null;
};

export type PlannerQueryErrorCode = "UNAUTHENTICATED" | "INVALID_INPUT" | "QUERY_FAILED";

export type PlannerQueryError = {
  code: PlannerQueryErrorCode;
  message: string;
};

export type PlannerQueryResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: PlannerQueryError };

export type UnavailableApprovalMetric = {
  available: false;
  count: null;
  reason: "workflow_approval_unavailable";
};

export type PlannerDashboardSummary = {
  progress: number | null;
  atRisk: number;
  dueToday: number;
  needsApproval: UnavailableApprovalMetric;
  myTasks: number;
};

export type ListPlannerInstancesInput = {
  cursor?: string | null;
  limit?: number;
  search?: string;
  entityType?: EntityType;
  status?: PlannerInstanceStatus;
  statuses?: PlannerInstanceStatus[];
  includeArchived?: boolean;
};

export type PlannerInstanceSummary = {
  id: string;
  orgId: string;
  workflowId: string;
  entityType: EntityType;
  entityId: string;
  name: string;
  status: PlannerInstanceStatus;
  plannedStart: string | null;
  plannedEnd: string | null;
  ownerUserId: string | null;
  createdAt: string;
  updatedAt: string;
  progress: number | null;
  atRisk: boolean;
};

export type PlannerInstancePage = {
  items: PlannerInstanceSummary[];
  nextCursor: string | null;
};

type PlannerCursor = {
  createdAt: string;
  id: string;
};

type NormalizedListPlannerInstancesInput = Omit<
  ListPlannerInstancesInput,
  "cursor" | "limit" | "search"
> & {
  cursor: PlannerCursor | null;
  limit: number;
  search: string;
};

const DEFAULT_PAGE_LIMIT = 20;
const MAX_PAGE_LIMIT = 50;
const MAX_SEARCH_LENGTH = 100;

export const DASHBOARD_INSTANCE_STATUSES: PlannerInstanceStatus[] = [
  "draft",
  "planned",
  "active",
  "blocked",
  "completed",
];

const RISK_ELIGIBLE_STATUSES = new Set<PlannerInstanceStatus>([
  "planned",
  "active",
  "blocked",
]);

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const TIMESTAMPTZ_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,6})?(?:Z|[+-]\d{2}:\d{2})$/;

const UNAVAILABLE_APPROVAL: UnavailableApprovalMetric = {
  available: false,
  count: null,
  reason: "workflow_approval_unavailable",
};

function failure(code: PlannerQueryErrorCode, message: string): PlannerQueryResult<never> {
  return { ok: false, error: { code, message } };
}

function utcDate(now: Date): string {
  return now.toISOString().slice(0, 10);
}

function isIncomplete(status: PlannerTaskStatus): boolean {
  return status !== "done" && status !== "cancelled";
}

function eligibleTasks<T extends { status: PlannerTaskStatus }>(tasks: T[]): T[] {
  return tasks.filter((task) => task.status !== "cancelled");
}

export function calculatePlannerProgress(
  tasks: Array<{ status: PlannerTaskStatus }>,
): number | null {
  const eligible = eligibleTasks(tasks);
  if (eligible.length === 0) return null;
  const completed = eligible.filter((task) => task.status === "done").length;
  return Math.round((completed / eligible.length) * 100);
}

export function isPlannerInstanceAtRisk(
  instance: {
    status: PlannerInstanceStatus;
    planned_end: string | null;
    tasks: Array<{ status: PlannerTaskStatus; end_date: string | null }>;
  },
  today: string,
): boolean {
  if (!RISK_ELIGIBLE_STATUSES.has(instance.status)) return false;

  const tasks = eligibleTasks(instance.tasks);
  const hasOverdueTask = tasks.some(
    (task) => isIncomplete(task.status) && task.end_date !== null && task.end_date < today,
  );
  if (hasOverdueTask) return true;

  const latestScheduledEnd = tasks.reduce<string | null>((latest, task) => {
    if (!task.end_date) return latest;
    return latest === null || task.end_date > latest ? task.end_date : latest;
  }, null);

  return Boolean(
    instance.planned_end && latestScheduledEnd && latestScheduledEnd > instance.planned_end,
  );
}

export function derivePlannerDashboardSummary(
  instances: DashboardInstanceRow[],
  authenticatedUserId: string,
  today: string,
): PlannerDashboardSummary {
  const tasks = instances.flatMap((instance) => instance.tasks ?? []);

  return {
    progress: calculatePlannerProgress(tasks),
    atRisk: instances.filter((instance) =>
      isPlannerInstanceAtRisk(
        {
          status: instance.status,
          planned_end: instance.planned_end,
          tasks: instance.tasks ?? [],
        },
        today,
      ),
    ).length,
    dueToday: tasks.filter(
      (task) => isIncomplete(task.status) && task.end_date === today,
    ).length,
    needsApproval: UNAVAILABLE_APPROVAL,
    myTasks: tasks.filter(
      (task) => isIncomplete(task.status) && task.assignee_user_id === authenticatedUserId,
    ).length,
  };
}

function toInstanceSummary(instance: HubInstanceRow, today: string): PlannerInstanceSummary {
  const tasks = instance.tasks ?? [];
  return {
    id: instance.id,
    orgId: instance.org_id,
    workflowId: instance.workflow_id,
    entityType: instance.entity_type as EntityType,
    entityId: instance.entity_id,
    name: instance.name,
    status: instance.status,
    plannedStart: instance.planned_start,
    plannedEnd: instance.planned_end,
    ownerUserId: instance.owner_user_id,
    createdAt: instance.created_at,
    updatedAt: instance.updated_at,
    progress: calculatePlannerProgress(tasks),
    atRisk: isPlannerInstanceAtRisk(
      {
        status: instance.status,
        planned_end: instance.planned_end,
        tasks,
      },
      today,
    ),
  };
}

function encodeCursor(cursor: PlannerCursor): string {
  return Buffer.from(JSON.stringify(cursor), "utf8").toString("base64url");
}

function decodeCursor(value: string): PlannerQueryResult<PlannerCursor> {
  if (!value || value.length > 512 || !/^[A-Za-z0-9_-]+$/.test(value)) {
    return failure("INVALID_INPUT", "The Planner cursor is invalid.");
  }

  try {
    const parsed = JSON.parse(Buffer.from(value, "base64url").toString("utf8")) as Partial<PlannerCursor>;
    if (typeof parsed.createdAt !== "string" || typeof parsed.id !== "string") {
      return failure("INVALID_INPUT", "The Planner cursor is invalid.");
    }
    if (
      !TIMESTAMPTZ_RE.test(parsed.createdAt) ||
      Number.isNaN(Date.parse(parsed.createdAt)) ||
      !UUID_RE.test(parsed.id)
    ) {
      return failure("INVALID_INPUT", "The Planner cursor is invalid.");
    }
    return {
      ok: true,
      data: { createdAt: parsed.createdAt, id: parsed.id.toLowerCase() },
    };
  } catch {
    return failure("INVALID_INPUT", "The Planner cursor is invalid.");
  }
}

function escapeRegexPattern(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function normalizeListPlannerInstancesInput(
  input: ListPlannerInstancesInput,
): PlannerQueryResult<NormalizedListPlannerInstancesInput> {
  const limit = input.limit ?? DEFAULT_PAGE_LIMIT;
  if (!Number.isInteger(limit) || limit < 1 || limit > MAX_PAGE_LIMIT) {
    return failure("INVALID_INPUT", `Planner page limit must be between 1 and ${MAX_PAGE_LIMIT}.`);
  }

  const search = input.search?.trim() ?? "";
  if (search.length > MAX_SEARCH_LENGTH) {
    return failure(
      "INVALID_INPUT",
      `Planner search must be ${MAX_SEARCH_LENGTH} characters or fewer.`,
    );
  }

  const cursor = input.cursor ? decodeCursor(input.cursor) : null;
  if (cursor && !cursor.ok) return cursor;

  return {
    ok: true,
    data: {
      ...input,
      cursor: cursor?.data ?? null,
      limit,
      search,
    },
  };
}

function toInstancePage(rows: HubInstanceRow[], limit: number): PlannerInstancePage {
  const hasMore = rows.length > limit;
  const pageRows = rows.slice(0, limit);
  const last = pageRows.at(-1);
  const nextCursor = hasMore && last
    ? encodeCursor({ createdAt: last.created_at, id: last.id })
    : null;
  const today = utcDate(new Date());

  return {
    items: pageRows.map((instance) => toInstanceSummary(instance, today)),
    nextCursor,
  };
}

async function authenticatedPlannerClient(): Promise<
  PlannerQueryResult<{ client: PlannerClient; base: SupabaseClient<Database>; userId: string }>
> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return failure("UNAUTHENTICATED", "Sign in to view Planner data.");
  }

  return {
    ok: true,
    data: {
      client: supabase.schema("planner") as PlannerClient,
      base: supabase as SupabaseClient<Database>,
      userId: user.id,
    },
  };
}

export async function getPlannerDashboardSummary(): Promise<
  PlannerQueryResult<PlannerDashboardSummary>
> {
  const context = await authenticatedPlannerClient();
  if (!context.ok) return context;

  const { data, error } = await context.data.client
    .from("instances")
    .select("id, planned_end, status, tasks(id, status, end_date, assignee_user_id)")
    .in("status", DASHBOARD_INSTANCE_STATUSES);

  if (error) {
    return failure("QUERY_FAILED", "Planner dashboard data could not be loaded.");
  }

  return {
    ok: true,
    data: derivePlannerDashboardSummary(
      (data ?? []) as DashboardInstanceRow[],
      context.data.userId,
      utcDate(new Date()),
    ),
  };
}

export async function listPlannerInstances(
  input: ListPlannerInstancesInput = {},
): Promise<PlannerQueryResult<PlannerInstancePage>> {
  const normalized = normalizeListPlannerInstancesInput(input);
  if (!normalized.ok) return normalized;
  const options = normalized.data;

  const context = await authenticatedPlannerClient();
  if (!context.ok) return context;

  let query = context.data.client
    .from("instances")
    .select("*, tasks(id, status, end_date)");

  if (options.statuses) {
    query = query.in("status", options.statuses);
  } else if (options.status) {
    query = query.eq("status", options.status);
  } else if (!options.includeArchived) {
    query = query.neq("status", "archived");
  }
  if (options.entityType) query = query.eq("entity_type", options.entityType);
  if (options.search) {
    query = query.filter("name", "imatch", `.*${escapeRegexPattern(options.search)}.*`);
  }
  if (options.cursor) {
    query = query.or(
      `created_at.lt.${options.cursor.createdAt},and(created_at.eq.${options.cursor.createdAt},id.lt.${options.cursor.id})`,
    );
  }

  const { data, error } = await query
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(options.limit + 1);

  if (error) {
    return failure("QUERY_FAILED", "Planner instances could not be loaded.");
  }

  return {
    ok: true,
    data: toInstancePage((data ?? []) as HubInstanceRow[], options.limit),
  };
}

type TaskRow = Database["planner"]["Tables"]["tasks"]["Row"];
type FullDependencyRow = Database["planner"]["Tables"]["dependencies"]["Row"];
type FullViewConfigRow = Database["planner"]["Tables"]["view_configs"]["Row"];

// Explicit column lists, not select("*") — same rationale as
// INSTANCE_DETAIL_COLUMNS: dependencies_select_org/view_configs_select_own
// are the only gate on future columns; a bare `*` forwards anything added
// later without a decision to include it. The Pick<> types below keep
// toDependency/toViewConfig's parameter types honest about exactly what's
// selected, matching HubTaskRow's convention above.
const DEPENDENCY_COLUMNS = "id, instance_id, from_task_id, to_task_id, dep_type, lag_days";
const VIEW_CONFIG_COLUMNS = "id, user_id, instance_id, default_view, filters, sort_config";

type DependencyRow = Pick<
  FullDependencyRow,
  "id" | "instance_id" | "from_task_id" | "to_task_id" | "dep_type" | "lag_days"
>;
type ViewConfigRow = Pick<
  FullViewConfigRow,
  "id" | "user_id" | "instance_id" | "default_view" | "filters" | "sort_config"
>;

function toTask(row: TaskRow): PlannerTask {
  return {
    id: row.id,
    instanceId: row.instance_id,
    phaseId: row.phase_id,
    parentTaskId: row.parent_task_id,
    title: row.title,
    description: row.description,
    startDate: row.start_date,
    endDate: row.end_date,
    durationDays: row.duration_days,
    status: row.status,
    priority: row.priority as PlannerTask["priority"],
    assigneeUserId: row.assignee_user_id,
    assigneeRole: row.assignee_role,
    sortOrder: row.sort_order,
  };
}

function toDependency(row: DependencyRow): PlannerDependency {
  return {
    id: row.id,
    instanceId: row.instance_id,
    fromTaskId: row.from_task_id,
    toTaskId: row.to_task_id,
    depType: row.dep_type,
    lagDays: row.lag_days,
  };
}

// jsonb columns aren't guaranteed to hold an object at the type level —
// Postgres accepts any valid JSON value (array, string, number, literal
// null) for a jsonb column, so a legacy or malformed row could violate the
// Record<string, unknown> contract a plain `as` cast assumes. Normalize
// defensively instead of trusting the cast.
function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function toViewConfig(row: ViewConfigRow): PlannerViewConfig {
  return {
    id: row.id,
    userId: row.user_id,
    instanceId: row.instance_id,
    defaultView: row.default_view as PersistedViewType,
    filters: isPlainObject(row.filters) ? row.filters : {},
    sortConfig: isPlainObject(row.sort_config) ? row.sort_config : {},
  };
}

// IPI-574 · PLN-DATA-001B (reads-only PR) — Workspace instance detail.
// Bounded by design: a Planner instance is bounded by its source workflow
// template (11 phases, small task count per phase), so no pagination is
// needed for v1. planner.events (unbounded audit history) is deliberately
// excluded — Workspace doesn't need it, and Realtime/notifications
// (IPI-480/481) will consume events separately.
// Explicit column list, not `select("*")` — instances_select_org/
// tasks_select_org RLS is org-scoped (any org member), so a bare `*` would
// forward every future column (including anything sensitive added later)
// straight to the frontend with no second gate. List exactly what
// PlannerInstance/PlannerTask consume.
const INSTANCE_DETAIL_COLUMNS =
  "id, org_id, workflow_id, entity_type, entity_id, name, status, planned_start, planned_end, owner_user_id, " +
  "tasks(id, instance_id, phase_id, parent_task_id, title, description, start_date, end_date, duration_days, status, priority, assignee_user_id, assignee_role, sort_order)";

// getEffectivePermissions (permissions.ts) throws if its underlying RPC call
// fails — this wraps it so getInstanceDetail/listDependencies can honor
// their PlannerQueryResult contract instead of leaking an unhandled
// rejection to the caller.
async function resolveReadPermissions(
  instanceId: string,
  client: SupabaseClient<Database>,
  queryFailedMessage: string,
): Promise<PlannerQueryResult<EffectivePermissions>> {
  try {
    return { ok: true, data: await getEffectivePermissions(instanceId, client) };
  } catch {
    return failure("QUERY_FAILED", queryFailedMessage);
  }
}

export async function getInstanceDetail(
  id: string,
): Promise<PlannerQueryResult<PlannerInstance>> {
  const context = await authenticatedPlannerClient();
  if (!context.ok) return context;

  // instances_select_org/tasks_select_org are org-scoped (is_org_member),
  // not assignment-scoped — an org member never assigned to this specific
  // instance would otherwise pass RLS and still receive full task detail,
  // even though the app's own permission model treats them as canRead:
  // false (same model the Settings route already gates on). Fail closed
  // before querying, using the same enumeration-safe "not found" message
  // as a genuinely missing instance — never reveal it exists.
  const permissionsResult = await resolveReadPermissions(
    id,
    context.data.base,
    "This plan could not be loaded.",
  );
  if (!permissionsResult.ok) return permissionsResult;
  if (!permissionsResult.data.canRead) {
    return failure("INVALID_INPUT", "This plan could not be found.");
  }

  const { data, error } = await context.data.client
    .from("instances")
    .select(INSTANCE_DETAIL_COLUMNS)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    return failure("QUERY_FAILED", "This plan could not be loaded.");
  }
  if (!data) {
    return failure("INVALID_INPUT", "This plan could not be found.");
  }

  const row = data as unknown as InstanceRow & { tasks: TaskRow[] | null };
  return {
    ok: true,
    data: {
      id: row.id,
      orgId: row.org_id,
      workflowId: row.workflow_id,
      entityType: row.entity_type as EntityType,
      entityId: row.entity_id,
      name: row.name,
      status: row.status,
      plannedStart: row.planned_start,
      plannedEnd: row.planned_end,
      ownerUserId: row.owner_user_id,
      // PostgREST doesn't guarantee embedded-resource row order — sort
      // explicitly rather than relying on whatever order the DB happens to
      // return, which Workspace consumers would otherwise render as the
      // plan sequence, disagreeing with each task's own sortOrder and with
      // buildSchedule's schedule semantics.
      tasks: (row.tasks ?? []).map(toTask).sort((a, b) => a.sortOrder - b.sortOrder),
    },
  };
}

export async function listDependencies(
  instanceId: string,
): Promise<PlannerQueryResult<PlannerDependency[]>> {
  const context = await authenticatedPlannerClient();
  if (!context.ok) return context;

  // Same assignment-level gate as getInstanceDetail above —
  // dependencies_select_org is also only org-scoped, not assignment-scoped.
  const permissionsResult = await resolveReadPermissions(
    instanceId,
    context.data.base,
    "Plan dependencies could not be loaded.",
  );
  if (!permissionsResult.ok) return permissionsResult;
  if (!permissionsResult.data.canRead) {
    return failure("INVALID_INPUT", "This plan could not be found.");
  }

  const { data, error } = await context.data.client
    .from("dependencies")
    .select(DEPENDENCY_COLUMNS)
    .eq("instance_id", instanceId);

  if (error) {
    return failure("QUERY_FAILED", "Plan dependencies could not be loaded.");
  }

  return { ok: true, data: (data ?? []).map(toDependency) };
}

// IPI-574 · PLN-DATA-001B correction #1 (2026-07-16) — identity is
// server-resolved from the session, matching IPI-538's precedent; no
// caller-supplied userId. Returns null (not an error) when the current
// user has no saved preference yet for this instance — that's an expected,
// valid first-visit state, not a failure.
//
// view_configs' own RLS (view_configs_select_own) already restricts every
// row to its owning user regardless of org/assignment, so this can never
// leak another user's preferences. The gate below closes a narrower gap:
// without it, a caller whose assignment was later revoked could still read
// their own stale saved preference for a plan they can no longer otherwise
// see — same assignment-level model as getInstanceDetail/listDependencies,
// applied here for consistency rather than to prevent cross-user leakage.
export async function getViewConfig(
  instanceId: string,
): Promise<PlannerQueryResult<PlannerViewConfig | null>> {
  const context = await authenticatedPlannerClient();
  if (!context.ok) return context;

  const permissionsResult = await resolveReadPermissions(
    instanceId,
    context.data.base,
    "Plan view preferences could not be loaded.",
  );
  if (!permissionsResult.ok) return permissionsResult;
  if (!permissionsResult.data.canRead) {
    return failure("INVALID_INPUT", "This plan could not be found.");
  }

  const { data, error } = await context.data.client
    .from("view_configs")
    .select(VIEW_CONFIG_COLUMNS)
    .eq("instance_id", instanceId)
    .eq("user_id", context.data.userId)
    .maybeSingle();

  if (error) {
    return failure("QUERY_FAILED", "Plan view preferences could not be loaded.");
  }

  return { ok: true, data: data ? toViewConfig(data) : null };
}

type AssignmentRow = Database["planner"]["Tables"]["assignments"]["Row"];

function toAssignment(row: AssignmentRow): PlannerAssignment {
  return {
    id: row.id,
    instanceId: row.instance_id,
    userId: row.user_id,
    role: row.role as PlannerAssignment["role"],
    permissions: row.permissions as Record<string, unknown> | null,
  };
}

// IPI-575 — the live assignments_select_org RLS policy requires manager+ to
// SELECT any row on planner.assignments, including the caller's own (the same
// bulk-vs-own-row gap IPI-536 hit for permissions.ts) — so a contributor/
// viewer calling this legitimately gets an empty list, not an error.
//
// IPI-577 — display name comes from public.planner_get_member_names, a
// SECURITY DEFINER RPC (migration 20260714110000): public.profiles' own RLS
// is self-row-only (auth.uid() = id), so a plain join can't resolve
// teammates' names. A failed name lookup degrades to displayName: null
// rather than failing the whole member list — the table can still render
// role/access with a placeholder name.
export async function listMembers(
  instanceId: string,
): Promise<PlannerQueryResult<PlannerMember[]>> {
  const context = await authenticatedPlannerClient();
  if (!context.ok) return context;

  const { data, error } = await context.data.client
    .from("assignments")
    .select("*")
    .eq("instance_id", instanceId)
    .order("created_at", { ascending: true });

  if (error) {
    return failure("QUERY_FAILED", "Planner members could not be loaded.");
  }

  const { data: names } = await context.data.base.rpc("planner_get_member_names", {
    p_instance_id: instanceId,
  });
  const nameByUserId = new Map((names ?? []).map((n) => [n.user_id, n.display_name]));

  return {
    ok: true,
    data: (data ?? []).map((row) => ({
      ...toAssignment(row),
      displayName: nameByUserId.get(row.user_id) ?? null,
    })),
  };
}
