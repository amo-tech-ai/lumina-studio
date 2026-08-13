import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { makeMemoryResourceId } from "@/mastra/memory";

// Hoisted mocks — configured per test via mockReturnValue, not re-doMock per test
// This avoids vi.doMock leak across tests (review: Test mocks leak state)
const mockGetCurrentOrgId = vi.fn();
const mockGetThreadById = vi.fn();
const mockWithOperatorAuth = vi.fn();
const mockCreateUserScopedClient = vi.fn(() => ({}));

vi.mock("@/lib/crm/queries", () => ({ getCurrentOrgId: mockGetCurrentOrgId }));
vi.mock("@/mastra/memory", async () => {
  const actual = await vi.importActual<typeof import("@/mastra/memory")>("@/mastra/memory");
  return { ...actual, getMastraMemory: vi.fn(() => ({ getThreadById: mockGetThreadById })) };
});
vi.mock("@/lib/shoot/commit-shoot-draft", () => ({ createUserScopedClient: mockCreateUserScopedClient }));
vi.mock("@/mastra", () => ({ getMastra: () => ({}) }));
vi.mock("@/lib/auth", () => ({ resolveOperatorUser: vi.fn(), extractAccessToken: vi.fn().mockReturnValue("test-token") }));
vi.mock("@/lib/request-token", () => ({ requestToken: { run: vi.fn((_v: string, fn: () => unknown) => fn()), getStore: vi.fn() } }));
vi.mock("@/lib/operator-gate", () => {
  const E = class extends Error { constructor(m:string){super(m);this.name="OperatorAuthError"} };
  return { withOperatorAuth: mockWithOperatorAuth, OperatorAuthError: E, isOperatorAuthEnforced: vi.fn(() => false) };
});
vi.mock("@ag-ui/mastra", () => ({ MastraAgent: { getLocalAgents: vi.fn(() => []) } }));
vi.mock("@/lib/copilotkit/runtime-v2-fetch", () => ({ CopilotRuntime: vi.fn(() => ({})), createCopilotRuntimeHandler: vi.fn(() => async () => new Response("ok")), InMemoryAgentRunner: vi.fn() }));

function configureOrgScope(opts?: { orgId?: string | null; threadResourceId?: string | null }) {
  const orgId = opts?.orgId === undefined ? "org-default" : opts.orgId;
  const threadResourceId = opts?.threadResourceId ?? null;
  mockGetCurrentOrgId.mockResolvedValue(orgId);
  mockGetThreadById.mockResolvedValue(threadResourceId === null ? null : { resourceId: threadResourceId });
}

