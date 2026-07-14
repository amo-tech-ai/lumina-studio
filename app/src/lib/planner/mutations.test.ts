import { describe, expect, it, vi } from "vitest";
import { inviteMember, removeAssignment, updateRole } from "./mutations";

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
