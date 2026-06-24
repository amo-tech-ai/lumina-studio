import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// ── Mocks (must be before dynamic import) ──────────────────────────────────

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
  vi.doMock("@/mastra", () => ({ mastra: {} }));

  vi.doMock("@/lib/auth", () => ({
    resolveOperatorUser: vi.fn(),
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
  }));

  vi.doMock("@ag-ui/mastra", () => ({
    MastraAgent: {
      getLocalAgents: vi.fn((opts: { resourceId: string }) => {
        getLocalAgentsCalls.push({ resourceId: opts.resourceId });
        return [];
      }),
    },
  }));

  vi.doMock("@copilotkit/runtime/v2", () => ({
    CopilotRuntime: vi.fn((config: { agents: (ctx: { request: Request }) => unknown }) => {
      (globalThis as Record<string, unknown>).__capturedAgentFactory = config.agents;
      return {};
    }),
    createCopilotEndpoint: vi.fn(() => ({})),
    CopilotKitIntelligence: vi.fn(),
    InMemoryAgentRunner: vi.fn(),
  }));

  vi.doMock("hono/vercel", () => ({
    handle: vi.fn(() => vi.fn().mockResolvedValue(new Response("ok"))),
  }));
}

describe("IPI2-127 — two-user isolation (runtime)", () => {
  beforeEach(async () => {
    vi.stubEnv("NODE_ENV", "development");
    await setupMocks();
  });

  it("produces different resourceId for User A vs User B in getLocalAgents", async () => {
    const route = await import("@/app/api/copilotkit/[[...slug]]/route");

    const factory = (globalThis as Record<string, unknown>).__capturedAgentFactory as (
      ctx: { request: Request },
    ) => unknown;
    expect(factory).toBeDefined();

    const withOperatorAuth = vi.mocked((await import("@/lib/operator-gate")).withOperatorAuth);

    // Run requests through the handler so the WeakMap is populated (C3 fix)
    const requestA = new Request("http://localhost/api/copilotkit");
    withOperatorAuth.mockResolvedValueOnce({ id: "user-a-uuid", email: "alice@example.com", name: "Alice" });
    await route.GET(requestA);

    const requestB = new Request("http://localhost/api/copilotkit");
    withOperatorAuth.mockResolvedValueOnce({ id: "user-b-uuid", email: "bob@example.com", name: "Bob" });
    await route.GET(requestB);

    await factory({ request: requestA });
    await factory({ request: requestB });

    expect(getLocalAgentsCalls).toHaveLength(2);
    expect(getLocalAgentsCalls[0].resourceId).toBe("user-a-uuid");
    expect(getLocalAgentsCalls[1].resourceId).toBe("user-b-uuid");
    expect(getLocalAgentsCalls[0].resourceId).not.toBe(getLocalAgentsCalls[1].resourceId);
  });

  it("isolates agent scopes: each request gets one getLocalAgents call", async () => {
    const route = await import("@/app/api/copilotkit/[[...slug]]/route");

    const factory = (globalThis as Record<string, unknown>).__capturedAgentFactory as (
      ctx: { request: Request },
    ) => unknown;

    const withOperatorAuth = vi.mocked((await import("@/lib/operator-gate")).withOperatorAuth);
    withOperatorAuth.mockResolvedValue({ id: "user-x", email: "x@test.com", name: "X" });

    const requests = [
      new Request("http://localhost"),
      new Request("http://localhost"),
      new Request("http://localhost"),
    ];
    for (const req of requests) await route.GET(req);
    for (const req of requests) await factory({ request: req });

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

  it("passes through to CopilotRuntime when auth succeeds", async () => {
    const withOperatorAuth = vi.mocked((await import("@/lib/operator-gate")).withOperatorAuth);
    withOperatorAuth.mockResolvedValue({ id: "real-user", email: "op@test.com", name: "Op" });

    const route = await import("@/app/api/copilotkit/[[...slug]]/route");

    const response = await route.GET(
      new Request("http://localhost/api/copilotkit", {
        headers: { authorization: "Bearer valid.jwt" },
      }),
    );

    expect(response.status).toBe(200);
    expect(await response.text()).toBe("ok");
  });
});
