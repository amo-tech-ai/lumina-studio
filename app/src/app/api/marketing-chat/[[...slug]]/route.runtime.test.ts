import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const getLocalAgentsCalls: Array<{ mastraId: string; resourceId: string }> = [];

beforeEach(() => {
  getLocalAgentsCalls.length = 0;
  vi.resetModules();
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

function setupMocks() {
  const publicMastra = { id: "public-marketing-mastra" };

  vi.doMock("@/mastra/agents/public-marketing-agent", () => ({
    publicMarketingAgent: { id: "public-marketing" },
  }));

  vi.doMock("@mastra/core/mastra", () => ({
    Mastra: vi.fn(() => publicMastra),
  }));

  vi.doMock("@mastra/libsql", () => ({
    LibSQLStore: vi.fn(),
  }));

  vi.doMock("@ag-ui/mastra", () => ({
    MastraAgent: {
      getLocalAgents: vi.fn((opts: { mastra: { id: string }; resourceId: string }) => {
        getLocalAgentsCalls.push({
          mastraId: opts.mastra.id,
          resourceId: opts.resourceId,
        });
        return { "public-marketing": {} };
      }),
    },
  }));

  vi.doMock("@copilotkit/runtime/v2", () => ({
    CopilotRuntime: vi.fn((config: { agents: () => unknown }) => {
      (globalThis as Record<string, unknown>).__capturedMarketingAgentFactory =
        config.agents;
      return {};
    }),
    createCopilotEndpoint: vi.fn(() => ({})),
    InMemoryAgentRunner: vi.fn(),
  }));

  vi.doMock("hono/vercel", () => ({
    handle: vi.fn(() => vi.fn().mockResolvedValue(new Response("ok"))),
  }));
}

describe("marketing-chat runtime — public agent isolation (IPI2-163)", () => {
  beforeEach(() => {
    setupMocks();
  });

  it("wires getLocalAgents with publicMastra and resourceId public", async () => {
    await import("@/app/api/marketing-chat/[[...slug]]/route");

    const factory = (globalThis as Record<string, unknown>)
      .__capturedMarketingAgentFactory as () => Record<string, unknown>;
    expect(factory).toBeDefined();

    const agents = factory();
    expect(agents).toHaveProperty("public-marketing");
    expect(Object.keys(agents)).toEqual(["public-marketing"]);

    expect(getLocalAgentsCalls).toHaveLength(1);
    expect(getLocalAgentsCalls[0].mastraId).toBe("public-marketing-mastra");
    expect(getLocalAgentsCalls[0].resourceId).toBe("public");
  });

  it("does not import the shared operator Mastra registry", async () => {
    const mastraModule = await import("@/mastra");
    expect(mastraModule.agents).toHaveProperty("production-planner");
    expect(mastraModule.agents).toHaveProperty("creative-director");

    await import("@/app/api/marketing-chat/[[...slug]]/route");

    const factory = (globalThis as Record<string, unknown>)
      .__capturedMarketingAgentFactory as () => Record<string, unknown>;
    const agentKeys = Object.keys(factory());
    expect(agentKeys).not.toContain("production-planner");
    expect(agentKeys).not.toContain("creative-director");
    expect(agentKeys).not.toContain("default");
  });
});
