import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { makeMemoryResourceId } from "@/mastra/memory";

const getLocalAgentsCalls: Array<{ resourceId: string }> = [];

beforeEach(() => {
  getLocalAgentsCalls.length = 0;
  vi.resetModules();
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

/** IPI-146 · MASTRA-GOV-002 — mocks shared by every describe block below.
 *  `getCurrentOrgId` defaults to a fixed org so pre-existing (pre-IPI-146)
 *  assertions about *shape* (isolation, single-call-per-request, etc.) don't
 *  all need to separately wire org resolution — tests that care about org
 *  resolution itself override `getCurrentOrgId`/`getThreadById` per case. */
function mockOrgScopeDeps(opts?: { orgId?: string | null; threadResourceId?: string | null }) {
  const orgId = opts?.orgId === undefined ? "org-default" : opts.orgId;
  const threadResourceId = opts?.threadResourceId ?? null;
  // Hoisted so tests can assert call count (e.g. subscribe/clear must never look up).
  const getThreadById = vi.fn().mockResolvedValue(
    threadResourceId === null ? null : { resourceId: threadResourceId },
  );

  vi.doMock("@/lib/shoot/commit-shoot-draft", () => ({
    createUserScopedClient: vi.fn(() => ({})),
  }));
  vi.doMock("@/lib/crm/queries", () => ({
    getCurrentOrgId: vi.fn().mockResolvedValue(orgId),
  }));
  vi.doMock("@/mastra/memory", async () => {
    const actual = await vi.importActual<typeof import("@/mastra/memory")>("@/mastra/memory");
    return {
      ...actual,
      getMastraMemory: vi.fn(() => ({
        getThreadById,
      })),
    };
  });

  return { getThreadById };
}

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

  mockOrgScopeDeps();
}

describe("IPI2-127 — two-user isolation (runtime)", () => {
  beforeEach(async () => {
    vi.stubEnv("NODE_ENV", "development");
    await setupMocks();
  });

  it("produces different org-scoped resourceId for User A vs User B in getLocalAgents", async () => {
    const route = await import("@/app/api/copilotkit/[[...slug]]/route");
    const withOperatorAuth = vi.mocked((await import("@/lib/operator-gate")).withOperatorAuth);

    withOperatorAuth.mockResolvedValueOnce({ id: "user-a-uuid", email: "alice@example.com", name: "Alice" });
    await route.GET(new Request("http://localhost/api/copilotkit"));

    withOperatorAuth.mockResolvedValueOnce({ id: "user-b-uuid", email: "bob@example.com", name: "Bob" });
    await route.GET(new Request("http://localhost/api/copilotkit"));

    expect(getLocalAgentsCalls).toHaveLength(2);
    expect(getLocalAgentsCalls[0].resourceId).toBe(makeMemoryResourceId("org-default", "user-a-uuid"));
    expect(getLocalAgentsCalls[1].resourceId).toBe(makeMemoryResourceId("org-default", "user-b-uuid"));
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
    expect(
      getLocalAgentsCalls.every((c) => c.resourceId === makeMemoryResourceId("org-default", "cached-user")),
    ).toBe(true);
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

// IPI-146 · MASTRA-GOV-002 — org resolution + thread ownership fail-closed behavior.
describe("IPI-146 — org-scoped resourceId + thread ownership (runtime)", () => {
  beforeEach(async () => {
    vi.stubEnv("NODE_ENV", "development");
    await setupMocks();
  });

  it("returns 401 (not 403 org_required) when extractAccessToken finds no token at all", async () => {
    vi.doMock("@/lib/auth", () => ({
      resolveOperatorUser: vi.fn(),
      extractAccessToken: vi.fn().mockReturnValue(undefined),
    }));

    const route = await import("@/app/api/copilotkit/[[...slug]]/route");
    const withOperatorAuth = vi.mocked((await import("@/lib/operator-gate")).withOperatorAuth);
    withOperatorAuth.mockResolvedValue({ id: "user-a", email: "a@test.com", name: "A" });

    const response = await route.GET(new Request("http://localhost/api/copilotkit"));

    expect(response.status).toBe(401);
    expect(await response.text()).toBe("Unauthorized");
    expect(getLocalAgentsCalls).toHaveLength(0);
  });

  it("fails closed with 403 when the operator has no organization membership", async () => {
    vi.doMock("@/lib/crm/queries", () => ({
      getCurrentOrgId: vi.fn().mockResolvedValue(null),
    }));

    const route = await import("@/app/api/copilotkit/[[...slug]]/route");
    const withOperatorAuth = vi.mocked((await import("@/lib/operator-gate")).withOperatorAuth);
    withOperatorAuth.mockResolvedValue({ id: "orgless-user", email: "x@test.com", name: "X" });

    const response = await route.GET(new Request("http://localhost/api/copilotkit"));

    expect(response.status).toBe(403);
    const body = (await response.json()) as { code?: string };
    expect(body.code).toBe("org_required");
    expect(getLocalAgentsCalls).toHaveLength(0);
  });

  it("does not fall back to bare user.id when org resolution fails", async () => {
    vi.doMock("@/lib/crm/queries", () => ({
      getCurrentOrgId: vi.fn().mockResolvedValue(null),
    }));

    const route = await import("@/app/api/copilotkit/[[...slug]]/route");
    const withOperatorAuth = vi.mocked((await import("@/lib/operator-gate")).withOperatorAuth);
    withOperatorAuth.mockResolvedValue({ id: "orgless-user", email: "x@test.com", name: "X" });

    await route.GET(new Request("http://localhost/api/copilotkit"));

    // getLocalAgents must never be reached — no bare-user.id fallback resourceId.
    expect(getLocalAgentsCalls).toHaveLength(0);
  });

  it("allows a run against a brand-new threadId (no existing thread row)", async () => {
    mockOrgScopeDeps({ orgId: "org-acme", threadResourceId: null });

    const route = await import("@/app/api/copilotkit/[[...slug]]/route");
    const withOperatorAuth = vi.mocked((await import("@/lib/operator-gate")).withOperatorAuth);
    withOperatorAuth.mockResolvedValue({ id: "user-a", email: "a@test.com", name: "A" });

    const response = await route.POST(
      new Request("http://localhost/api/copilotkit/agent/production-planner/run", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ threadId: "brand-new-thread", messages: [] }),
      }),
    );

    expect(response.status).toBe(200);
    expect(getLocalAgentsCalls).toHaveLength(1);
    expect(getLocalAgentsCalls[0].resourceId).toBe(makeMemoryResourceId("org-acme", "user-a"));
  });

  it("allows a run against a thread already owned by the same org-scoped resourceId", async () => {
    const resourceId = makeMemoryResourceId("org-acme", "user-a");
    mockOrgScopeDeps({ orgId: "org-acme", threadResourceId: resourceId });

    const route = await import("@/app/api/copilotkit/[[...slug]]/route");
    const withOperatorAuth = vi.mocked((await import("@/lib/operator-gate")).withOperatorAuth);
    withOperatorAuth.mockResolvedValue({ id: "user-a", email: "a@test.com", name: "A" });

    const response = await route.POST(
      new Request("http://localhost/api/copilotkit/agent/production-planner/run", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ threadId: "existing-thread", messages: [] }),
      }),
    );

    expect(response.status).toBe(200);
    expect(getLocalAgentsCalls).toHaveLength(1);
  });

  it("migration strategy A: accepts a legacy pre-IPI-146 thread whose resourceId is the caller's own bare user.id", async () => {
    mockOrgScopeDeps({ orgId: "org-acme", threadResourceId: "user-a" });

    const route = await import("@/app/api/copilotkit/[[...slug]]/route");
    const withOperatorAuth = vi.mocked((await import("@/lib/operator-gate")).withOperatorAuth);
    withOperatorAuth.mockResolvedValue({ id: "user-a", email: "a@test.com", name: "A" });

    const response = await route.POST(
      new Request("http://localhost/api/copilotkit/agent/production-planner/run", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ threadId: "legacy-thread", messages: [] }),
      }),
    );

    expect(response.status).toBe(200);
    expect(getLocalAgentsCalls).toHaveLength(1);
  });

  it("denies (403) a cross-org threadId — thread owned by a different org's resourceId", async () => {
    mockOrgScopeDeps({ orgId: "org-acme", threadResourceId: makeMemoryResourceId("org-widgets", "user-b") });

    const route = await import("@/app/api/copilotkit/[[...slug]]/route");
    const withOperatorAuth = vi.mocked((await import("@/lib/operator-gate")).withOperatorAuth);
    withOperatorAuth.mockResolvedValue({ id: "user-a", email: "a@test.com", name: "A" });

    const response = await route.POST(
      new Request("http://localhost/api/copilotkit/agent/production-planner/run", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ threadId: "someone-elses-thread", messages: [] }),
      }),
    );

    expect(response.status).toBe(403);
    const body = (await response.json()) as { code?: string };
    expect(body.code).toBe("thread_forbidden");
    expect(getLocalAgentsCalls).toHaveLength(0);
  });

  it("denies (403) a forged threadId belonging to a different user in the same org", async () => {
    mockOrgScopeDeps({ orgId: "org-acme", threadResourceId: makeMemoryResourceId("org-acme", "user-b") });

    const route = await import("@/app/api/copilotkit/[[...slug]]/route");
    const withOperatorAuth = vi.mocked((await import("@/lib/operator-gate")).withOperatorAuth);
    withOperatorAuth.mockResolvedValue({ id: "user-a", email: "a@test.com", name: "A" });

    const response = await route.POST(
      new Request("http://localhost/api/copilotkit/agent/production-planner/run", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ threadId: "forged-thread-id", messages: [] }),
      }),
    );

    expect(response.status).toBe(403);
    const body = (await response.json()) as { code?: string };
    expect(body.code).toBe("thread_forbidden");
    expect(getLocalAgentsCalls).toHaveLength(0);
  });

  // GET/PATCH/DELETE thread routes carry no JSON body — threadId only ever
  // appears in the URL path (`/threads/:id`, `/threads/:id/state`, etc., per
  // CopilotKit's fetch-router). These prove extractThreadIdFromUrl closes
  // that gap instead of only checking the POST-body path above.
  it("denies (403) a GET to /threads/:id/state owned by a different org (URL-based check)", async () => {
    mockOrgScopeDeps({ orgId: "org-acme", threadResourceId: makeMemoryResourceId("org-widgets", "user-b") });

    const route = await import("@/app/api/copilotkit/[[...slug]]/route");
    const withOperatorAuth = vi.mocked((await import("@/lib/operator-gate")).withOperatorAuth);
    withOperatorAuth.mockResolvedValue({ id: "user-a", email: "a@test.com", name: "A" });

    const response = await route.GET(
      new Request("http://localhost/api/copilotkit/threads/someone-elses-thread/state"),
    );

    expect(response.status).toBe(403);
    const body = (await response.json()) as { code?: string };
    expect(body.code).toBe("thread_forbidden");
  });

  it("allows a GET to /threads/:id/state owned by the caller's own org-scoped resourceId", async () => {
    const resourceId = makeMemoryResourceId("org-acme", "user-a");
    mockOrgScopeDeps({ orgId: "org-acme", threadResourceId: resourceId });

    const route = await import("@/app/api/copilotkit/[[...slug]]/route");
    const withOperatorAuth = vi.mocked((await import("@/lib/operator-gate")).withOperatorAuth);
    withOperatorAuth.mockResolvedValue({ id: "user-a", email: "a@test.com", name: "A" });

    const response = await route.GET(
      new Request("http://localhost/api/copilotkit/threads/existing-thread/state"),
    );

    expect(response.status).toBe(200);
  });

  it("denies (403) a DELETE for a thread the caller doesn't own — no JSON body, URL-only", async () => {
    mockOrgScopeDeps({ orgId: "org-acme", threadResourceId: makeMemoryResourceId("org-widgets", "user-b") });

    const route = await import("@/app/api/copilotkit/[[...slug]]/route");
    const withOperatorAuth = vi.mocked((await import("@/lib/operator-gate")).withOperatorAuth);
    withOperatorAuth.mockResolvedValue({ id: "user-a", email: "a@test.com", name: "A" });

    const response = await route.DELETE(
      new Request("http://localhost/api/copilotkit/threads/someone-elses-thread", { method: "DELETE" }),
    );

    expect(response.status).toBe(403);
  });

  it("does not treat /threads/subscribe or /threads/clear as a threadId (no false-positive ownership check)", async () => {
    // These are CopilotKit's own list-level routes, not thread-scoped ones —
    // getThreadById must never be asked to look up "subscribe" or "clear" as
    // if they were a threadId. Assert call count (not only 200): with
    // threadResourceId:null the mock returns no thread, so a 200 alone would
    // still pass if extractThreadIdFromUrl wrongly treated those segments as IDs.
    const { getThreadById } = mockOrgScopeDeps({ orgId: "org-acme", threadResourceId: null });

    const route = await import("@/app/api/copilotkit/[[...slug]]/route");
    const withOperatorAuth = vi.mocked((await import("@/lib/operator-gate")).withOperatorAuth);
    withOperatorAuth.mockResolvedValue({ id: "user-a", email: "a@test.com", name: "A" });

    const subscribeResponse = await route.GET(
      new Request("http://localhost/api/copilotkit/threads/subscribe"),
    );
    const clearResponse = await route.POST(
      new Request("http://localhost/api/copilotkit/threads/clear", { method: "POST" }),
    );

    expect(subscribeResponse.status).toBe(200);
    expect(clearResponse.status).toBe(200);
    expect(getThreadById).not.toHaveBeenCalled();
  });
});

