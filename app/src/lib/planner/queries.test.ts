import { beforeEach, describe, expect, it, vi } from "vitest";

import { createSupabaseServerClient } from "@/lib/supabase/server";

import {
  calculatePlannerProgress,
  derivePlannerDashboardSummary,
  getInstanceDetail,
  getPlannerDashboardSummary,
  getViewConfig,
  isPlannerInstanceAtRisk,
  listDependencies,
  listMembers,
  listPlannerInstances,
  listWorkflowPhases,
} from "./queries";

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: vi.fn(),
}));

type QueryResponse = { data: unknown; error: unknown };

function makeQuery(response: QueryResponse) {
  const query: Record<string, ReturnType<typeof vi.fn>> & {
    then?: (resolve: (value: QueryResponse) => unknown, reject?: (reason: unknown) => unknown) => unknown;
  } = {};
  for (const method of ["select", "in", "eq", "neq", "filter", "or", "order", "limit"]) {
    query[method] = vi.fn(() => query);
  }
  query.maybeSingle = vi.fn(() => Promise.resolve(response));
  query.then = (resolve, reject) => Promise.resolve(response).then(resolve, reject);
  return query;
}

type AssignmentRpcRow = {
  id: string;
  instance_id: string;
  user_id: string;
  role: string;
  permissions: unknown;
};

// Default assignment grants the caller "owner" on instance "i1" — the id
// every getInstanceDetail/listDependencies test below uses — so existing
// tests (which predate the permission gate) keep passing without needing to
// know about it. Tests that specifically exercise the gate pass
// `assignment: null` to simulate an org member with no assignment row.
const DEFAULT_ASSIGNMENT: AssignmentRpcRow = {
  id: "assign-default",
  instance_id: "i1",
  user_id: "user-a",
  role: "owner",
  permissions: null,
};

function mockClient(
  query: ReturnType<typeof makeQuery>,
  userId = "user-a",
  names: { user_id: string; display_name: string | null }[] = [],
  assignment: AssignmentRpcRow | null = DEFAULT_ASSIGNMENT,
  assignmentError: unknown = null,
) {
  const from = vi.fn(() => query);
  const schema = vi.fn(() => ({ from }));
  const getUser = vi.fn().mockResolvedValue({
    data: { user: { id: userId } },
    error: null,
  });
  const rpc = vi.fn((fnName: string) => {
    if (fnName === "planner_get_member_names") {
      return Promise.resolve({ data: names, error: null });
    }
    if (fnName === "planner_get_my_assignment") {
      if (assignmentError) return Promise.resolve({ data: null, error: assignmentError });
      return Promise.resolve({ data: assignment ? [assignment] : [], error: null });
    }
    return Promise.resolve({ data: null, error: null });
  });
  vi.mocked(createSupabaseServerClient).mockResolvedValue({
    auth: { getUser },
    schema,
    rpc,
  } as never);
  return { from, schema, getUser, rpc };
}

function instance(overrides: Record<string, unknown> = {}) {
  return {
    id: "00000000-0000-4000-8000-000000000001",
    org_id: "00000000-0000-4000-8000-000000000010",
    workflow_id: "00000000-0000-4000-8000-000000000020",
    entity_type: "shoot",
    entity_id: "00000000-0000-4000-8000-000000000030",
    name: "Summer campaign",
    status: "active",
    planned_start: "2026-07-01",
    planned_end: "2026-07-20",
    owner_user_id: "user-a",
    created_at: "2026-07-10T12:00:00.000Z",
    updated_at: "2026-07-11T12:00:00.000Z",
    tasks: [],
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.useRealTimers();
});

