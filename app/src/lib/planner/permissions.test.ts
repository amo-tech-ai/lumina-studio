import { describe, expect, it, vi, afterEach } from "vitest";

import { PlannerEngine } from "./engine";
import { getEffectivePermissions } from "./permissions";

function makeSupabaseStub(rows: Record<string, unknown>[]) {
  return {
    schema: () => ({
      from: () => ({
        select: () => ({
          eq: () => Promise.resolve({ data: rows, error: null }),
        }),
      }),
    }),
  } as never;
}

afterEach(() => vi.restoreAllMocks());

describe("permissions.ts::getEffectivePermissions", () => {
  it("delegates to PlannerEngine.getEffectivePermissions rather than reimplementing the rules", async () => {
    const engineSpy = vi.spyOn(PlannerEngine.prototype, "getEffectivePermissions");
    const rows = [
      {
        id: "a1",
        instance_id: "inst-1",
        user_id: "user-1",
        role: "manager",
        permissions: null,
      },
    ];

    const result = await getEffectivePermissions(
      "user-1",
      "inst-1",
      makeSupabaseStub(rows),
    );

    expect(engineSpy).toHaveBeenCalledTimes(1);
    expect(engineSpy).toHaveBeenCalledWith(
      "user-1",
      [
        {
          id: "a1",
          instanceId: "inst-1",
          userId: "user-1",
          role: "manager",
          permissions: null,
        },
      ],
      "inst-1",
    );
    expect(result).toEqual(engineSpy.mock.results[0].value);
    expect(result.role).toBe("manager");
    expect(result.canUpdateTasks).toBe(true);
  });

  it("maps a Supabase-fetch failure to a thrown error, never a silently-empty permission set", async () => {
    const failingClient = {
      schema: () => ({
        from: () => ({
          select: () => ({
            eq: () =>
              Promise.resolve({ data: null, error: new Error("db unreachable") }),
          }),
        }),
      }),
    } as never;

    await expect(
      getEffectivePermissions("user-1", "inst-1", failingClient),
    ).rejects.toThrow();
  });

  it("unassigned user gets zero permissions, same as calling the engine directly", async () => {
    const result = await getEffectivePermissions(
      "unknown-user",
      "inst-1",
      makeSupabaseStub([]),
    );

    expect(result).toEqual({
      role: null,
      canRead: false,
      canUpdateTasks: false,
      canManageWorkflow: false,
    });
  });
});
