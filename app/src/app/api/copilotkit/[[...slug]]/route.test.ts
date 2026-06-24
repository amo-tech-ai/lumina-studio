import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mockEndpoint = vi.fn((_request: Request) => new Response("ok", { status: 200 }));
const resolveOperatorUser = vi.fn();

vi.mock("hono/vercel", () => ({
  handle: () => mockEndpoint,
}));

vi.mock("@copilotkit/runtime/v2", () => ({
  CopilotRuntime: vi.fn(),
  createCopilotEndpoint: vi.fn(() => ({})),
  InMemoryAgentRunner: vi.fn(),
  CopilotKitIntelligence: vi.fn(),
}));

vi.mock("@ag-ui/mastra", () => ({
  MastraAgent: { getLocalAgents: vi.fn(() => ({})) },
}));

vi.mock("@/mastra", () => ({ mastra: {} }));

vi.mock("@/lib/auth", () => ({
  resolveOperatorUser,
}));

describe("copilotkit route — requireOperator HTTP gate (IPI2-127)", () => {
  beforeEach(() => {
    vi.resetModules();
    mockEndpoint.mockClear();
    resolveOperatorUser.mockReset();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  async function loadHandlers() {
    const mod = await import("./route");
    return { GET: mod.GET, POST: mod.POST };
  }

  it("passes through to the CopilotKit endpoint when auth is disabled", async () => {
    vi.stubEnv("OPERATOR_AUTH_ENABLED", "false");
    const { GET } = await loadHandlers();
    const request = new Request("http://localhost:3002/api/copilotkit");

    const response = await GET(request);

    expect(response.status).toBe(200);
    expect(mockEndpoint).toHaveBeenCalledWith(request);
    expect(resolveOperatorUser).not.toHaveBeenCalled();
  });

  it("passes through when auth is enabled and the operator session validates", async () => {
    vi.stubEnv("OPERATOR_AUTH_ENABLED", "true");
    resolveOperatorUser.mockResolvedValue({ id: "user-1", name: "Operator" });
    const { GET } = await loadHandlers();
    const request = new Request("http://localhost:3002/api/copilotkit", {
      headers: { authorization: "Bearer valid.jwt" },
    });

    const response = await GET(request);

    expect(response.status).toBe(200);
    expect(resolveOperatorUser).toHaveBeenCalledWith(request);
    expect(mockEndpoint).toHaveBeenCalledWith(request);
  });

  it("returns 401 (fails closed) when auth is enabled and identity resolution throws", async () => {
    vi.stubEnv("OPERATOR_AUTH_ENABLED", "true");
    resolveOperatorUser.mockRejectedValue(new Error("failing closed"));
    const { GET } = await loadHandlers();
    const request = new Request("http://localhost:3002/api/copilotkit");

    const response = await GET(request);

    expect(response.status).toBe(401);
    expect(await response.text()).toBe("Unauthorized");
    expect(mockEndpoint).not.toHaveBeenCalled();
  });

  it("applies the same gate to POST as GET", async () => {
    vi.stubEnv("OPERATOR_AUTH_ENABLED", "true");
    resolveOperatorUser.mockRejectedValue(new Error("failing closed"));
    const { POST } = await loadHandlers();
    const request = new Request("http://localhost:3002/api/copilotkit", {
      method: "POST",
    });

    const response = await POST(request);

    expect(response.status).toBe(401);
    expect(mockEndpoint).not.toHaveBeenCalled();
  });
});