describe("Planner metric formulas", () => {
  it("returns null progress for zero eligible tasks and ignores cancelled tasks", () => {
    expect(calculatePlannerProgress([])).toBeNull();
    expect(calculatePlannerProgress([{ status: "cancelled" }])).toBeNull();
    expect(
      calculatePlannerProgress([
        { status: "done" },
        { status: "todo" },
        { status: "cancelled" },
      ]),
    ).toBe(50);
  });

  it("marks only schedule-eligible plans at risk from overdue or overrun dates", () => {
    expect(
      isPlannerInstanceAtRisk(
        {
          status: "active",
          planned_end: "2026-07-20",
          tasks: [{ status: "todo", end_date: "2026-07-12" }],
        },
        "2026-07-13",
      ),
    ).toBe(true);
    expect(
      isPlannerInstanceAtRisk(
        {
          status: "planned",
          planned_end: "2026-07-20",
          tasks: [{ status: "done", end_date: "2026-07-21" }],
        },
        "2026-07-13",
      ),
    ).toBe(true);
    expect(
      isPlannerInstanceAtRisk(
        {
          status: "completed",
          planned_end: "2026-07-20",
          tasks: [{ status: "todo", end_date: "2026-07-12" }],
        },
        "2026-07-13",
      ),
    ).toBe(false);
    expect(
      isPlannerInstanceAtRisk(
        {
          status: "active",
          planned_end: "2026-07-20",
          tasks: [{ status: "cancelled", end_date: "2026-07-30" }],
        },
        "2026-07-13",
      ),
    ).toBe(false);
  });

  it("does not fabricate risk for blocked plans without schedule evidence", () => {
    expect(
      isPlannerInstanceAtRisk(
        {
          status: "blocked",
          planned_end: null,
          tasks: [],
        },
        "2026-07-13",
      ),
    ).toBe(false);
  });

  it("uses all visible tasks for portfolio metrics and user scope only for My tasks", () => {
    const result = derivePlannerDashboardSummary(
      [
        {
          id: "plan-a",
          status: "active",
          planned_end: "2026-07-20",
          tasks: [
            { id: "a", status: "done", end_date: "2026-07-10", assignee_user_id: "user-b" },
            { id: "b", status: "todo", end_date: "2026-07-13", assignee_user_id: "user-a" },
            { id: "c", status: "cancelled", end_date: "2026-07-13", assignee_user_id: "user-a" },
          ],
        },
        {
          id: "plan-b",
          status: "planned",
          planned_end: "2026-07-25",
          tasks: [
            { id: "d", status: "blocked", end_date: "2026-07-12", assignee_user_id: "user-b" },
          ],
        },
      ],
      "user-a",
      "2026-07-13",
    );

    expect(result).toEqual({
      progress: 33,
      atRisk: 1,
      dueToday: 1,
      needsApproval: {
        available: false,
        count: null,
        reason: "workflow_approval_unavailable",
      },
      myTasks: 1,
    });
  });
});

describe("getPlannerDashboardSummary", () => {
  it("resolves identity server-side and performs one Planner data read", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-13T23:59:59.999Z"));
    const query = makeQuery({
      data: [
        {
          id: "plan-a",
          status: "active",
          planned_end: "2026-07-20",
          tasks: [
            { id: "task-a", status: "todo", end_date: "2026-07-13", assignee_user_id: "user-a" },
          ],
        },
      ],
      error: null,
    });
    const client = mockClient(query);

    const result = await getPlannerDashboardSummary();

    expect(result.ok && result.data.dueToday).toBe(1);
    expect(client.getUser).toHaveBeenCalledTimes(1);
    expect(client.from).toHaveBeenCalledTimes(1);
    expect(client.from).toHaveBeenCalledWith("instances");
    expect(query.in).toHaveBeenCalledWith("status", [
      "draft",
      "planned",
      "active",
      "blocked",
      "completed",
    ]);
  });

  it("keeps the Planner query count constant as the visible plan count grows", async () => {
    const runDashboard = async (planCount: number) => {
      const query = makeQuery({
        data: Array.from({ length: planCount }, (_, index) => ({
          id: `plan-${index}`,
          status: "active",
          planned_end: "2026-07-20",
          tasks: [
            {
              id: `task-${index}`,
              status: index % 2 === 0 ? "done" : "todo",
              end_date: "2026-07-20",
              assignee_user_id: "user-a",
            },
          ],
        })),
        error: null,
      });
      const client = mockClient(query);

      const result = await getPlannerDashboardSummary();

      expect(result.ok).toBe(true);
      return { client, query };
    };

    const onePlan = await runDashboard(1);
    const manyPlans = await runDashboard(50);

    for (const execution of [onePlan, manyPlans]) {
      expect(execution.client.getUser).toHaveBeenCalledTimes(1);
      expect(execution.client.from).toHaveBeenCalledTimes(1);
      expect(execution.query.select).toHaveBeenCalledTimes(1);
      expect(execution.query.in).toHaveBeenCalledTimes(1);
    }
  });

  it("returns a typed unauthenticated failure before querying Planner", async () => {
    const query = makeQuery({ data: [], error: null });
    const client = mockClient(query);
    client.getUser.mockResolvedValue({ data: { user: null }, error: null });

    await expect(getPlannerDashboardSummary()).resolves.toEqual({
      ok: false,
      error: { code: "UNAUTHENTICATED", message: "Sign in to view Planner data." },
    });
    expect(client.from).not.toHaveBeenCalled();
  });

  it("does not leak database errors", async () => {
    const query = makeQuery({ data: null, error: { message: "sensitive postgres detail" } });
    mockClient(query);

    await expect(getPlannerDashboardSummary()).resolves.toEqual({
      ok: false,
      error: { code: "QUERY_FAILED", message: "Planner dashboard data could not be loaded." },
    });
  });
});

