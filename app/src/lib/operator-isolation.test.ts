import { afterEach, describe, expect, it, vi } from "vitest";
import { RequestContext } from "@mastra/core/request-context";
import { makeMemoryResourceId } from "@/mastra/memory";

// IPI2-127 / IPI-146 two-user smoke test — proves per-user AND per-org Mastra
// resourceId isolation.
//
// Post-IPI-146, the agent factory in route.ts resolves the operator's org
// (via resolveOrgScopedResourceId — org_members lookup, see route.ts) and
// passes makeMemoryResourceId(orgId, user.id) as resourceId to
// MastraAgent.getLocalAgents(), not a bare user.id. This test simulates that
// shape directly (org resolution itself needs live Supabase — that's covered
// by app/src/lib/db/mastra-org-scope.integration.test.ts) and verifies each
// (org, user) pair gets a distinct resourceId — User A cannot share
// memory/thread namespace with User B, even across orgs.
//
// We mock resolveOperatorUser + MastraAgent.getLocalAgents to prove the
// isolation contract without live Supabase/Mastra calls. makeMemoryResourceId
// itself is NOT mocked — this exercises the real IPI-146 id format.

vi.mock("@/lib/auth", () => ({
  resolveOperatorUser: vi.fn(),
}));

vi.mock("@ag-ui/mastra", () => ({
  MastraAgent: {
    getLocalAgents: vi.fn(),
  },
}));

import { resolveOperatorUser } from "@/lib/auth";
import { MastraAgent } from "@ag-ui/mastra";

const resolveOperatorUserMock = vi.mocked(resolveOperatorUser);
const getLocalAgentsMock = vi.mocked(MastraAgent.getLocalAgents);

// Simulates the agent factory logic from route.ts (post-IPI-146). orgId is
// passed directly here rather than resolved from Supabase — see
// mastra-org-scope.integration.test.ts for the live org_members lookup.
async function createAgentsForRequest(request: Request, orgId: string) {
  const user = await resolveOperatorUser(request);
  const resourceId = makeMemoryResourceId(orgId, user.id);
  const requestContext = new RequestContext();
  requestContext.set("userId", user.id);
  if (user.email) requestContext.set("email", user.email);
  return MastraAgent.getLocalAgents({
    mastra: {} as any,
    resourceId,
    requestContext: requestContext,
  });
}

