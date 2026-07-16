import { beforeEach, describe, expect, it, vi } from "vitest";

import { getEffectivePermissions } from "./permissions";
import { getInstanceDetail, listDependencies } from "./queries";

vi.mock("./queries", () => ({
  getInstanceDetail: vi.fn(),
  listDependencies: vi.fn(),
}));

vi.mock("./permissions", () => ({
  getEffectivePermissions: vi.fn(),
}));

import { inviteMember, removeAssignment, setViewConfig, shiftTask, updateRole, updateTask } from "./mutations";

function mockRpc(row: Record<string, unknown> | null, error: { message: string } | null = null) {
  const builder = { single: vi.fn(async () => ({ data: row, error })) };
  return { rpc: vi.fn(() => builder), _builder: builder } as never;
}

const ROW = { id: "a1", instance_id: "i1", user_id: "u1", role: "contributor" };

describe("inviteMember", () => {
  it("maps a successful invite to MutationResult ok:true", async () => {
    const sb = mockRpc(ROW);
    const result = await inviteMember({ instanceId: "i1", email: "new@example.com", role: "contributor" }, sb as never);
    expect(result).toEqual({
      ok: true,
      data: { id: "a1", instanceId: "i1", userId: "u1", role: "contributor" },
    });
    expect((sb as unknown as { rpc: ReturnType<typeof vi.fn> }).rpc).toHaveBeenCalledWith(
      "planner_invite_member",
      { p_instance_id: "i1", p_email: "new@example.com", p_role: "contributor" },
    );
  });

  it("maps user_not_available for an unknown email", async () => {
    const sb = mockRpc(null, { message: "planner_invite_member: user_not_available" });
    const result = await inviteMember({ instanceId: "i1", email: "nobody@example.com", role: "viewer" }, sb as never);
    expect(result).toEqual({
      ok: false,
      error: { code: "user_not_available", message: "That person is not available to invite." },
    });
  });

  it("maps user_not_available for an email outside the org (same error — no enumeration)", async () => {
    const sbOut = mockRpc(null, { message: "planner_invite_member: user_not_available" });
    const outResult = await inviteMember({ instanceId: "i1", email: "outsider@example.com", role: "viewer" }, sbOut as never);
    expect(outResult.ok).toBe(false);
    if (!outResult.ok) expect(outResult.error.code).toBe("user_not_available");
  });

  it("maps pre-migration no_account_found/user_not_in_org to the same cloaked result (deploy-order safety net)", async () => {
    for (const legacyCode of ["no_account_found", "user_not_in_org"]) {
      const sb = mockRpc(null, { message: `planner_invite_member: ${legacyCode}` });
      const result = await inviteMember({ instanceId: "i1", email: "x@example.com", role: "viewer" }, sb as never);
      expect(result).toEqual({
        ok: false,
        error: { code: "user_not_available", message: "That person is not available to invite." },
      });
    }
  });

  it("maps invalid_role (e.g. inviting as owner)", async () => {
    const sb = mockRpc(null, { message: "planner_invite_member: invalid_role" });
    const result = await inviteMember({ instanceId: "i1", email: "x@example.com", role: "owner" as never }, sb as never);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("invalid_role");
  });

  it("maps already_member", async () => {
    const sb = mockRpc(null, { message: "planner_invite_member: already_member" });
    const result = await inviteMember({ instanceId: "i1", email: "dupe@example.com", role: "viewer" }, sb as never);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("already_member");
  });

  it("denies a manager inviting someone as manager (insufficient_role_for_target)", async () => {
    const sb = mockRpc(null, { message: "planner_invite_member: insufficient_role_for_target" });
    const result = await inviteMember({ instanceId: "i1", email: "newmgr@example.com", role: "manager" }, sb as never);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("insufficient_role_for_target");
  });

  it("never forwards a raw, unrecognized Postgres message", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    const sb = mockRpc(null, { message: "relation planner.assignments violates row-level security policy" });
    const result = await inviteMember({ instanceId: "i1", email: "x@example.com", role: "viewer" }, sb as never);
    expect(result).toEqual({
      ok: false,
      error: { code: "UNKNOWN_ERROR", message: "The request could not be completed." },
    });
    expect(consoleError).toHaveBeenCalled();
    consoleError.mockRestore();
  });

  it("maps a missing row (no error, no data) to UNKNOWN_ERROR", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    const sb = mockRpc(null, null);
    const result = await inviteMember({ instanceId: "i1", email: "x@example.com", role: "viewer" }, sb as never);
    expect(result.ok).toBe(false);
    consoleError.mockRestore();
  });
});