describe("listPlannerInstances", () => {
  it("uses stable limit+1 pagination and returns a cursor from the last visible row", async () => {
    const preciseCreatedAt = "2026-07-10T12:00:00.123456+00:00";
    const rows = [
      instance({ created_at: preciseCreatedAt }),
      instance({
        id: "00000000-0000-4000-8000-000000000002",
        created_at: preciseCreatedAt,
      }),
      instance({
        id: "00000000-0000-4000-8000-000000000003",
        created_at: "2026-07-09T12:00:00.000Z",
      }),
    ];
    const query = makeQuery({ data: rows, error: null });
    mockClient(query);

    const first = await listPlannerInstances({ limit: 2 });

    expect(query.neq).toHaveBeenCalledWith("status", "archived");
    expect(query.order).toHaveBeenNthCalledWith(1, "created_at", { ascending: false });
    expect(query.order).toHaveBeenNthCalledWith(2, "id", { ascending: false });
    expect(query.limit).toHaveBeenCalledWith(3);
    expect(first.ok && first.data.items).toHaveLength(2);
    expect(first.ok && first.data.nextCursor).not.toBeNull();

    const secondQuery = makeQuery({ data: [], error: null });
    mockClient(secondQuery);
    if (!first.ok || !first.data.nextCursor) throw new Error("expected next cursor");
    await listPlannerInstances({ limit: 2, cursor: first.data.nextCursor });
    expect(secondQuery.or).toHaveBeenCalledWith(
      `created_at.lt.${preciseCreatedAt},and(created_at.eq.${preciseCreatedAt},id.lt.00000000-0000-4000-8000-000000000002)`,
    );
  });

  it("applies schema-backed filters and treats every search character literally", async () => {
    const query = makeQuery({ data: [], error: null });
    mockClient(query);

    await listPlannerInstances({
      entityType: "crm_deal",
      status: "archived",
      search: "  50%_launch\\*  ",
      includeArchived: false,
    });

    expect(query.eq).toHaveBeenCalledWith("status", "archived");
    expect(query.eq).toHaveBeenCalledWith("entity_type", "crm_deal");
    expect(query.neq).not.toHaveBeenCalled();
    expect(query.filter).toHaveBeenCalledWith(
      "name",
      "imatch",
      String.raw`.*50%_launch\\\*.*`,
    );
  });

  it("filters by an explicit status list instead of the single-status/archived default", async () => {
    const query = makeQuery({ data: [], error: null });
    mockClient(query);

    await listPlannerInstances({
      statuses: ["draft", "planned", "active", "blocked", "completed"],
    });

    expect(query.in).toHaveBeenCalledWith("status", [
      "draft",
      "planned",
      "active",
      "blocked",
      "completed",
    ]);
    expect(query.eq).not.toHaveBeenCalledWith("status", expect.anything());
    expect(query.neq).not.toHaveBeenCalled();
  });

  it("rejects invalid limits, search, and cursors before authentication", async () => {
    const query = makeQuery({ data: [], error: null });
    const client = mockClient(query);

    for (const input of [
      { limit: 0 },
      { limit: 51 },
      { limit: 1.5 },
      { search: "x".repeat(101) },
      { cursor: "not-a-valid-cursor" },
      {
        cursor: Buffer.from(
          JSON.stringify({
            createdAt: "July 10, 2026 12:00:00 GMT",
            id: "00000000-0000-4000-8000-000000000001",
          }),
          "utf8",
        ).toString("base64url"),
      },
    ]) {
      const result = await listPlannerInstances(input);
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.error.code).toBe("INVALID_INPUT");
    }
    expect(client.getUser).not.toHaveBeenCalled();
    expect(client.from).not.toHaveBeenCalled();
  });

  it("derives honest per-plan metrics and tolerates missing task/link data", async () => {
    const query = makeQuery({
      data: [
        instance({ tasks: null }),
        instance({
          id: "00000000-0000-4000-8000-000000000002",
          planned_end: "2026-07-20",
          tasks: [
            { id: "done", status: "done", end_date: "2026-07-15" },
            { id: "late", status: "todo", end_date: "2026-07-21" },
            { id: "cancelled", status: "cancelled", end_date: "2026-07-30" },
          ],
        }),
      ],
      error: null,
    });
    mockClient(query);

    const result = await listPlannerInstances();

    expect(result.ok && result.data.items[0].progress).toBeNull();
    expect(result.ok && result.data.items[1]).toMatchObject({ progress: 50, atRisk: true });
  });

  it("returns a typed query failure and performs no per-card calls", async () => {
    const query = makeQuery({ data: null, error: { message: "private database error" } });
    const client = mockClient(query);

    await expect(listPlannerInstances()).resolves.toEqual({
      ok: false,
      error: { code: "QUERY_FAILED", message: "Planner instances could not be loaded." },
    });
    expect(client.from).toHaveBeenCalledTimes(1);
  });
});

