import { describe, expect, it, vi } from "vitest";
import { commitShootDraft, parseCommitShootDraftBody } from "./commit-shoot-draft";

const baseInput = {
  brand_id: "11111111-1111-1111-1111-111111111111",
  shoot_name: "Spring",
  deliverables: [{ channel: "shopify", quantity: 2 }],
  shots: [{ shot_number: 1, description: "Hero" }],
  approved_budget: 1000,
};

describe("parseCommitShootDraftBody", () => {
  it("rejects negative approved_budget", () => {
    const result = parseCommitShootDraftBody({ ...baseInput, approved_budget: -1 });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/approved_budget/i);
  });

  it("rejects fractional deliverable quantity", () => {
    const result = parseCommitShootDraftBody({
      ...baseInput,
      deliverables: [{ channel: "shopify", quantity: 1.5 }],
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/integer quantity/i);
  });

  it("rejects unsupported deliverable channel", () => {
    const result = parseCommitShootDraftBody({
      ...baseInput,
      deliverables: [{ channel: "snapchat", quantity: 1 }],
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/Unsupported deliverable channel/i);
  });
});

describe("commitShootDraft validation", () => {
  it("rejects invalid channels from direct callers", async () => {
    const userSb = {
      from: () => ({
        select: () => ({
          eq: () => ({
            single: async () => ({ error: null }),
          }),
        }),
      }),
    };

    const result = await commitShootDraft({
      input: {
        ...baseInput,
        channels: ["snapchat"],
        deliverables: [{ channel: "shopify", quantity: 1 }],
      },
      operatorId: "22222222-2222-2222-2222-222222222222",
      userSb: userSb as never,
      serviceSb: { rpc: vi.fn() } as never,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.status).toBe(400);
      expect(result.error).toMatch(/Unsupported channel/i);
    }
  });
});

describe("commitShootDraft — IPI-732 org role authorization", () => {
  const operatorId = "22222222-2222-2222-2222-222222222222";
  const orgId = "44444444-4444-4444-4444-444444444444";

  function makeUserSb(opts: {
    brandOrgId: string | null;
    isEditorOrAbove: boolean;
    roleRpcError?: { message: string };
  }) {
    const rpc = vi.fn().mockResolvedValue({
      data: opts.isEditorOrAbove,
      error: opts.roleRpcError ?? null,
    });
    return {
      from: () => ({
        select: () => ({
          eq: () => ({
            single: async () => ({
              data: { id: baseInput.brand_id, org_id: opts.brandOrgId },
              error: null,
            }),
          }),
        }),
      }),
      rpc,
    };
  }

  it("owner: role check passes, RPC is called, success", async () => {
    const userSb = makeUserSb({ brandOrgId: orgId, isEditorOrAbove: true });
    const rpc = vi.fn().mockResolvedValue({ data: { shoot_id: "shoot-1" }, error: null });

    const result = await commitShootDraft({
      input: baseInput,
      operatorId,
      userSb: userSb as never,
      serviceSb: { rpc, from: vi.fn() } as never,
    });

    expect(userSb.rpc).toHaveBeenCalledWith("is_org_editor_or_above", { p_org_id: orgId });
    expect(rpc).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ ok: true, shoot_id: "shoot-1" });
  });

  it("editor: role check passes, RPC is called, success", async () => {
    // Same boolean path as owner — is_org_editor_or_above() does not
    // distinguish the two roles, both satisfy role IN ('owner', 'editor').
    const userSb = makeUserSb({ brandOrgId: orgId, isEditorOrAbove: true });
    const rpc = vi.fn().mockResolvedValue({ data: { shoot_id: "shoot-2" }, error: null });

    const result = await commitShootDraft({
      input: baseInput,
      operatorId,
      userSb: userSb as never,
      serviceSb: { rpc, from: vi.fn() } as never,
    });

    expect(rpc).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ ok: true, shoot_id: "shoot-2" });
  });

  it("viewer: role check fails, RPC is NOT called, 403", async () => {
    const userSb = makeUserSb({ brandOrgId: orgId, isEditorOrAbove: false });
    const rpc = vi.fn();

    const result = await commitShootDraft({
      input: baseInput,
      operatorId,
      userSb: userSb as never,
      serviceSb: { rpc, from: vi.fn() } as never,
    });

    expect(rpc).not.toHaveBeenCalled();
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.status).toBe(403);
      expect(result.error).toMatch(/owner or editor/i);
    }
  });

  it("cross-org / no access: brand lookup denied, RPC is NOT called, 403", async () => {
    const userSb = {
      from: () => ({
        select: () => ({
          eq: () => ({
            single: async () => ({ data: null, error: { message: "no rows" } }),
          }),
        }),
      }),
      rpc: vi.fn(),
    };
    const rpc = vi.fn();

    const result = await commitShootDraft({
      input: baseInput,
      operatorId,
      userSb: userSb as never,
      serviceSb: { rpc, from: vi.fn() } as never,
    });

    expect(userSb.rpc).not.toHaveBeenCalled();
    expect(rpc).not.toHaveBeenCalled();
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.status).toBe(403);
  });

  it("personal brand (org_id null): skips the role RPC entirely, relies on brand ownership check", async () => {
    const userSb = makeUserSb({ brandOrgId: null, isEditorOrAbove: false });
    const rpc = vi.fn().mockResolvedValue({ data: { shoot_id: "shoot-3" }, error: null });

    const result = await commitShootDraft({
      input: baseInput,
      operatorId,
      userSb: userSb as never,
      serviceSb: { rpc, from: vi.fn() } as never,
    });

    expect(userSb.rpc).not.toHaveBeenCalled();
    expect(result).toEqual({ ok: true, shoot_id: "shoot-3" });
  });

  it("RPC returns 42501 (role-change race): mapped to a clean 403, not a raw 500", async () => {
    const userSb = makeUserSb({ brandOrgId: orgId, isEditorOrAbove: true });
    const rpc = vi.fn().mockResolvedValue({
      data: null,
      error: { code: "42501", message: "unauthorized" },
    });

    const result = await commitShootDraft({
      input: baseInput,
      operatorId,
      userSb: userSb as never,
      serviceSb: { rpc, from: vi.fn() } as never,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.status).toBe(403);
      expect(result.error).toMatch(/owner or editor/i);
    }
  });

  it("RPC returns an unrelated error: still maps to 500, not 403", async () => {
    const userSb = makeUserSb({ brandOrgId: orgId, isEditorOrAbove: true });
    const rpc = vi.fn().mockResolvedValue({
      data: null,
      error: { code: "23505", message: "conflict" },
    });

    const result = await commitShootDraft({
      input: baseInput,
      operatorId,
      userSb: userSb as never,
      serviceSb: { rpc, from: vi.fn() } as never,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.status).toBe(500);
  });
});
