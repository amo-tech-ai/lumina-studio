import { describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";

import { canRestartBrandAnalysis } from "./can-restart-brand-analysis";

const ACTOR = "aaaaaaaa-1111-2222-3333-444444444444";
const OTHER = "bbbbbbbb-1111-2222-3333-444444444444";
const ORG = "cccccccc-1111-2222-3333-444444444444";

function makeSupabase(rpcResult: { data: unknown; error: unknown }) {
  const rpc = vi.fn().mockResolvedValue(rpcResult);
  return { client: { rpc } as unknown as SupabaseClient, rpc };
}

describe("canRestartBrandAnalysis", () => {
  it("allows the creator of a personal brand without an org role lookup", async () => {
    const { client, rpc } = makeSupabase({ data: null, error: null });
    const allowed = await canRestartBrandAnalysis(client, ACTOR, {
      org_id: null,
      user_id: ACTOR,
    });
    expect(allowed).toBe(true);
    expect(rpc).not.toHaveBeenCalled();
  });

  it("denies a non-creator on a personal brand", async () => {
    const { client } = makeSupabase({ data: null, error: null });
    await expect(
      canRestartBrandAnalysis(client, ACTOR, { org_id: null, user_id: OTHER }),
    ).resolves.toBe(false);
  });

  it("denies an ownerless personal brand instead of matching null to null", async () => {
    const { client } = makeSupabase({ data: null, error: null });
    await expect(
      canRestartBrandAnalysis(client, ACTOR, { org_id: null, user_id: null }),
    ).resolves.toBe(false);
  });

  it("allows an org editor/owner via is_org_editor_or_above", async () => {
    const { client, rpc } = makeSupabase({ data: true, error: null });
    const allowed = await canRestartBrandAnalysis(client, ACTOR, {
      org_id: ORG,
      user_id: OTHER,
    });
    expect(allowed).toBe(true);
    expect(rpc).toHaveBeenCalledWith("is_org_editor_or_above", { p_org_id: ORG });
  });

  it("denies an org viewer", async () => {
    const { client } = makeSupabase({ data: false, error: null });
    await expect(
      canRestartBrandAnalysis(client, ACTOR, { org_id: ORG, user_id: OTHER }),
    ).resolves.toBe(false);
  });

  it("fails closed when the role check errors", async () => {
    const { client } = makeSupabase({ data: null, error: { code: "42501" } });
    await expect(
      canRestartBrandAnalysis(client, ACTOR, { org_id: ORG, user_id: ACTOR }),
    ).resolves.toBe(false);
  });
});