describe("listMembers", () => {
  it("maps assignment rows to PlannerMember, merging display names from planner_get_member_names", async () => {
    const query = makeQuery({
      data: [
        {
          id: "a1",
          instance_id: "i1",
          user_id: "u1",
          role: "owner",
          permissions: null,
        },
      ],
      error: null,
    });
    const client = mockClient(query, "user-a", [{ user_id: "u1", display_name: "Maya" }]);

    const result = await listMembers("i1");

    expect(result).toEqual({
      ok: true,
      data: [{ id: "a1", instanceId: "i1", userId: "u1", role: "owner", permissions: null, displayName: "Maya" }],
    });
    expect(client.from).toHaveBeenCalledWith("assignments");
    expect(query.eq).toHaveBeenCalledWith("instance_id", "i1");
    expect(client.rpc).toHaveBeenCalledWith("planner_get_member_names", { p_instance_id: "i1" });
  });

  it("degrades to displayName: null when a member has no matching name row, rather than failing the list", async () => {
    const query = makeQuery({
      data: [{ id: "a1", instance_id: "i1", user_id: "u1", role: "viewer", permissions: null }],
      error: null,
    });
    mockClient(query, "user-a", []);

    const result = await listMembers("i1");

    expect(result).toEqual({
      ok: true,
      data: [{ id: "a1", instanceId: "i1", userId: "u1", role: "viewer", permissions: null, displayName: null }],
    });
  });

  it("returns an empty list, not an error, for a contributor/viewer caller (RLS is manager+ only)", async () => {
    const query = makeQuery({ data: [], error: null });
    mockClient(query);

    const result = await listMembers("i1");

    expect(result).toEqual({ ok: true, data: [] });
  });

  it("returns a typed query failure without leaking the raw error", async () => {
    const query = makeQuery({ data: null, error: { message: "private database error" } });
    mockClient(query);

    await expect(listMembers("i1")).resolves.toEqual({
      ok: false,
      error: { code: "QUERY_FAILED", message: "Planner members could not be loaded." },
    });
  });
});