// NOTE: Atomic rollback of assignment + audit event is structurally guaranteed
// by PostgreSQL function transaction semantics (both statements execute in the
// same function body / single transaction). A true fault-injection test
// (force planner.events INSERT to fail, verify no assignment remains) requires
// a live DB harness — not a mocked RPC. This test only confirms the error
// mapping layer; it does NOT prove database-level rollback.
describe("error mapping", () => {
  it("maps known errors to typed codes without leaking raw Postgres message", async () => {
    const sb = mockRpc(null, { message: "planner_invite_member: already_member" });
    const result = await inviteMember({ instanceId: "i1", email: "dupe@example.com", role: "viewer" }, sb as never);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("already_member");
  });
});

describe("updateRole", () => {
  it("maps a successful role update", async () => {
    const sb = mockRpc({ ...ROW, role: "viewer" });
    const result = await updateRole({ instanceId: "i1", userId: "u1", role: "viewer" }, sb as never);
    expect(result).toEqual({
      ok: true,
      data: { id: "a1", instanceId: "i1", userId: "u1", role: "viewer" },
    });
  });

  it("distinguishes insufficient_role from insufficient_role_for_target", async () => {
    const sbNotManager = mockRpc(null, { message: "planner_update_role: insufficient_role" });
    const notManager = await updateRole({ instanceId: "i1", userId: "u1", role: "viewer" }, sbNotManager as never);
    expect(notManager.ok).toBe(false);
    if (!notManager.ok) expect(notManager.error.code).toBe("insufficient_role");

    const sbWrongTarget = mockRpc(null, { message: "planner_update_role: insufficient_role_for_target" });
    const wrongTarget = await updateRole({ instanceId: "i1", userId: "owner1", role: "contributor" }, sbWrongTarget as never);
    expect(wrongTarget.ok).toBe(false);
    if (!wrongTarget.ok) expect(wrongTarget.error.code).toBe("insufficient_role_for_target");
  });

  it("maps last_owner_protected", async () => {
    const sb = mockRpc(null, { message: "planner_update_role: last_owner_protected" });
    const result = await updateRole({ instanceId: "i1", userId: "owner1", role: "contributor" }, sb as never);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("last_owner_protected");
  });

  it("maps member_not_found", async () => {
    const sb = mockRpc(null, { message: "planner_update_role: member_not_found" });
    const result = await updateRole({ instanceId: "i1", userId: "ghost", role: "viewer" }, sb as never);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("member_not_found");
  });
});

describe("removeAssignment", () => {
  it("maps a successful removal", async () => {
    const sb = mockRpc(ROW);
    const result = await removeAssignment({ instanceId: "i1", userId: "u1" }, sb as never);
    expect(result).toEqual({
      ok: true,
      data: { id: "a1", instanceId: "i1", userId: "u1", role: "contributor" },
    });
    expect((sb as unknown as { rpc: ReturnType<typeof vi.fn> }).rpc).toHaveBeenCalledWith(
      "planner_remove_assignment",
      { p_instance_id: "i1", p_target_user_id: "u1" },
    );
  });

  it("maps last_owner_protected", async () => {
    const sb = mockRpc(null, { message: "planner_remove_assignment: last_owner_protected" });
    const result = await removeAssignment({ instanceId: "i1", userId: "owner1" }, sb as never);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("last_owner_protected");
  });

  it("maps insufficient_role_for_target distinctly from insufficient_role", async () => {
    const sb = mockRpc(null, { message: "planner_remove_assignment: insufficient_role_for_target" });
    const result = await removeAssignment({ instanceId: "i1", userId: "mgr1" }, sb as never);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("insufficient_role_for_target");
  });
});

