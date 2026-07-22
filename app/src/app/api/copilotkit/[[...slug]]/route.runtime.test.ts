import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const getLocalAgentsCalls: Array<{ resourceId: string }> = [];

beforeEach(() => {
  getLocalAgentsCalls.length = 0;
  vi.resetModules();
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

async function setupMocks() {
  vi.doMock("@/mastra", () => ({ getMastra: () => ({}) }));

  vi.doMock("@/lib/auth", () => ({
    resolveOperatorUser: vi.fn(),
    extractAccessToken: vi.fn().mockReturnValue("test-token"),
  }));
  vi.doMock("@/lib/request-token", () => ({
    requestToken: { run: vi.fn((_v: string, fn: () => unknown) => fn()), getStore: vi.fn() },
  }));

  const OperatorAuthErrorClass = class extends Error {
    constructor(m: string) {
      super(m);
      this.name = "OperatorAuthError";
    }
  };

  vi.doMock("@/lib/operator-gate", () => ({
    withOperatorAuth: vi.fn(),
    OperatorAuthError: OperatorAuthErrorClass,
    // Route attaches licenseToken only when this is true; default false so
    // ambient COPILOTKIT_LICENSE_TOKEN in .env.local does not break imports.
    isOperatorAuthEnforced: vi.fn(() => false),
  }));

  vi.doMock("@ag-ui/mastra", () => ({
    MastraAgent: {
      getLocalAgents: vi.fn((opts: { resourceId: string }) => {
        getLocalAgentsCalls.push({ resourceId: opts.resourceId });
        return [];
      }),
    },
  }));

  vi.doMock("@/lib/copilotkit/runtime-v2-fetch", () => ({
    CopilotRuntime: vi.fn((config: { agents: () => unknown }) => {
      (globalThis as Record<string, unknown>).__capturedAgentFactory = config.agents;
      return {};
    }),
    createCopilotRuntimeHandler: vi.fn(() => async () => {
      const factory = (globalThis as Record<string, unknown>).__capturedAgentFactory as
        | (() => unknown)
        | undefined;
      if (factory) await factory();
      return new Response("ok");
    }),
    InMemoryAgentRunner: vi.fn(),
  }));
}

describe("IPI2-127 — two-user isolation (runtime)", () => {
  beforeEach(async () => {
    vi.stubEnv("NODE_ENV", "development");
    await setupMocks();
  });

  it("produces different resourceId for User A vs User B in getLocalAgents", async () => {
    const route = await import("@/app/api/copilotkit/[[...slug]]/route");
    const withOperatorAuth = vi.mocked((await import("@/lib/operator-gate")).withOperatorAuth);

    withOperatorAuth.mockResolvedValueOnce({ id: "user-a-uuid", email: "alice@example.com", name: "Alice" });
    await route.GET(new Request("http://localhost/api/copilotkit"));

    withOperatorAuth.mockResolvedValueOnce({ id: "user-b-uuid", email: "bob@example.com", name: "Bob" });
    await route.GET(new Request("http://localhost/api/copilotkit"));

    expect(getLocalAgentsCalls).toHaveLength(2);
    expect(getLocalAgentsCalls[0].resourceId).toBe("user-a-uuid");
    expect(getLocalAgentsCalls[1].resourceId).toBe("user-b-uuid");
    expect(getLocalAgentsCalls[0].resourceId).not.toBe(getLocalAgentsCalls[1].resourceId);
  });

  it("isolates agent scopes: each request gets one getLocalAgents call", async () => {
    const route = await import("@/app/api/copilotkit/[[...slug]]/route");
    const withOperatorAuth = vi.mocked((await import("@/lib/operator-gate")).withOperatorAuth);
    withOperatorAuth.mockResolvedValue({ id: "user-x", email: "x@test.com", name: "X" });

    for (let i = 0; i < 3; i++) {
      await route.GET(new Request("http://localhost"));
    }

    expect(getLocalAgentsCalls).toHaveLength(3);
    const resourceIds = getLocalAgentsCalls.map((c) => c.resourceId);
    expect(new Set(resourceIds).size).toBe(1);
  });
});

describe("IPI2-127 — anonymous → 401 when auth enabled (runtime)", () => {
  beforeEach(async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("OPERATOR_AUTH_ENABLED", "true");
    await setupMocks();
  });

  it("returns 401 when withOperatorAuth throws OperatorAuthError", async () => {
    const { OperatorAuthError } = await import("@/lib/operator-gate");
    const withOperatorAuth = vi.mocked((await import("@/lib/operator-gate")).withOperatorAuth);
    withOperatorAuth.mockRejectedValue(new OperatorAuthError("Unauthorized"));

    const route = await import("@/app/api/copilotkit/[[...slug]]/route");

    const response = await route.GET(new Request("http://localhost/api/copilotkit"));

    expect(response.status).toBe(401);
    expect(await response.text()).toBe("Unauthorized");
  });

  it("passes through to CopilotRuntime when auth succeeds and propagates token via requestToken ALS", async () => {
    const withOperatorAuth = vi.mocked((await import("@/lib/operator-gate")).withOperatorAuth);
    withOperatorAuth.mockResolvedValue({ id: "real-user", email: "op@test.com", name: "Op" });

    const { requestToken } = await import("@/lib/request-token");
    const route = await import("@/app/api/copilotkit/[[...slug]]/route");

    const response = await route.GET(
      new Request("http://localhost/api/copilotkit", {
        headers: { authorization: "Bearer valid.jwt" },
      }),
    );

    expect(response.status).toBe(200);
    expect(await response.text()).toBe("ok");
    expect(vi.mocked(requestToken.run)).toHaveBeenCalledWith("test-token", expect.any(Function));
  });
});

describe("C3 — single auth resolution per request (runtime)", () => {
  beforeEach(async () => {
    vi.stubEnv("NODE_ENV", "development");
    await setupMocks();
  });

  it("calls withOperatorAuth once per request and never resolveOperatorUser", async () => {
    const route = await import("@/app/api/copilotkit/[[...slug]]/route");
    const withOperatorAuth = vi.mocked((await import("@/lib/operator-gate")).withOperatorAuth);
    const resolveOperatorUser = vi.mocked((await import("@/lib/auth")).resolveOperatorUser);

    withOperatorAuth.mockResolvedValue({ id: "cached-user", email: "cached@test.com", name: "Cached" });

    await route.GET(new Request("http://localhost/api/copilotkit"));
    await route.GET(new Request("http://localhost/api/copilotkit"));

    expect(withOperatorAuth).toHaveBeenCalledTimes(2);
    expect(resolveOperatorUser).not.toHaveBeenCalled();
    expect(getLocalAgentsCalls).toHaveLength(2);
    expect(getLocalAgentsCalls.every((c) => c.resourceId === "cached-user")).toBe(true);
  });
});

describe("CF-MIG-210 — Workers-safe runtime (no hono/vercel)", () => {
  beforeEach(async () => {
    vi.stubEnv("NODE_ENV", "development");
    await setupMocks();
  });

  it("uses createCopilotRuntimeHandler from runtime-v2-fetch", async () => {
    const { createCopilotRuntimeHandler } = await import("@/lib/copilotkit/runtime-v2-fetch");
    await import("@/app/api/copilotkit/[[...slug]]/route");
    expect(createCopilotRuntimeHandler).toHaveBeenCalledWith(
      expect.objectContaining({ basePath: "/api/copilotkit" }),
    );
  });
});

// IPI-760 regression guard. Real @ag-ui/mastra@1.1.1 behavior (confirmed against its
// compiled source, not assumed): MastraAgent.clone() rebuilds `new MastraAgent(this.config)`
// from the ORIGINAL config object — it does not copy live instance fields. CopilotKit's
// runtime clones the agent per request (`cloneAgentForRequest`), so setting
// `agent.emitInterruptOutcome = false` alone is silently discarded before every real
// request runs. This fake reproduces that exact clone() shape so the test fails the way
// production would if the route regresses to instance-only mutation.
class FakeMastraAgentWithRealCloneSemantics {
  config: { emitInterruptOutcome?: boolean; [key: string]: unknown };
  emitInterruptOutcome: boolean;

  constructor(config: { emitInterruptOutcome?: boolean; [key: string]: unknown }) {
    this.config = config;
    this.emitInterruptOutcome = config.emitInterruptOutcome ?? true;
  }

  clone() {
    return new FakeMastraAgentWithRealCloneSemantics(this.config);
  }
}

describe("IPI-760 — emitInterruptOutcome survives CopilotKit's per-request clone", () => {
  beforeEach(async () => {
    vi.stubEnv("NODE_ENV", "development");

    vi.doMock("@/mastra", () => ({ getMastra: () => ({}) }));
    vi.doMock("@/lib/auth", () => ({
      resolveOperatorUser: vi.fn(),
      extractAccessToken: vi.fn().mockReturnValue("test-token"),
    }));
    vi.doMock("@/lib/request-token", () => ({
      requestToken: { run: vi.fn((_v: string, fn: () => unknown) => fn()), getStore: vi.fn() },
    }));
    const OperatorAuthErrorClass = class extends Error {
      constructor(m: string) {
        super(m);
        this.name = "OperatorAuthError";
      }
    };
    vi.doMock("@/lib/operator-gate", () => ({
      withOperatorAuth: vi.fn().mockResolvedValue({ id: "user-1", email: "u@test.com", name: "U" }),
      OperatorAuthError: OperatorAuthErrorClass,
      isOperatorAuthEnforced: vi.fn(() => false),
    }));

    // getLocalAgents must return the SAME instance on every call — real @ag-ui/mastra
    // constructs fresh instances per call too, but the route only calls it once per
    // request; the test needs a stable reference to inspect what the route mutated,
    // same as reading the actual agent instance a real request would hand to CopilotKit.
    const sharedAgent = new FakeMastraAgentWithRealCloneSemantics({ agentId: "test-agent" });
    vi.doMock("@ag-ui/mastra", () => ({
      MastraAgent: Object.assign(FakeMastraAgentWithRealCloneSemantics, {
        getLocalAgents: () => ({ "test-agent": sharedAgent }),
      }),
    }));

    let capturedFactory: (() => unknown) | undefined;
    vi.doMock("@/lib/copilotkit/runtime-v2-fetch", () => ({
      CopilotRuntime: vi.fn((config: { agents: () => unknown }) => {
        capturedFactory = config.agents;
        return {};
      }),
      createCopilotRuntimeHandler: vi.fn(() => async () => {
        const agents = capturedFactory
          ? ((await capturedFactory()) as Record<string, FakeMastraAgentWithRealCloneSemantics>)
          : {};
        return Response.json({ agentIds: Object.keys(agents) });
      }),
      InMemoryAgentRunner: vi.fn(),
    }));
  });

  it("keeps emitInterruptOutcome false after CopilotKit clones the agent for a request", async () => {
    const route = await import("@/app/api/copilotkit/[[...slug]]/route");
    const { MastraAgent } = await import("@ag-ui/mastra");

    const agents = MastraAgent.getLocalAgents({ mastra: {}, resourceId: "user-1" }) as Record<
      string,
      FakeMastraAgentWithRealCloneSemantics
    >;
    const agent = agents["test-agent"];

    // Route sets this on construction — verify it did.
    await route.GET(new Request("http://localhost/api/copilotkit"));
    expect(agent.emitInterruptOutcome).toBe(false);

    // The regression: CopilotKit clones this exact instance before running it on every
    // real request. If the fix only mutated the instance field, the clone reverts to the
    // default `true` and every HITL interrupt/resume strands in production.
    const cloned = agent.clone();
    expect(cloned.emitInterruptOutcome).toBe(false);

    // And it must survive being cloned again (CopilotKit may clone more than once per
    // request lifecycle) — proves the fix mutated `config`, not just this one instance.
    const clonedAgain = cloned.clone();
    expect(clonedAgain.emitInterruptOutcome).toBe(false);
  });
});