function taskRow(overrides: Record<string, unknown> = {}) {
  return {
    id: "t1",
    instance_id: "i1",
    phase_id: "p1",
    parent_task_id: null,
    title: "Casting",
    description: null,
    start_date: "2026-07-01",
    end_date: "2026-07-03",
    duration_days: 2,
    status: "todo",
    priority: "medium",
    assignee_user_id: null,
    assignee_role: null,
    sort_order: 0,
    created_at: "2026-07-01T00:00:00.000Z",
    updated_at: "2026-07-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("getInstanceDetail", () => {
  it("maps the instance row plus its tasks to PlannerInstance", async () => {
    const query = makeQuery({
      data: { ...instance(), tasks: [taskRow()] },
      error: null,
    });
    const client = mockClient(query);

    const result = await getInstanceDetail("i1");

    expect(result).toEqual({
      ok: true,
      data: {
        id: "00000000-0000-4000-8000-000000000001",
        orgId: "00000000-0000-4000-8000-000000000010",
        workflowId: "00000000-0000-4000-8000-000000000020",
        entityType: "shoot",
        entityId: "00000000-0000-4000-8000-000000000030",
        name: "Summer campaign",
        status: "active",
        plannedStart: "2026-07-01",
        plannedEnd: "2026-07-20",
        ownerUserId: "user-a",
        tasks: [
          {
            id: "t1",
            instanceId: "i1",
            phaseId: "p1",
            parentTaskId: null,
            title: "Casting",
            description: null,
            startDate: "2026-07-01",
            endDate: "2026-07-03",
            durationDays: 2,
            status: "todo",
            priority: "medium",
            assigneeUserId: null,
            assigneeRole: null,
            sortOrder: 0,
          },
        ],
      },
    });
    expect(client.from).toHaveBeenCalledWith("instances");
    expect(query.eq).toHaveBeenCalledWith("id", "i1");
    expect(client.rpc).toHaveBeenCalledWith("planner_get_my_assignment", {
      p_instance_id: "i1",
    });
    // Explicit column list, not select("*") — a future column added to
    // instances/tasks must not be forwarded to the frontend without an
    // explicit decision to include it here.
    const selectedColumns = query.select.mock.calls[0][0];
    expect(selectedColumns).not.toContain("*");
    expect(selectedColumns).toContain("owner_user_id");
    expect(selectedColumns).toContain("tasks(");
  });

  it("sorts tasks by sortOrder rather than trusting PostgREST's embed order", async () => {
    // PostgREST doesn't guarantee embedded-resource row order — deliberately
    // return tasks out of order here to prove the mapping sorts them, not
    // just passes through whatever order the query happened to return.
    const query = makeQuery({
      data: {
        ...instance(),
        tasks: [
          taskRow({ id: "t3", title: "Wrap", sort_order: 2 }),
          taskRow({ id: "t1", title: "Casting", sort_order: 0 }),
          taskRow({ id: "t2", title: "Shoot", sort_order: 1 }),
        ],
      },
      error: null,
    });
    mockClient(query);

    const result = await getInstanceDetail("i1");

    expect(result.ok && result.data.tasks.map((t) => t.id)).toEqual(["t1", "t2", "t3"]);
  });

  it("does not distinguish an RLS-filtered instance from a nonexistent one", async () => {
    const query = makeQuery({ data: null, error: null });
    mockClient(query);

    await expect(getInstanceDetail("i1")).resolves.toEqual({
      ok: false,
      error: { code: "INVALID_INPUT", message: "This plan could not be found." },
    });
  });

  it("returns a typed query failure without leaking the raw error", async () => {
    const query = makeQuery({ data: null, error: { message: "private database error" } });
    mockClient(query);

    await expect(getInstanceDetail("i1")).resolves.toEqual({
      ok: false,
      error: { code: "QUERY_FAILED", message: "This plan could not be loaded." },
    });
  });

  it("denies an org member with no assignment on this instance — instances_select_org/tasks_select_org are org-scoped, not assignment-scoped", async () => {
    const query = makeQuery({ data: { ...instance(), tasks: [] }, error: null });
    const client = mockClient(query, "user-a", [], null);

    await expect(getInstanceDetail("i1")).resolves.toEqual({
      ok: false,
      error: { code: "INVALID_INPUT", message: "This plan could not be found." },
    });
    // Fails closed before querying — an unassigned org member never reaches
    // a query that RLS would have let through anyway.
    expect(client.from).not.toHaveBeenCalled();
  });

  it("returns a typed query failure instead of throwing when the assignment RPC errors", async () => {
    const query = makeQuery({ data: { ...instance(), tasks: [] }, error: null });
    const client = mockClient(query, "user-a", [], DEFAULT_ASSIGNMENT, { message: "rpc unavailable" });

    await expect(getInstanceDetail("i1")).resolves.toEqual({
      ok: false,
      error: { code: "QUERY_FAILED", message: "This plan could not be loaded." },
    });
    expect(client.from).not.toHaveBeenCalled();
  });
});

