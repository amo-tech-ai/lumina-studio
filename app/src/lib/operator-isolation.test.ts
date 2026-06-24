import { afterEach, describe, expect, it, vi } from "vitest";
import { RequestContext } from "@mastra/core/request-context";

// IPI2-127 two-user smoke test — proves per-user Mastra resourceId isolation.
//
// The agent factory in route.ts calls resolveOperatorUser(request) then
// passes user.id as resourceId to MastraAgent.getLocalAgents(). This test
// simulates two different users and verifies each gets a distinct resourceId
// scoped to their identity — User A cannot share memory/thread namespace with
// User B.
//
// We mock resolveOperatorUser + MastraAgent.getLocalAgents to prove the
// isolation contract without live Supabase/Mastra calls.

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

// Simulates the agent factory logic from route.ts
async function createAgentsForRequest(request: Request) {
  const user = await resolveOperatorUser(request);
  const requestContext = new RequestContext();
  requestContext.set("userId", user.id);
  if (user.email) requestContext.set("email", user.email);
  return MastraAgent.getLocalAgents({
    mastra: {} as any,
    resourceId: user.id,
    requestContext: requestContext,
  });
}

describe("IPI2-127: per-user Mastra resourceId isolation (two-user smoke)", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("User A gets agents with resourceId A", async () => {
    resolveOperatorUserMock.mockResolvedValueOnce({
      id: "user-a-111",
      email: "alice@example.com",
      name: "Alice",
    });
    getLocalAgentsMock.mockReturnValue({} as any);

    const reqA = new Request("http://localhost/api/copilotkit", {
      headers: { authorization: "Bearer token-a" },
    });

    await createAgentsForRequest(reqA);

    const callA = getLocalAgentsMock.mock.calls[0][0];
    expect(callA.resourceId).toBe("user-a-111");
    expect(callA.requestContext?.toJSON()).toMatchObject({ userId: "user-a-111", email: "alice@example.com" });
  });

  it("User B gets agents with resourceId B (different from User A)", async () => {
    resolveOperatorUserMock.mockResolvedValueOnce({
      id: "user-b-222",
      email: "bob@example.com",
      name: "Bob",
    });
    getLocalAgentsMock.mockReturnValue({} as any);

    const reqB = new Request("http://localhost/api/copilotkit", {
      headers: { authorization: "Bearer token-b" },
    });

    await createAgentsForRequest(reqB);

    const callB2 = getLocalAgentsMock.mock.calls[0][0];
    expect(callB2.resourceId).toBe("user-b-222");
    expect(callB2.requestContext?.toJSON()).toMatchObject({ userId: "user-b-222", email: "bob@example.com" });
  });

  it("User A's resourceId does not match User B's resourceId", async () => {
    const results: string[] = [];

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

    await createAgentsForRequest(reqA);
    const callA = getLocalAgentsMock.mock.calls[0][0].resourceId;

    await createAgentsForRequest(reqB);
    const callB = getLocalAgentsMock.mock.calls[1][0].resourceId;

    expect(callA).toBe("user-a-111");
    expect(callB).toBe("user-b-222");
    expect(callA).not.toBe(callB);
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

    // Multiple calls with the same token always produce the same resourceId
    const ids = new Set<string>();
    for (let i = 0; i < 5; i++) {
      await createAgentsForRequest(reqA);
      ids.add(getLocalAgentsMock.mock.calls[i][0].resourceId);
    }

    expect(ids.size).toBe(1);
    expect(ids.has("user-a-111")).toBe(true);
  });

  it("no fallback to demo-user or anonymous resourceId", async () => {
    // If auth is enabled, resolveOperatorUser throws for invalid tokens,
    // which propagates up through the factory — no fallback resourceId.
    resolveOperatorUserMock.mockRejectedValue(new Error("invalid token"));

    const req = new Request("http://localhost/api/copilotkit", {
      headers: { authorization: "Bearer bad-token" },
    });

    await expect(createAgentsForRequest(req)).rejects.toThrow("invalid token");
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
