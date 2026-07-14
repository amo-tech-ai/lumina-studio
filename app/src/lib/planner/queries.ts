import type { PostgrestClient } from "@supabase/postgrest-js";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Database } from "@/types/supabase";

import type { EntityType, PlannerInstanceStatus, PlannerTaskStatus } from "./types";

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

const DASHBOARD_INSTANCE_STATUSES: PlannerInstanceStatus[] = [
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
  PlannerQueryResult<{ client: PlannerClient; userId: string }>
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

  if (options.status) {
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
