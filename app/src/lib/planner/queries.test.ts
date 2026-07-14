import { beforeEach, describe, expect, it, vi } from "vitest";

import { createSupabaseServerClient } from "@/lib/supabase/server";

import {
  calculatePlannerProgress,
  derivePlannerDashboardSummary,
  getPlannerDashboardSummary,
  isPlannerInstanceAtRisk,
  listPlannerInstances,
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
  query.then = (resolve, reject) => Promise.resolve(response).then(resolve, reject);
  return query;
}

function mockClient(query: ReturnType<typeof makeQuery>, userId = "user-a") {
  const from = vi.fn(() => query);
  const schema = vi.fn(() => ({ from }));
  const getUser = vi.fn().mockResolvedValue({
    data: { user: { id: userId } },
    error: null,
  });
  vi.mocked(createSupabaseServerClient).mockResolvedValue({
    auth: { getUser },
    schema,
  } as never);
  return { from, schema, getUser };
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