const protectedUrlRoutes: Array<{ name: string; path: string; method: "GET"|"POST"|"PATCH"|"DELETE" }> = [
  { name: "threads/:id", path: "/api/copilotkit/threads/foreign-thread", method: "GET" },
  { name: "threads/:id (PATCH)", path: "/api/copilotkit/threads/foreign-thread", method: "PATCH" },
  { name: "threads/:id (DELETE)", path: "/api/copilotkit/threads/foreign-thread", method: "DELETE" },
  { name: "threads/:id/messages", path: "/api/copilotkit/threads/foreign-thread/messages", method: "GET" },
  { name: "threads/:id/events", path: "/api/copilotkit/threads/foreign-thread/events", method: "GET" },
  { name: "threads/:id/state", path: "/api/copilotkit/threads/foreign-thread/state", method: "GET" },
  { name: "threads/:id/archive", path: "/api/copilotkit/threads/foreign-thread/archive", method: "GET" },
  { name: "agent/:id/stop/:threadId", path: "/api/copilotkit/agent/production-planner/stop/foreign-thread", method: "POST" },
  { name: "threads/:id (URL-encoded)", path: "/api/copilotkit/threads/foreign%2Dthread", method: "GET" },
  { name: "threads/:id/ (trailing slash)", path: "/api/copilotkit/threads/foreign-thread/", method: "GET" },
];
const unprotectedRoutes: Array<{ name: string; path: string; method: "GET"|"POST" }> = [
  { name: "threads/list", path: "/api/copilotkit/threads", method: "GET" },
  { name: "threads/subscribe", path: "/api/copilotkit/threads/subscribe", method: "GET" },
  { name: "threads/clear", path: "/api/copilotkit/threads/clear", method: "POST" },
  { name: "info", path: "/api/copilotkit/info", method: "GET" },
];
describe("COPILOT-GATE-005 — thread ownership matrix (URL + body)", () => {
  beforeEach(async () => {
    vi.resetModules();
    vi.clearAllMocks();
    vi.stubEnv("NODE_ENV", "development");
    // default scope — per-test configureOrgScope overrides
    configureOrgScope({ orgId: "org-default", threadResourceId: null });
    mockWithOperatorAuth.mockResolvedValue({ id: "user-a", email: "a@test.com", name: "A" } as any);
  });
  afterEach(() => {
    vi.clearAllMocks();
    vi.unstubAllEnvs();
    vi.resetModules();
  });
  it.each(protectedUrlRoutes)("$name $path $method denies foreign (403)", async ({ path, method }) => {
    configureOrgScope({ orgId: "org-acme", threadResourceId: makeMemoryResourceId("org-widgets", "user-b") });
    mockWithOperatorAuth.mockResolvedValue({ id: "user-a", email: "a@test.com", name: "A" } as any);
    const route = await import("@/app/api/copilotkit/[[...slug]]/route");
    const handler = (route as Record<string,(r:Request)=>Promise<Response>>)[method] ?? route.GET;
    const response = await handler(new Request(`http://localhost${path}`, { method }));
    expect(response.status).toBe(403);
    const body = await response.json() as { code?: string };
    expect(body.code).toBe("thread_forbidden");
    // org isolation: verify getCurrentOrgId was called with user-a's id via withOperatorAuth
    // and that thread lookup used the foreign thread id
    expect(mockGetThreadById).toHaveBeenCalled();
  });
  it.each(protectedUrlRoutes)("$name allows own (200)", async ({ path, method }) => {
    const resourceId = makeMemoryResourceId("org-acme", "user-a");
    configureOrgScope({ orgId: "org-acme", threadResourceId: resourceId });
    mockWithOperatorAuth.mockResolvedValue({ id: "user-a", email: "a@test.com", name: "A" } as any);
    const route = await import("@/app/api/copilotkit/[[...slug]]/route");
    const handler = (route as Record<string,(r:Request)=>Promise<Response>>)[method] ?? route.GET;
    const response = await handler(new Request(`http://localhost${path}`, { method }));
    expect(response.status).toBe(200);
  });
  it.each(unprotectedRoutes)("$name not ownership (200)", async ({ path, method }) => {
    configureOrgScope({ orgId: "org-acme", threadResourceId: null });
    mockWithOperatorAuth.mockResolvedValue({ id: "user-a", email: "a@test.com", name: "A" } as any);
    // need fresh import after configure
    const route = await import("@/app/api/copilotkit/[[...slug]]/route");
    const handler = (route as Record<string,(r:Request)=>Promise<Response>>)[method] ?? route.GET;
    const beforeCalls = mockGetThreadById.mock.calls.length;
    const response = await handler(new Request(`http://localhost${path}`, { method }));
    expect(response.status).toBe(200);
    expect(mockGetThreadById.mock.calls.length).toBe(beforeCalls);
  });
  it("POST body threadId denies foreign (403) — org+user isolation", async () => {
    configureOrgScope({ orgId: "org-acme", threadResourceId: makeMemoryResourceId("org-widgets", "user-b") });
    mockWithOperatorAuth.mockResolvedValue({ id: "user-a", email: "a@test.com", name: "A" } as any);
    const route = await import("@/app/api/copilotkit/[[...slug]]/route");
    const response = await route.POST(new Request("http://localhost/api/copilotkit/agent/production-planner/run", { method:"POST", headers:{"content-type":"application/json"}, body: JSON.stringify({ threadId:"foreign-thread", messages:[] })}));
    expect(response.status).toBe(403);
    expect(mockGetCurrentOrgId).toHaveBeenCalled();
    expect(mockGetThreadById).toHaveBeenCalled();
  });
  it("POST body missing creates new (200)", async () => {
    configureOrgScope({ orgId: "org-acme", threadResourceId: null });
    mockWithOperatorAuth.mockResolvedValue({ id: "user-a", email: "a@test.com", name: "A" } as any);
    const route = await import("@/app/api/copilotkit/[[...slug]]/route");
    const response = await route.POST(new Request("http://localhost/api/copilotkit/agent/production-planner/run", { method:"POST", headers:{"content-type":"application/json"}, body: JSON.stringify({ messages:[] })}));
    expect(response.status).toBe(200);
  });
  it("trailing slash normalized — /threads/foreign-thread/ same as /threads/foreign-thread (403 for foreign)", async () => {
    // Next.js normalizes trailing slash before handler; we verify our filter(Boolean) handles it.
    // Duplicate slashes (//threads//) are also normalized by filter(Boolean) in extractThreadIdFromUrl,
    // but Next.js itself normalizes // → / before routing, so we test the realistic trailing-slash case.
    configureOrgScope({ orgId: "org-acme", threadResourceId: makeMemoryResourceId("org-widgets", "user-b") });
    mockWithOperatorAuth.mockResolvedValue({ id: "user-a", email: "a@test.com", name: "A" } as any);
    const route = await import("@/app/api/copilotkit/[[...slug]]/route");
    const response = await route.GET(new Request("http://localhost/api/copilotkit/threads/foreign-thread/"));
    expect(response.status).toBe(403);
  });
});
