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

  vi.doMock("@ag-ui/mastra", () => ({
    MastraAgent: {
      getLocalAgents: vi.fn().mockResolvedValue(mockAgents),
    },
  }));

  vi.doMock("@/mastra", () => ({
    getMastra: vi.fn(() => ({ agents: mockAgents })),
  }));

  return import("@/app/api/copilotkit/[[...slug]]/route");
}

describe("CopilotKit /info — SSE discovery (IPI-670 · COPILOT-RUNTIME-001)", () => {
  it("returns 200 JSON with creative-director when Intelligence env is partial", async () => {
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
  });

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

    const route = await import("@/app/api/copilotkit/[[...slug]]/route");
    const response = await route.GET(
      new Request("http://localhost/api/copilotkit/info"),
    );

    expect(response.status).toBe(503);
    expect(response.headers.get("content-type")).toMatch(/json/i);
    const body = (await response.json()) as { code?: string };
    expect(body.code).toBe("runtime_error");
  });

  it("cancels a 5xx SSE body when normalizing to 503 JSON", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("OPERATOR_AUTH_ENABLED", "true");
    vi.stubEnv("GEMINI_API_KEY", "test-key");

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
});