describe("listDependencies", () => {
  it("maps dependency rows to PlannerDependency", async () => {
    const query = makeQuery({
      data: [
        {
          id: "d1",
          instance_id: "i1",
          from_task_id: "t1",
          to_task_id: "t2",
          dep_type: "finish_to_start",
          lag_days: 0,
        },
      ],
      error: null,
    });
    const client = mockClient(query);

    const result = await listDependencies("i1");

    expect(result).toEqual({
      ok: true,
      data: [
        { id: "d1", instanceId: "i1", fromTaskId: "t1", toTaskId: "t2", depType: "finish_to_start", lagDays: 0 },
      ],
    });
    expect(client.from).toHaveBeenCalledWith("dependencies");
    expect(query.eq).toHaveBeenCalledWith("instance_id", "i1");
    expect(query.select.mock.calls[0][0]).not.toContain("*");
  });

  it("returns a typed query failure without leaking the raw error", async () => {
    const query = makeQuery({ data: null, error: { message: "private database error" } });
    mockClient(query);

    await expect(listDependencies("i1")).resolves.toEqual({
      ok: false,
      error: { code: "QUERY_FAILED", message: "Plan dependencies could not be loaded." },
    });
  });

  it("denies an org member with no assignment on this instance — dependencies_select_org is org-scoped, not assignment-scoped", async () => {
    const query = makeQuery({ data: [], error: null });
    const client = mockClient(query, "user-a", [], null);

    await expect(listDependencies("i1")).resolves.toEqual({
      ok: false,
      error: { code: "INVALID_INPUT", message: "This plan could not be found." },
    });
    expect(client.from).not.toHaveBeenCalled();
  });

  it("returns a typed query failure instead of throwing when the assignment RPC errors", async () => {
    const query = makeQuery({ data: [], error: null });
    const client = mockClient(query, "user-a", [], DEFAULT_ASSIGNMENT, { message: "rpc unavailable" });

    await expect(listDependencies("i1")).resolves.toEqual({
      ok: false,
      error: { code: "QUERY_FAILED", message: "Plan dependencies could not be loaded." },
    });
    expect(client.from).not.toHaveBeenCalled();
  });
});

describe("listWorkflowPhases", () => {
  it("maps phase rows to PlannerPhase, ordered by order_index", async () => {
    const query = makeQuery({
      data: [
        {
          id: "p1",
          workflow_id: "wf-1",
          slug: "brief",
          name: "Brief",
          order_index: 0,
          default_duration_days: 2,
          gate_type: null,
          required_role: null,
        },
      ],
      error: null,
    });
    const client = mockClient(query);

    const result = await listWorkflowPhases("wf-1");

    expect(result).toEqual({
      ok: true,
      data: [
        {
          id: "p1",
          workflowId: "wf-1",
          slug: "brief",
          name: "Brief",
          orderIndex: 0,
          defaultDurationDays: 2,
          gateType: null,
          requiredRole: null,
        },
      ],
    });
    expect(client.from).toHaveBeenCalledWith("phases");
    expect(query.eq).toHaveBeenCalledWith("workflow_id", "wf-1");
    expect(query.order).toHaveBeenCalledWith("order_index", { ascending: true });
    expect(query.select.mock.calls[0][0]).not.toContain("*");
  });

  it("returns a typed query failure without leaking the raw error", async () => {
    const query = makeQuery({ data: null, error: { message: "private database error" } });
    mockClient(query);

    await expect(listWorkflowPhases("wf-1")).resolves.toEqual({
      ok: false,
      error: { code: "QUERY_FAILED", message: "Workflow phases could not be loaded." },
    });
  });

  it("relies on phases_select RLS alone — no assignment RPC call, unlike listDependencies", async () => {
    const query = makeQuery({ data: [], error: null });
    const client = mockClient(query, "user-a", [], null);

    const result = await listWorkflowPhases("wf-1");

    expect(result).toEqual({ ok: true, data: [] });
    expect(client.rpc).not.toHaveBeenCalledWith("planner_get_my_assignment", expect.anything());
    expect(client.from).toHaveBeenCalledWith("phases");
  });

  it("rejects an unauthenticated caller before querying", async () => {
    const query = makeQuery({ data: [], error: null });
    const client = mockClient(query);
    client.getUser.mockResolvedValue({ data: { user: null }, error: null });

    await expect(listWorkflowPhases("wf-1")).resolves.toEqual({
      ok: false,
      error: { code: "UNAUTHENTICATED", message: "Sign in to view Planner data." },
    });
    expect(client.from).not.toHaveBeenCalled();
  });
});