// IPI-146 · MASTRA-GOV-002 — proves the POST-body threadId read (via
// extractThreadIdFromBody) does not consume the request stream: the endpoint
// still receives the exact original body afterward. Uses its own mocks
// (not setupMocks()) because it needs createCopilotRuntimeHandler's returned
// handler to actually read the forwarded Request instead of ignoring it.
describe("IPI-146 — POST body is read once and forwarded intact (no request.clone())", () => {
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
    vi.doMock("@/lib/operator-gate", () => ({
      withOperatorAuth: vi.fn().mockResolvedValue({ id: "user-a", email: "a@test.com", name: "A" }),
      OperatorAuthError: class extends Error {},
      isOperatorAuthEnforced: vi.fn(() => false),
    }));
    mockOrgScopeDeps({ orgId: "org-acme", threadResourceId: null });
    vi.doMock("@ag-ui/mastra", () => ({
      MastraAgent: { getLocalAgents: vi.fn(() => ({})) },
    }));
    vi.doMock("@/lib/copilotkit/runtime-v2-fetch", () => ({
      CopilotRuntime: vi.fn(() => ({})),
      createCopilotRuntimeHandler: vi.fn(
        () => async (request: Request) => {
          const echoedBody = await request.text();
          return Response.json({ echoedBody, contentType: request.headers.get("content-type") });
        },
      ),
      InMemoryAgentRunner: vi.fn(),
    }));
  });

  it("endpoint(request) still receives the full original JSON body after threadId extraction", async () => {
    const route = await import("@/app/api/copilotkit/[[...slug]]/route");
    const payload = { threadId: "brand-new-thread", messages: [{ role: "user", content: "hi" }] };

    const response = await route.POST(
      new Request("http://localhost/api/copilotkit/agent/production-planner/run", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      }),
    );

    const result = (await response.json()) as { echoedBody: string; contentType: string };
    expect(JSON.parse(result.echoedBody)).toEqual(payload);
    expect(result.contentType).toBe("application/json");
  });

  it("passes non-JSON POST bodies through unchanged", async () => {
    const route = await import("@/app/api/copilotkit/[[...slug]]/route");

    const response = await route.POST(
      new Request("http://localhost/api/copilotkit/transcribe", {
        method: "POST",
        headers: { "content-type": "audio/wav" },
        body: "raw-audio-bytes",
      }),
    );

    const result = (await response.json()) as { echoedBody: string; contentType: string };
    expect(result.echoedBody).toBe("raw-audio-bytes");
    expect(result.contentType).toBe("audio/wav");
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
    // IPI-146: org resolution runs on every request now — this describe block
    // doesn't call setupMocks(), so it needs its own copy of these mocks too.
    mockOrgScopeDeps();

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

  it("warns (and does not throw) when getLocalAgents returns a non-MastraAgent entry, and still fixes the real agents", async () => {
    // Simulates a future @ag-ui/mastra shape change where getLocalAgents() returns
    // something that isn't a MastraAgent instance for one entry. Today this never
    // happens (getLocalAgents() only ever constructs MastraAgent instances), but the
    // route's `else` branch exists specifically to fail loud instead of silently
    // leaving that agent's emitInterruptOutcome at the vulnerable `true` default.
    const notAnAgent = { agentId: "rogue-agent", emitInterruptOutcome: true };
    const realAgent = new FakeMastraAgentWithRealCloneSemantics({ agentId: "test-agent" });
    vi.doMock("@ag-ui/mastra", () => ({
      MastraAgent: Object.assign(FakeMastraAgentWithRealCloneSemantics, {
        getLocalAgents: () => ({ "test-agent": realAgent, "rogue-agent": notAnAgent }),
      }),
    }));

    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const route = await import("@/app/api/copilotkit/[[...slug]]/route");

    await expect(route.GET(new Request("http://localhost/api/copilotkit"))).resolves.toBeInstanceOf(
      Response,
    );

    expect(realAgent.emitInterruptOutcome).toBe(false);
    expect(notAnAgent.emitInterruptOutcome).toBe(true); // untouched — confirms it was actually skipped
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining("rogue-agent"));
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining("IPI-760"));

    warnSpy.mockRestore();
  });
});
