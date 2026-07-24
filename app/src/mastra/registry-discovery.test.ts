/**
 * IPI-718 — unmocked Mastra registry discovery (no route mocks of getLocalAgents).
 * Uses MASTRA_STORAGE_MODE=noop so unit CI never opens a live Postgres pool.
 */
import { afterEach, describe, expect, it, vi } from "vitest";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe("IPI-718 · unmocked Mastra registry discovery", () => {
  it("getLocalAgents returns required operator agents without mocking @/mastra", async () => {
    vi.stubEnv("MASTRA_STORAGE_MODE", "noop");
    vi.stubEnv("MASTRA_SCHEMA", "mastra");
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("VERCEL", "1");
    vi.stubEnv(
      "DATABASE_URL",
      "postgresql://postgres:postgres@127.0.0.1:1/postgres?sslmode=disable",
    );

    const { getMastra } = await import("./index");
    const { MastraAgent } = await import("@ag-ui/mastra");

    const agents = await MastraAgent.getLocalAgents({ mastra: getMastra() });
    const ids = Object.keys(agents);

    expect(ids).toEqual(
      expect.arrayContaining([
        "default",
        "brand-intelligence",
        "creative-director",
        "production-planner",
      ]),
    );
  });

  it("agents registry export includes brand-intelligence and planner aliases", async () => {
    vi.stubEnv("MASTRA_STORAGE_MODE", "noop");
    const { agents, REQUIRED_AGENT_IDS } = await import("./index");
    for (const id of REQUIRED_AGENT_IDS) {
      expect(agents[id]).toBeDefined();
    }
    expect(agents["brand-intelligence"]).toBeDefined();
  });
});
