import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const getLocalAgentsCalls: Array<{ resourceId: string; mastraAgents: string[] }> = [];
const mastraConstructorCalls: Array<{ agents: Record<string, unknown> }> = [];

beforeEach(() => {
  getLocalAgentsCalls.length = 0;
  mastraConstructorCalls.length = 0;
  vi.resetModules();
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

function setupMocks() {
  vi.doMock("@mastra/core/mastra", () => ({
    Mastra: vi.fn((opts: { agents: Record<string, unknown> }) => {
      mastraConstructorCalls.push(opts);
      return { agents: opts.agents };
    }),
  }));

  vi.doMock("@mastra/libsql", () => ({
    LibSQLStore: vi.fn(),
  }));

  vi.doMock("@/mastra/agents/public-marketing-agent", () => ({
    publicMarketingAgent: { id: "public-marketing" },
  }));

  vi.doMock("@ag-ui/mastra", () => ({
    MastraAgent: {
      getLocalAgents: vi.fn((opts: { resourceId: string; mastra: { agents: Record<string, unknown> } }) => {
        getLocalAgentsCalls.push({
          resourceId: opts.resourceId,
          mastraAgents: Object.keys(opts.mastra.agents),
        });
        return { "public-marketing": { id: "public-marketing" } };
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

describe("marketing-chat runtime — public isolation (IPI2-163)", () => {
  beforeEach(async () => {
    await setupMocks();
  });

  it("agent factory uses resourceId public (no operator identity)", async () => {
    await import("@/app/api/marketing-chat/[[...slug]]/route");

    const factory = (globalThis as Record<string, unknown>)
      .__capturedMarketingAgentFactory as () => unknown;
    expect(factory).toBeDefined();

    const agents = await factory();
    expect(agents).toHaveProperty("public-marketing");
    expect(getLocalAgentsCalls).toHaveLength(1);
    expect(getLocalAgentsCalls[0].resourceId).toBe("public");
  });

  it("constructs a local Mastra with only public-marketing (not the operator registry)", async () => {
    await import("@/app/api/marketing-chat/[[...slug]]/route");

    expect(mastraConstructorCalls).toHaveLength(1);
    expect(Object.keys(mastraConstructorCalls[0].agents)).toEqual(["public-marketing"]);

    const factory = (globalThis as Record<string, unknown>)
      .__capturedMarketingAgentFactory as () => unknown;
    await factory();
    expect(getLocalAgentsCalls[0].mastraAgents).toEqual(["public-marketing"]);
  });

  it("never exposes operator agent ids from getLocalAgents", async () => {
    await import("@/app/api/marketing-chat/[[...slug]]/route");

    const factory = (globalThis as Record<string, unknown>)
      .__capturedMarketingAgentFactory as () => Record<string, unknown>;
    const agents = await factory();

    expect(Object.keys(agents)).toEqual(["public-marketing"]);
    expect(agents).not.toHaveProperty("production-planner");
    expect(agents).not.toHaveProperty("creative-director");
    expect(agents).not.toHaveProperty("default");
  });
});