// IPI-649 · PLN-DATA-001B-M — shiftTask/updateTask/setViewConfig. These 3
// mutations return jsonb `{ok, ...}` directly, not a `.single()`-wrapped
// table row, and shiftTask reads through queries.ts (mocked here) before
// ever touching the RPC — different shape from the member mutations above,
// so they get their own mock builders rather than reusing mockRpc.

const BASE_TASK = {
  id: "t1",
  instanceId: "i1",
  phaseId: null,
  parentTaskId: null,
  title: "Task A",
  description: null,
  startDate: "2026-07-01",
  endDate: "2026-07-03",
  durationDays: 2,
  status: "todo" as const,
  priority: "medium" as const,
  assigneeUserId: "u1",
  assigneeRole: null,
  sortOrder: 0,
};

function instanceDetailOk(tasks: typeof BASE_TASK[]) {
  return {
    ok: true as const,
    data: {
      id: "i1",
      orgId: "o1",
      workflowId: "w1",
      entityType: "shoot" as const,
      entityId: "e1",
      name: "Plan",
      status: "active" as const,
      plannedStart: "2026-07-01",
      plannedEnd: null,
      ownerUserId: "u1",
      tasks,
    },
  };
}

function mockShiftClient({
  freshRows,
  freshError = null as { message: string } | null,
  rpcData = null as unknown,
  rpcError = null as { message: string } | null,
}: {
  freshRows?: Array<{ id: string; updated_at: string; start_date?: string; end_date?: string }>;
  freshError?: { message: string } | null;
  rpcData?: unknown;
  rpcError?: { message: string } | null;
} = {}) {
  // When a test doesn't care about freshness specifics, synthesize a fresh
  // row for every requested id from BASE_TASK's own dates — every task in
  // taskMap must have a matching fresh row or shiftTask() now aborts with
  // NOT_FOUND (see mutations.ts's post-getInstanceDetail re-fetch guard).
  const inMock = vi.fn(async (_column: string, ids: string[]) => {
    if (freshRows) return { data: freshRows, error: freshError };
    return {
      data: ids.map((id) => ({
        id,
        start_date: BASE_TASK.startDate,
        end_date: BASE_TASK.endDate,
        updated_at: "2026-07-10T00:00:00.000Z",
      })),
      error: freshError,
    };
  });
  const selectMock = vi.fn(() => ({ in: inMock }));
  const fromMock = vi.fn(() => ({ select: selectMock }));
  const schemaMock = vi.fn(() => ({ from: fromMock }));
  const rpcMock = vi.fn(async () => ({ data: rpcData, error: rpcError }));
  return { client: { schema: schemaMock, rpc: rpcMock } as never, rpcMock };
}

function mockRpcJson(data: unknown, error: { message: string } | null = null) {
  const rpcMock = vi.fn(async () => ({ data, error }));
  return { client: { rpc: rpcMock } as never, rpcMock };
}

function mockViewConfigClient({ userId = "u1" as string | null, upsertError = null as { message: string } | null } = {}) {
  const upsertMock = vi.fn(async () => ({ error: upsertError }));
  const fromMock = vi.fn(() => ({ upsert: upsertMock }));
  const schemaMock = vi.fn(() => ({ from: fromMock }));
  const getUser = vi.fn(async () => ({ data: { user: userId ? { id: userId } : null } }));
  return { client: { schema: schemaMock, auth: { getUser } } as never, upsertMock };
}