describe("getViewConfig", () => {
  it("resolves identity from the session — never accepts a caller-supplied userId", async () => {
    const query = makeQuery({
      data: {
        id: "v1",
        user_id: "user-a",
        instance_id: "i1",
        default_view: "timeline",
        filters: {},
        sort_config: {},
      },
      error: null,
    });
    const client = mockClient(query, "user-a");

    const result = await getViewConfig("i1");

    expect(result).toEqual({
      ok: true,
      data: {
        id: "v1",
        userId: "user-a",
        instanceId: "i1",
        defaultView: "timeline",
        filters: {},
        sortConfig: {},
      },
    });
    expect(client.from).toHaveBeenCalledWith("view_configs");
    expect(query.eq).toHaveBeenCalledWith("instance_id", "i1");
    expect(query.eq).toHaveBeenCalledWith("user_id", "user-a");
    expect(query.select.mock.calls[0][0]).not.toContain("*");
  });

  it("returns null, not an error, when the current user has no saved preference yet", async () => {
    const query = makeQuery({ data: null, error: null });
    mockClient(query, "user-a");

    await expect(getViewConfig("i1")).resolves.toEqual({ ok: true, data: null });
  });

  it("returns a typed query failure without leaking the raw error", async () => {
    const query = makeQuery({ data: null, error: { message: "private database error" } });
    mockClient(query);

    await expect(getViewConfig("i1")).resolves.toEqual({
      ok: false,
      error: { code: "QUERY_FAILED", message: "Plan view preferences could not be loaded." },
    });
  });

  it("returns a typed query failure, not a thrown error, when maybeSingle() finds duplicate rows", async () => {
    // Realistic PostgREST shape for "multiple (or no) rows were found" from
    // .maybeSingle() — the generic error branch above already handles this,
    // this locks in that a real duplicate-row failure specifically routes
    // through it rather than being special-cased or silently swallowed.
    const query = makeQuery({
      data: null,
      error: { code: "PGRST116", message: "JSON object requested, multiple (or no) rows returned" },
    });
    mockClient(query);

    await expect(getViewConfig("i1")).resolves.toEqual({
      ok: false,
      error: { code: "QUERY_FAILED", message: "Plan view preferences could not be loaded." },
    });
  });

  it("normalizes non-object filters/sort_config to {} instead of trusting the jsonb cast", async () => {
    // jsonb columns can hold any valid JSON value, not just objects — a
    // legacy or malformed row could have filters/sort_config as an array,
    // string, number, or JSON null even though the column is NOT NULL.
    const query = makeQuery({
      data: {
        id: "v1",
        user_id: "user-a",
        instance_id: "i1",
        default_view: "timeline",
        filters: ["not", "an", "object"],
        sort_config: null,
      },
      error: null,
    });
    mockClient(query, "user-a");

    const result = await getViewConfig("i1");

    expect(result.ok && result.data?.filters).toEqual({});
    expect(result.ok && result.data?.sortConfig).toEqual({});
  });

  it("denies an org member with no assignment on this instance, even for their own saved preference", async () => {
    const query = makeQuery({
      data: {
        id: "v1",
        user_id: "user-a",
        instance_id: "i1",
        default_view: "timeline",
        filters: {},
        sort_config: {},
      },
      error: null,
    });
    const client = mockClient(query, "user-a", [], null);

    await expect(getViewConfig("i1")).resolves.toEqual({
      ok: false,
      error: { code: "INVALID_INPUT", message: "This plan could not be found." },
    });
    // Fails closed before querying — a revoked assignment can't still read
    // back a stale saved preference for a plan it no longer has access to.
    expect(client.from).not.toHaveBeenCalled();
  });

  it("returns a typed query failure instead of throwing when the assignment RPC errors", async () => {
    const query = makeQuery({ data: null, error: null });
    const client = mockClient(query, "user-a", [], DEFAULT_ASSIGNMENT, { message: "rpc unavailable" });

    await expect(getViewConfig("i1")).resolves.toEqual({
      ok: false,
      error: { code: "QUERY_FAILED", message: "Plan view preferences could not be loaded." },
    });
    expect(client.from).not.toHaveBeenCalled();
  });
});
