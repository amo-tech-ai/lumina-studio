import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mockAgents = {
  default: { id: "default" },
  "production-planner": { id: "production-planner" },
  "creative-director": { id: "creative-director" },
};

beforeEach(() => {
  vi.resetModules();
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

/** IPI-146 · MASTRA-GOV-002 — org resolution runs on every request now; these
 *  /info + SSE-normalization tests care about downstream behavior, not org
 *  scoping itself, so default to a successful org lookup unless a test
 *  overrides it. Thread ownership isn't exercised here (no `threadId` in any
 *  request body below). */
function mockOrgScopeDeps() {
  vi.doMock("@/lib/shoot/commit-shoot-draft", () => ({
    createUserScopedClient: vi.fn(() => ({})),
  }));
  vi.doMock("@/lib/crm/queries", () => ({
    getCurrentOrgId: vi.fn().mockResolvedValue("org-info-test"),
  }));
}

async function importRouteWithMocks() {
  vi.doMock("@/lib/operator-gate", async () => {
    const actual = await vi.importActual<typeof import("@/lib/operator-gate")>(
      "@/lib/operator-gate",
    );
    return {
      ...actual,
      withOperatorAuth: vi.fn().mockResolvedValue({
        id: "qa-user",
        email: "qa@ipix.test",
        name: "QA",
      }),
      isOperatorAuthEnforced: vi.fn(() => true),
    };
  });

  // IPI-146: route.ts now fails closed with 401 before org resolution when
  // extractAccessToken finds no token — these tests bypass real auth via the
  // withOperatorAuth mock above and never set a real Authorization header, so
  // extractAccessToken needs its own mock too (same pattern as
  // route.runtime.test.ts). These /info + SSE-normalization tests care about
  // downstream behavior, not the token itself.
  vi.doMock("@/lib/auth", async () => {
    const actual = await vi.importActual<typeof import("@/lib/auth")>("@/lib/auth");
    return {
      ...actual,
      extractAccessToken: vi.fn().mockReturnValue("info-test-token"),
    };
  });

  vi.doMock("@ag-ui/mastra", () => ({
    MastraAgent: {
      getLocalAgents: vi.fn().mockResolvedValue(mockAgents),
    },
  }));

  vi.doMock("@/mastra", () => ({
    getMastra: vi.fn(() => ({ agents: mockAgents })),
  }));

  mockOrgScopeDeps();

  return import("@/app/api/copilotkit/[[...slug]]/route");
}

describe("CopilotKit /info — SSE discovery (IPI-670 · COPILOT-RUNTIME-001)", () => {
  // Cold dynamic import under full-suite load often exceeds the default 5s.
  it(
    "returns 200 JSON with creative-director when Intelligence env is partial",
    async () => {
      vi.stubEnv("NODE_ENV", "production");
      vi.stubEnv("OPERATOR_AUTH_ENABLED", "true");
      vi.stubEnv("COPILOTKIT_LICENSE_TOKEN", "ck-partial-license");
      vi.stubEnv("INTELLIGENCE_API_KEY", "");
      vi.stubEnv("GEMINI_API_KEY", "test-key");

      const route = await importRouteWithMocks();
      const response = await route.GET(
        new Request("http://localhost/api/copilotkit/info"),
      );

      expect(response.status).toBe(200);
      expect(response.headers.get("content-type")).toMatch(/json/i);
      const body = (await response.json()) as { agents?: Record<string, unknown> };
      expect(body.agents?.["creative-director"]).toBeDefined();
      expect(body.agents?.["production-planner"]).toBeDefined();
      expect(body.agents?.default).toBeDefined();
    },
    15_000,
  );

  it("returns 503 JSON when the agent factory throws (not HTML 500)", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("OPERATOR_AUTH_ENABLED", "true");
    vi.stubEnv("GEMINI_API_KEY", "test-key");

    vi.doMock("@/lib/operator-gate", async () => {
      const actual = await vi.importActual<typeof import("@/lib/operator-gate")>(
        "@/lib/operator-gate",
      );
      return {
        ...actual,
        withOperatorAuth: vi.fn().mockResolvedValue({
          id: "qa-user",
          email: "qa@ipix.test",
          name: "QA",
        }),
        isOperatorAuthEnforced: vi.fn(() => true),
      };
    });

    vi.doMock("@ag-ui/mastra", () => ({
      MastraAgent: {
        getLocalAgents: vi.fn().mockRejectedValue(new Error("agent factory down")),
      },
    }));

    vi.doMock("@/mastra", () => ({
      getMastra: vi.fn(() => ({})),
    }));

    mockOrgScopeDeps();

    const route = await import("@/app/api/copilotkit/[[...slug]]/route");
    const response = await route.GET(
      new Request("http://localhost/api/copilotkit/info"),
    );

    expect(response.status).toBe(503);
    expect(response.headers.get("content-type")).toMatch(/json/i);
    const body = (await response.json()) as { code?: string };
    expect(body.code).toBe("runtime_error");
  });

  it("keeps upstream 503 JSON code/error but redacts detail in production (IPI-718)", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("OPERATOR_AUTH_ENABLED", "true");
    vi.stubEnv("GEMINI_API_KEY", "test-key");

    const existing = Response.json(
      { error: "already normalized", code: "runtime_error", detail: "upstream detail" },
      { status: 503 },
    );

    vi.doMock("@/lib/copilotkit/runtime-v2-fetch", () => ({
      CopilotRuntime: vi.fn(() => ({})),
      createCopilotRuntimeHandler: vi.fn(() => async () => existing),
      InMemoryAgentRunner: vi.fn(),
    }));

    const route = await importRouteWithMocks();
    const response = await route.GET(new Request("http://localhost/api/copilotkit/info"));

    expect(response.status).toBe(503);
    const body = (await response.json()) as { error?: string; code?: string; detail?: string };
    expect(body.error).toBe("already normalized");
    expect(body.code).toBe("runtime_error");
    expect(body.detail).toBeUndefined();
  });

  it("redacts unsafe internals from upstream 503 JSON in production", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("OPERATOR_AUTH_ENABLED", "true");
    vi.stubEnv("GEMINI_API_KEY", "test-key");

    const existing = Response.json(
      {
        error: "ERR_REQUIRE_ESM: require() of ES Module p-map",
        code: "runtime_error",
        detail: "Failed to load external module @mastra/pg",
        message: "require() of ES Module",
      },
      { status: 503 },
    );

    vi.doMock("@/lib/copilotkit/runtime-v2-fetch", () => ({
      CopilotRuntime: vi.fn(() => ({})),
      createCopilotRuntimeHandler: vi.fn(() => async () => existing),
      InMemoryAgentRunner: vi.fn(),
    }));

    const route = await importRouteWithMocks();
    const response = await route.GET(new Request("http://localhost/api/copilotkit/info"));

    expect(response.status).toBe(503);
    const body = (await response.json()) as {
      error?: string;
      code?: string;
      detail?: string;
      message?: string;
    };
    expect(body.code).toBe("runtime_error");
    expect(body.error).toBe("CopilotKit runtime unavailable");
    expect(body.detail).toBeUndefined();
    expect(body.message).toBeUndefined();
    expect(JSON.stringify(body)).not.toMatch(/ERR_REQUIRE_ESM|p-map|@mastra\/pg/);
  });

  it("does not expose internal error detail to clients in production (IPI-718)", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("OPERATOR_AUTH_ENABLED", "true");
    vi.stubEnv("GEMINI_API_KEY", "test-key");

    const upstream = Response.json(
      { message: "ERR_REQUIRE_ESM: require() of ES Module p-map" },
      { status: 500, headers: { "content-type": "application/json" } },
    );

    vi.doMock("@/lib/copilotkit/runtime-v2-fetch", () => ({
      CopilotRuntime: vi.fn(() => ({})),
      createCopilotRuntimeHandler: vi.fn(() => async () => upstream),
      InMemoryAgentRunner: vi.fn(),
    }));

    const route = await importRouteWithMocks();
    const response = await route.GET(new Request("http://localhost/api/copilotkit/info"));

    expect(response.status).toBe(503);
    const body = (await response.json()) as { code?: string; detail?: string };
    expect(body.code).toBe("runtime_error");
    expect(body.detail).toBeUndefined();
  });

  it("exposes safe error detail when wrapping opaque 5xx JSON outside production", async () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("OPERATOR_AUTH_ENABLED", "true");
    vi.stubEnv("GEMINI_API_KEY", "test-key");

    const upstream = Response.json(
      { message: "agent factory down" },
      { status: 500, headers: { "content-type": "application/json" } },
    );

    vi.doMock("@/lib/copilotkit/runtime-v2-fetch", () => ({
      CopilotRuntime: vi.fn(() => ({})),
      createCopilotRuntimeHandler: vi.fn(() => async () => upstream),
      InMemoryAgentRunner: vi.fn(),
    }));

    const route = await importRouteWithMocks();
    const response = await route.GET(new Request("http://localhost/api/copilotkit/info"));

    expect(response.status).toBe(503);
    const body = (await response.json()) as { code?: string; detail?: string };
    expect(body.code).toBe("runtime_error");
    expect(body.detail).toBe("agent factory down");
  });

  it("cancels a 5xx SSE body when normalizing to 503 JSON", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("OPERATOR_AUTH_ENABLED", "true");
    vi.stubEnv("GEMINI_API_KEY", "test-key");
    vi.stubEnv("MASTRA_STORAGE_MODE", "noop");

    const cancel = vi.fn().mockResolvedValue(undefined);
    const sseResponse = new Response(
      new ReadableStream({
        cancel(reason) {
          cancel(reason);
          return Promise.resolve();
        },
      }),
      {
        status: 500,
        headers: { "content-type": "text/event-stream" },
      },
    );

    vi.doMock("@/lib/copilotkit/runtime-v2-fetch", () => ({
      CopilotRuntime: vi.fn(() => ({})),
      createCopilotRuntimeHandler: vi.fn(() => async () => sseResponse),
      InMemoryAgentRunner: vi.fn(),
    }));

    const route = await importRouteWithMocks();
    const response = await route.POST(
      new Request("http://localhost/api/copilotkit/agent/default/run", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ messages: [] }),
      }),
    );

    expect(response.status).toBe(503);
    expect(response.headers.get("content-type")).toMatch(/json/i);
    expect(cancel).toHaveBeenCalledOnce();
    const body = (await response.json()) as { code?: string };
    expect(body.code).toBe("runtime_error");
  });

  it("returns 200 JSON on /info when DATABASE_URL is missing in production (lazy storage)", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("DATABASE_URL", "");
    vi.stubEnv("OPERATOR_AUTH_ENABLED", "true");
    vi.stubEnv("GEMINI_API_KEY", "test-key");

    vi.doMock("@/lib/copilotkit/runtime-v2-fetch", () => ({
      CopilotRuntime: vi.fn(() => ({})),
      createCopilotRuntimeHandler: vi.fn(
        () => async () => Response.json({ agents: mockAgents }, { status: 200 }),
      ),
      InMemoryAgentRunner: vi.fn(),
    }));

    const route = await importRouteWithMocks();
    const response = await route.GET(
      new Request("http://localhost/api/copilotkit/info"),
    );

    expect(response.status).toBe(200);
    const body = (await response.json()) as { agents?: Record<string, unknown> };
    expect(body.agents?.default).toBeDefined();
  });

  it("returns 503 storage_unavailable JSON when agent run needs storage but DATABASE_URL is missing", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("VERCEL", "1");
    // Clear CI so this matches real Vercel runtime (not GitHub Actions builds).
    vi.stubEnv("CI", "");
    // Clear both — production prefers MASTRA_DATABASE_URL; leaving it set from
    // the local env makes this test pass 200 instead of 503 in full-suite runs.
    vi.stubEnv("DATABASE_URL", "");
    vi.stubEnv("MASTRA_DATABASE_URL", "");
    vi.stubEnv("OPERATOR_AUTH_ENABLED", "true");
    vi.stubEnv("GEMINI_API_KEY", "test-key");

    const route = await importRouteWithMocks();
    const response = await route.POST(
      new Request("http://localhost/api/copilotkit/agent/default/run", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ messages: [] }),
      }),
    );

    expect(response.status).toBe(503);
    const body = (await response.json()) as { code?: string; degraded?: boolean };
    expect(body.code).toBe("storage_unavailable");
    expect(body.degraded).toBe(true);
  });

  it("returns 200 on /info and skips DB lookup entirely — getCurrentOrgId is never called (IPI-955)", async () => {
    // This test verifies the fix: /info skips org lookup entirely to eliminate
    // cold-start 503s. getCurrentOrgId should never be called for discovery.
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("OPERATOR_AUTH_ENABLED", "true");
    vi.stubEnv("GEMINI_API_KEY", "test-key");

    vi.doMock("@/lib/operator-gate", async () => {
      const actual = await vi.importActual<typeof import("@/lib/operator-gate")>(
        "@/lib/operator-gate",
      );
      return {
        ...actual,
        withOperatorAuth: vi.fn().mockResolvedValue({
          id: "qa-user",
          email: "qa@ipix.test",
          name: "QA",
        }),
        isOperatorAuthEnforced: vi.fn(() => true),
      };
    });

    vi.doMock("@/lib/auth", async () => {
      const actual = await vi.importActual<typeof import("@/lib/auth")>("@/lib/auth");
      return {
        ...actual,
        extractAccessToken: vi.fn().mockReturnValue("info-skip-token"),
      };
    });

    const getOrgSpy = vi.fn().mockResolvedValue("org-test-123");
    vi.doMock("@/lib/crm/queries", () => ({
      getCurrentOrgId: getOrgSpy,
    }));

    // Wire CopilotRuntime to capture and invoke the agents factory
    let capturedAgentsFactory: (() => Promise<unknown>) | undefined;
    vi.doMock("@/lib/copilotkit/runtime-v2-fetch", () => ({
      CopilotRuntime: vi.fn(function (this: unknown, config: { agents: () => Promise<unknown> }) {
        capturedAgentsFactory = config.agents;
      }),
      createCopilotRuntimeHandler: vi.fn(() => async () => {
        if (capturedAgentsFactory) await capturedAgentsFactory();
        return Response.json({ agents: mockAgents }, { status: 200 });
      }),
      InMemoryAgentRunner: vi.fn(),
    }));

    vi.doMock("@ag-ui/mastra", () => ({
      MastraAgent: { getLocalAgents: vi.fn().mockResolvedValue(mockAgents) },
    }));

    vi.doMock("@/mastra", () => ({
      getMastra: vi.fn(() => ({ agents: mockAgents })),
    }));

    const { MastraAgent } = await import("@ag-ui/mastra");
    const route = await import("@/app/api/copilotkit/[[...slug]]/route");
    const response = await route.GET(
      new Request("http://localhost/api/copilotkit/info"),
    );

    expect(response.status).toBe(200);
    const body = (await response.json()) as { agents?: Record<string, unknown> };
    expect(body.agents?.default).toBeDefined();
    // Verify org lookup was skipped — getCurrentOrgId never called for /info
    expect(getOrgSpy).not.toHaveBeenCalled();
    // getLocalAgents called with bare user.id as placeholder resourceId
    expect(MastraAgent.getLocalAgents).toHaveBeenCalledWith(
      expect.objectContaining({ resourceId: "qa-user" }),
    );
  }, 15_000);

  it("agent run still calls resolveOrgScopedResourceId and fails closed when org is missing", async () => {
    // /info has a clean skip; agent turns use the original
    // resolveOrgScopedResourceId unchanged — no org → 403 org_required.
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("OPERATOR_AUTH_ENABLED", "true");
    vi.stubEnv("GEMINI_API_KEY", "test-key");
    vi.stubEnv("MASTRA_STORAGE_MODE", "noop");

    vi.doMock("@/lib/operator-gate", async () => {
      const actual = await vi.importActual<typeof import("@/lib/operator-gate")>(
        "@/lib/operator-gate",
      );
      return {
        ...actual,
        withOperatorAuth: vi.fn().mockResolvedValue({
          id: "no-org-user",
          email: "noorg@ipix.test",
          name: "No Org",
        }),
        isOperatorAuthEnforced: vi.fn(() => true),
      };
    });

    vi.doMock("@/lib/auth", async () => {
      const actual = await vi.importActual<typeof import("@/lib/auth")>("@/lib/auth");
      return {
        ...actual,
        extractAccessToken: vi.fn().mockReturnValue("no-org-agent-token"),
      };
    });

    vi.doMock("@ag-ui/mastra", () => ({
      MastraAgent: { getLocalAgents: vi.fn().mockResolvedValue(mockAgents) },
    }));

    vi.doMock("@/mastra", () => ({
      getMastra: vi.fn(() => ({ agents: mockAgents })),
    }));

    vi.doMock("@/lib/shoot/commit-shoot-draft", () => ({
      createUserScopedClient: vi.fn(() => ({})),
    }));

    vi.doMock("@/lib/crm/queries", () => ({
      getCurrentOrgId: vi.fn().mockResolvedValue(null),
    }));

    vi.doMock("@/lib/copilotkit/runtime-v2-fetch", () => ({
      CopilotRuntime: vi.fn(() => ({})),
      createCopilotRuntimeHandler: vi.fn(
        () => async () => Response.json({ agents: mockAgents }, { status: 200 }),
      ),
      InMemoryAgentRunner: vi.fn(),
    }));

    const route = await import("@/app/api/copilotkit/[[...slug]]/route");
    const response = await route.POST(
      new Request("http://localhost/api/copilotkit/agent/default/run", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ messages: [] }),
      }),
    );

    expect(response.status).toBe(403);
    const body = (await response.json()) as { code?: string };
    expect(body.code).toBe("org_required");
  }, 15_000);
});