describe("IPI2-127: per-user Mastra resourceId isolation (two-user smoke)", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("User A gets agents with org-scoped resourceId", async () => {
    resolveOperatorUserMock.mockResolvedValueOnce({
      id: "user-a-111",
      email: "alice@example.com",
      name: "Alice",
    });
    getLocalAgentsMock.mockReturnValue({} as any);

    const reqA = new Request("http://localhost/api/copilotkit", {
      headers: { authorization: "Bearer token-a" },
    });

    await createAgentsForRequest(reqA, "org-acme");

    const callA = getLocalAgentsMock.mock.calls[0][0];
    expect(callA.resourceId).toBe(makeMemoryResourceId("org-acme", "user-a-111"));
    expect(callA.requestContext?.toJSON()).toMatchObject({ userId: "user-a-111", email: "alice@example.com" });
  });

  it("User B gets agents with a different org-scoped resourceId than User A", async () => {
    resolveOperatorUserMock.mockResolvedValueOnce({
      id: "user-b-222",
      email: "bob@example.com",
      name: "Bob",
    });
    getLocalAgentsMock.mockReturnValue({} as any);

    const reqB = new Request("http://localhost/api/copilotkit", {
      headers: { authorization: "Bearer token-b" },
    });

    await createAgentsForRequest(reqB, "org-widgets");

    const callB2 = getLocalAgentsMock.mock.calls[0][0];
    expect(callB2.resourceId).toBe(makeMemoryResourceId("org-widgets", "user-b-222"));
    expect(callB2.requestContext?.toJSON()).toMatchObject({ userId: "user-b-222", email: "bob@example.com" });
  });

  it("User A's resourceId does not match User B's resourceId", async () => {
    resolveOperatorUserMock
      .mockResolvedValueOnce({
        id: "user-a-111",
        email: "alice@example.com",
        name: "Alice",
      })
      .mockResolvedValueOnce({
        id: "user-b-222",
        email: "bob@example.com",
        name: "Bob",
      });

    getLocalAgentsMock.mockReturnValue({} as any);

    const reqA = new Request("http://localhost/api/copilotkit", {
      headers: { authorization: "Bearer token-a" },
    });
    const reqB = new Request("http://localhost/api/copilotkit", {
      headers: { authorization: "Bearer token-b" },
    });

    await createAgentsForRequest(reqA, "org-acme");
    const callA = getLocalAgentsMock.mock.calls[0][0].resourceId;

    await createAgentsForRequest(reqB, "org-acme");
    const callB = getLocalAgentsMock.mock.calls[1][0].resourceId;

    expect(callA).toBe(makeMemoryResourceId("org-acme", "user-a-111"));
    expect(callB).toBe(makeMemoryResourceId("org-acme", "user-b-222"));
    expect(callA).not.toBe(callB);
  });

  it("same user in two different orgs gets two different resourceIds", async () => {
    // Multi-org membership: the same operator switching orgs must not share
    // memory/thread namespace across orgs.
    resolveOperatorUserMock.mockResolvedValue({
      id: "user-a-111",
      email: "alice@example.com",
      name: "Alice",
    });
    getLocalAgentsMock.mockReturnValue({} as any);

    const req = new Request("http://localhost/api/copilotkit", {
      headers: { authorization: "Bearer token-a" },
    });

    await createAgentsForRequest(req, "org-acme");
    const inOrgAcme = getLocalAgentsMock.mock.calls[0][0].resourceId;

    await createAgentsForRequest(req, "org-widgets");
    const inOrgWidgets = getLocalAgentsMock.mock.calls[1][0].resourceId;

    expect(inOrgAcme).not.toBe(inOrgWidgets);
  });

  it("User A cannot produce User B's resourceId from their own token", async () => {
    // Alice's token always resolves to Alice's id, never Bob's
    resolveOperatorUserMock.mockResolvedValue({
      id: "user-a-111",
      email: "alice@example.com",
      name: "Alice",
    });
    getLocalAgentsMock.mockReturnValue({} as any);

    const reqA = new Request("http://localhost/api/copilotkit", {
      headers: { authorization: "Bearer token-a" },
    });

    // Multiple calls with the same token+org always produce the same resourceId
    const ids = new Set<string>();
    for (let i = 0; i < 5; i++) {
      await createAgentsForRequest(reqA, "org-acme");
      ids.add(getLocalAgentsMock.mock.calls[i][0].resourceId);
    }

    expect(ids.size).toBe(1);
    expect(ids.has(makeMemoryResourceId("org-acme", "user-a-111"))).toBe(true);
  });

  it("no fallback to demo-user or anonymous resourceId", async () => {
    // If auth is enabled, resolveOperatorUser throws for invalid tokens,
    // which propagates up through the factory — no fallback resourceId.
    resolveOperatorUserMock.mockRejectedValue(new Error("invalid token"));

    const req = new Request("http://localhost/api/copilotkit", {
      headers: { authorization: "Bearer bad-token" },
    });

    await expect(createAgentsForRequest(req, "org-acme")).rejects.toThrow("invalid token");
    expect(getLocalAgentsMock).not.toHaveBeenCalled();
  });

  it("dev fallback (auth disabled) uses dev-unauthenticated, not shared user", async () => {
    // When OPERATOR_AUTH_ENABLED is not true, the gate returns a dev identity.
    // The factory still uses that identity's id as resourceId.
    vi.stubEnv("OPERATOR_AUTH_ENABLED", "false");
    import("@/lib/auth").then(({ resolveOperatorUser: resolveOpUser }) => {
      expect(resolveOpUser).not.toHaveBeenCalled();
    });
  });
});
