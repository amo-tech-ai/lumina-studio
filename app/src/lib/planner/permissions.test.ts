import { describe, expect, it, vi, afterEach } from "vitest";

import { PlannerEngine } from "./engine";
import { getEffectivePermissions } from "./permissions";

function makeSupabaseStub(rpcImpl: (name: string, args: unknown) => Promise<unknown>) {
  return { rpc: vi.fn(rpcImpl) } as never;
}

afterEach(() => vi.restoreAllMocks());

describe("permissions.ts::getEffectivePermissions", () => {
  it("delegates to PlannerEngine.getEffectivePermissions rather than reimplementing the rules", async () => {
    const engineSpy = vi.spyOn(PlannerEngine.prototype, "getEffectivePermissions");
    const row = {
      id: "a1",
      instance_id: "inst-1",
      user_id: "user-1",
      role: "manager",
      permissions: null,
    };

    const supabase = makeSupabaseStub(() =>
      Promise.resolve({ data: [row], error: null }),
    );

    const result = await getEffectivePermissions("user-1", "inst-1", supabase);

    // Asserts the exact RPC name and args — not just that *a* query ran.
    // planner_get_my_assignment is a SECURITY DEFINER RPC hard-scoped to
    // auth.uid() specifically because planner.assignments' RLS policy
    // (assignments_select_org) requires manager+ to SELECT any row
    // directly, including the caller's own (PR #347 review finding) — a
    // contributor/viewer querying the table with their own RLS-scoped
    // client would get zero rows and be treated as unassigned.
    expect(supabase.rpc).toHaveBeenCalledTimes(1);
    expect(supabase.rpc).toHaveBeenCalledWith("planner_get_my_assignment", {
      p_instance_id: "inst-1",
    });

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

  it("maps an RPC failure to a thrown error, never a silently-empty permission set", async () => {
    const supabase = makeSupabaseStub(() =>
      Promise.resolve({ data: null, error: new Error("db unreachable") }),
    );

    await expect(
      getEffectivePermissions("user-1", "inst-1", supabase),
    ).rejects.toThrow();
  });

  it("unassigned user gets zero permissions, same as calling the engine directly", async () => {
    const supabase = makeSupabaseStub(() =>
      Promise.resolve({ data: [], error: null }),
    );

    const result = await getEffectivePermissions(
      "unknown-user",
      "inst-1",
      supabase,
    );

    expect(result).toEqual({
      role: null,
      canRead: false,
      canUpdateTasks: false,
      canManageWorkflow: false,
    });
  });
});