describe("shiftTask", () => {
  beforeEach(() => {
    vi.mocked(getInstanceDetail).mockReset();
    vi.mocked(listDependencies).mockReset();
  });

  it("diffs the engine's output, fetches fresh updated_at, and calls the RPC with the correct payload", async () => {
    vi.mocked(getInstanceDetail).mockResolvedValue(instanceDetailOk([BASE_TASK]));
    vi.mocked(listDependencies).mockResolvedValue({ ok: true, data: [] });

    const { client, rpcMock } = mockShiftClient({
      freshRows: [{ id: "t1", start_date: BASE_TASK.startDate, end_date: BASE_TASK.endDate, updated_at: "2026-07-10T00:00:00.000Z" }],
      rpcData: {
        ok: true,
        replayed: false,
        changedTasks: [{ taskId: "t1", updatedAt: "2026-07-10T00:01:00.000Z" }],
        conflicts: [],
      },
    });

    const result = await shiftTask(
      { instanceId: "i1", rootTaskId: "t1", deltaDays: 2, idempotencyKey: "idem-1" },
      client,
    );

    expect(result).toEqual({
      ok: true,
      data: { replayed: false, changedTasks: [{ taskId: "t1", updatedAt: "2026-07-10T00:01:00.000Z" }] },
    });

    expect(rpcMock).toHaveBeenCalledTimes(1);
    const [fnName, args] = rpcMock.mock.calls[0] as [string, Record<string, unknown>];
    expect(fnName).toBe("planner_shift_task");
    expect(args.p_instance_id).toBe("i1");
    expect(args.p_root_task_id).toBe("t1");
    expect(args.p_delta_days).toBe(2);
    expect(args.p_idempotency_key).toBe("idem-1");
    expect(args.p_changed_tasks).toEqual([
      {
        taskId: "t1",
        expectedUpdatedAt: "2026-07-10T00:00:00.000Z",
        newStartDate: expect.any(String),
        newEndDate: expect.any(String),
      },
    ]);
  });

  it("returns early without calling the RPC when the shift produces no date change", async () => {
    vi.mocked(getInstanceDetail).mockResolvedValue(instanceDetailOk([BASE_TASK]));
    vi.mocked(listDependencies).mockResolvedValue({ ok: true, data: [] });

    const { client, rpcMock } = mockShiftClient({});
    const result = await shiftTask(
      { instanceId: "i1", rootTaskId: "t1", deltaDays: 0, idempotencyKey: "idem-2" },
      client,
    );

    expect(result).toEqual({ ok: true, data: { replayed: false, changedTasks: [] } });
    expect(rpcMock).not.toHaveBeenCalled();
  });

  it("maps a dependency cycle conflict from the pure engine without calling the RPC", async () => {
    vi.mocked(getInstanceDetail).mockResolvedValue(
      instanceDetailOk([BASE_TASK, { ...BASE_TASK, id: "t2" }]),
    );
    // t1 -> t2 -> t1: a real cycle, forces PlannerEngine.shiftTask's own conflicts path.
    vi.mocked(listDependencies).mockResolvedValue({
      ok: true,
      data: [
        { id: "d1", instanceId: "i1", fromTaskId: "t1", toTaskId: "t2", depType: "finish_to_start", lagDays: 0 },
        { id: "d2", instanceId: "i1", fromTaskId: "t2", toTaskId: "t1", depType: "finish_to_start", lagDays: 0 },
      ],
    });

    const { client, rpcMock } = mockShiftClient({});
    const result = await shiftTask(
      { instanceId: "i1", rootTaskId: "t1", deltaDays: 2, idempotencyKey: "idem-3" },
      client,
    );

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("DEPENDENCY_CHANGED");
    expect(rpcMock).not.toHaveBeenCalled();
  });

  it("propagates a read failure from getInstanceDetail without calling the engine or RPC", async () => {
    vi.mocked(getInstanceDetail).mockResolvedValue({
      ok: false,
      error: { code: "INVALID_INPUT", message: "This plan could not be found." },
    });
    vi.mocked(listDependencies).mockResolvedValue({ ok: true, data: [] });

    const { client, rpcMock } = mockShiftClient({});
    const result = await shiftTask(
      { instanceId: "missing", rootTaskId: "t1", deltaDays: 1, idempotencyKey: "idem-4" },
      client,
    );

    expect(result).toEqual({ ok: false, error: { code: "INVALID_INPUT", message: "This plan could not be found." } });
    expect(rpcMock).not.toHaveBeenCalled();
  });

  it("rejects an unknown root task before calling the engine or RPC", async () => {
    vi.mocked(getInstanceDetail).mockResolvedValue(instanceDetailOk([BASE_TASK]));
    vi.mocked(listDependencies).mockResolvedValue({ ok: true, data: [] });

    const { client, rpcMock } = mockShiftClient({});
    const result = await shiftTask(
      { instanceId: "i1", rootTaskId: "ghost", deltaDays: 2, idempotencyKey: "idem-5" },
      client,
    );

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("NOT_FOUND");
    expect(rpcMock).not.toHaveBeenCalled();
  });

  it("aborts with NOT_FOUND instead of an epoch-timestamp fallback when a task is missing from the fresh re-fetch", async () => {
    vi.mocked(getInstanceDetail).mockResolvedValue(instanceDetailOk([BASE_TASK]));
    vi.mocked(listDependencies).mockResolvedValue({ ok: true, data: [] });

    // Fresh re-fetch explicitly returns zero rows for t1 — simulating a task
    // deleted/made inaccessible between getInstanceDetail() and this query.
    const { client, rpcMock } = mockShiftClient({ freshRows: [] });
    const result = await shiftTask(
      { instanceId: "i1", rootTaskId: "t1", deltaDays: 2, idempotencyKey: "idem-missing" },
      client,
    );

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("NOT_FOUND");
    expect(rpcMock).not.toHaveBeenCalled();
  });

  it("computes the shift from freshly re-fetched dates, not the earlier getInstanceDetail snapshot", async () => {
    // getInstanceDetail's snapshot says t1 already ran 2026-07-01 to
    // 2026-07-03 (BASE_TASK); the fresh re-fetch says a concurrent edit
    // already moved it to 2026-07-05 to 2026-07-07. The shift must be
    // computed from the fresh dates, not the stale snapshot — proving the
    // stale-dates-before-shift-RPC fix actually threads the fresh dates into
    // the engine rather than only refreshing the CAS token.
    vi.mocked(getInstanceDetail).mockResolvedValue(instanceDetailOk([BASE_TASK]));
    vi.mocked(listDependencies).mockResolvedValue({ ok: true, data: [] });

    const { client, rpcMock } = mockShiftClient({
      freshRows: [
        { id: "t1", start_date: "2026-07-05", end_date: "2026-07-07", updated_at: "2026-07-10T00:00:00.000Z" },
      ],
      rpcData: { ok: true, replayed: false, changedTasks: [], conflicts: [] },
    });

    await shiftTask({ instanceId: "i1", rootTaskId: "t1", deltaDays: 2, idempotencyKey: "idem-fresh" }, client);

    expect(rpcMock).toHaveBeenCalledTimes(1);
    const [, args] = rpcMock.mock.calls[0] as [string, Record<string, unknown>];
    const changedTasks = args.p_changed_tasks as Array<{ taskId: string; newStartDate: string; newEndDate: string }>;
    expect(changedTasks).toEqual([
      expect.objectContaining({ taskId: "t1", newStartDate: "2026-07-07", newEndDate: "2026-07-09" }),
    ]);
  });

  it("still shifts an unrelated task even when a different, unchanged task in the instance is missing from the fresh re-fetch", async () => {
    // t2 has no dependency relationship to t1 and isn't part of this shift —
    // it merely happens to live in the same instance. Simulating it having
    // been deleted (freshRows omits it) must not block a valid shift of t1;
    // only tasks the engine actually decides to write to need a fresh row.
    const t2 = { ...BASE_TASK, id: "t2", startDate: "2026-08-01", endDate: "2026-08-02" };
    vi.mocked(getInstanceDetail).mockResolvedValue(instanceDetailOk([BASE_TASK, t2]));
    vi.mocked(listDependencies).mockResolvedValue({ ok: true, data: [] });

    const { client, rpcMock } = mockShiftClient({
      freshRows: [
        { id: "t1", start_date: BASE_TASK.startDate, end_date: BASE_TASK.endDate, updated_at: "2026-07-10T00:00:00.000Z" },
      ],
      rpcData: { ok: true, replayed: false, changedTasks: [{ taskId: "t1", updatedAt: "2026-07-10T00:01:00.000Z" }], conflicts: [] },
    });

    const result = await shiftTask({ instanceId: "i1", rootTaskId: "t1", deltaDays: 2, idempotencyKey: "idem-unrelated" }, client);

    expect(result.ok).toBe(true);
    expect(rpcMock).toHaveBeenCalledTimes(1);
    const [, args] = rpcMock.mock.calls[0] as [string, Record<string, unknown>];
    const changedTasks = args.p_changed_tasks as Array<{ taskId: string }>;
    expect(changedTasks).toEqual([expect.objectContaining({ taskId: "t1" })]);
  });

  it.each(["STALE_VERSION", "INSTANCE_TERMINAL", "IDEMPOTENCY_CONFLICT", "DEPENDENCY_CHANGED", "FORBIDDEN"])(
    "maps RPC-returned %s to a typed error",
    async (code) => {
      vi.mocked(getInstanceDetail).mockResolvedValue(instanceDetailOk([BASE_TASK]));
      vi.mocked(listDependencies).mockResolvedValue({ ok: true, data: [] });

      const { client } = mockShiftClient({
        freshRows: [{ id: "t1", start_date: BASE_TASK.startDate, end_date: BASE_TASK.endDate, updated_at: "2026-07-10T00:00:00.000Z" }],
        rpcData: { ok: false, code },
      });

      const result = await shiftTask(
        { instanceId: "i1", rootTaskId: "t1", deltaDays: 2, idempotencyKey: `idem-${code}` },
        client,
      );
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.error.code).toBe(code);
    },
  );

  it("surfaces replayed:true from an idempotent retry rather than treating it as a fresh write", async () => {
    vi.mocked(getInstanceDetail).mockResolvedValue(instanceDetailOk([BASE_TASK]));
    vi.mocked(listDependencies).mockResolvedValue({ ok: true, data: [] });

    const { client } = mockShiftClient({
      freshRows: [{ id: "t1", start_date: BASE_TASK.startDate, end_date: BASE_TASK.endDate, updated_at: "2026-07-10T00:00:00.000Z" }],
      rpcData: {
        ok: true,
        replayed: true,
        changedTasks: [{ taskId: "t1", updatedAt: "2026-07-10T00:01:00.000Z" }],
        conflicts: [],
      },
    });

    const result = await shiftTask(
      { instanceId: "i1", rootTaskId: "t1", deltaDays: 2, idempotencyKey: "idem-retry" },
      client,
    );
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data.replayed).toBe(true);
  });
});

describe("updateTask", () => {
  it("maps a successful field update", async () => {
    const { client, rpcMock } = mockRpcJson({
      ok: true,
      replayed: false,
      taskId: "t1",
      updatedAt: "2026-07-10T00:01:00.000Z",
    });

    const result = await updateTask(
      {
        taskId: "t1",
        instanceId: "i1",
        expectedUpdatedAt: "2026-07-10T00:00:00.000Z",
        idempotencyKey: "idem-1",
        patch: { status: "done" },
      },
      client,
    );

    expect(result).toEqual({
      ok: true,
      data: { replayed: false, taskId: "t1", updatedAt: "2026-07-10T00:01:00.000Z" },
    });
    expect(rpcMock).toHaveBeenCalledWith("planner_update_task", {
      p_task_id: "t1",
      p_instance_id: "i1",
      p_expected_updated_at: "2026-07-10T00:00:00.000Z",
      p_idempotency_key: "idem-1",
      p_patch: { status: "done" },
    });
  });

  it("rejects an empty patch before calling the RPC (INVALID_INPUT)", async () => {
    const { client, rpcMock } = mockRpcJson(null);

    const result = await updateTask(
      { taskId: "t1", instanceId: "i1", expectedUpdatedAt: "2026-07-10T00:00:00.000Z", idempotencyKey: "idem-2", patch: {} },
      client,
    );

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("INVALID_INPUT");
    expect(rpcMock).not.toHaveBeenCalled();
  });

  it.each(["STALE_VERSION", "FORBIDDEN", "INSTANCE_TERMINAL", "NOT_FOUND", "IDEMPOTENCY_CONFLICT"])(
    "maps RPC-returned %s to a typed error",
    async (code) => {
      const { client } = mockRpcJson({ ok: false, code });
      const result = await updateTask(
        {
          taskId: "t1",
          instanceId: "i1",
          expectedUpdatedAt: "2026-07-10T00:00:00.000Z",
          idempotencyKey: `idem-${code}`,
          patch: { title: "New" },
        },
        client,
      );
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.error.code).toBe(code);
    },
  );

  it("never forwards a raw/unrecognized error code", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    const { client } = mockRpcJson({ ok: false, code: "some_unexpected_thing" });

    const result = await updateTask(
      {
        taskId: "t1",
        instanceId: "i1",
        expectedUpdatedAt: "2026-07-10T00:00:00.000Z",
        idempotencyKey: "idem-x",
        patch: { title: "New" },
      },
      client,
    );

    expect(result).toEqual({ ok: false, error: { code: "UNKNOWN_ERROR", message: "The request could not be completed." } });
    expect(consoleError).toHaveBeenCalled();
    consoleError.mockRestore();
  });
});

describe("setViewConfig", () => {
  beforeEach(() => {
    vi.mocked(getEffectivePermissions).mockReset();
    vi.mocked(getEffectivePermissions).mockResolvedValue({
      role: "manager",
      canRead: true,
      canUpdateTasks: true,
      canManageWorkflow: true,
    });
  });

  it("upserts default_view/filters for the current user", async () => {
    const { client, upsertMock } = mockViewConfigClient({ userId: "u1" });

    const result = await setViewConfig(
      { instanceId: "i1", defaultView: "kanban", filters: { status: "active" } },
      client,
    );

    expect(result).toEqual({ ok: true, data: { instanceId: "i1" } });
    expect(upsertMock).toHaveBeenCalledWith(
      { user_id: "u1", instance_id: "i1", default_view: "kanban", filters: { status: "active" } },
      { onConflict: "user_id,instance_id" },
    );
  });

  it("never includes default_view in the patch when only filters/sort_config are given (list view)", async () => {
    const { client, upsertMock } = mockViewConfigClient({ userId: "u1" });

    await setViewConfig({ instanceId: "i1", filters: { q: "x" } }, client);

    const [patch] = upsertMock.mock.calls[0] as [Record<string, unknown>];
    expect(patch).not.toHaveProperty("default_view");
  });

  it("rejects an unauthenticated caller before touching the table", async () => {
    const { client, upsertMock } = mockViewConfigClient({ userId: null });

    const result = await setViewConfig({ instanceId: "i1", defaultView: "timeline" }, client);

    expect(result).toEqual({
      ok: false,
      error: { code: "UNAUTHENTICATED", message: "Sign in to save your view preference." },
    });
    expect(upsertMock).not.toHaveBeenCalled();
  });

  it("denies a caller without read access to the instance before touching the table (revoked assignment / unrelated instance UUID)", async () => {
    vi.mocked(getEffectivePermissions).mockResolvedValue({
      role: null,
      canRead: false,
      canUpdateTasks: false,
      canManageWorkflow: false,
    });
    const { client, upsertMock } = mockViewConfigClient({ userId: "u1" });

    const result = await setViewConfig({ instanceId: "i1", defaultView: "timeline" }, client);

    expect(result).toEqual({
      ok: false,
      error: { code: "INVALID_INPUT", message: "This plan could not be found." },
    });
    expect(upsertMock).not.toHaveBeenCalled();
  });

  it("maps an upsert failure to UNKNOWN_ERROR without leaking the raw message", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    const { client } = mockViewConfigClient({ userId: "u1", upsertError: { message: "constraint violation detail" } });

    const result = await setViewConfig({ instanceId: "i1", defaultView: "timeline" }, client);

    expect(result).toEqual({
      ok: false,
      error: { code: "UNKNOWN_ERROR", message: "Your view preference could not be saved." },
    });
    expect(consoleError).toHaveBeenCalled();
    consoleError.mockRestore();
  });
});
