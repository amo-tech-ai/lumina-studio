import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  HD_THREAD_CANARY_FAILURE_THRESHOLD,
  recordCanaryFailure,
  resetCanaryCircuitForTests,
} from "@/lib/db/hyperdrive-thread-canary";

const getCloudflareContext = vi.hoisted(() => vi.fn());
const waitUntil = vi.hoisted(() => vi.fn());

vi.mock("@opennextjs/cloudflare", () => ({
  getCloudflareContext,
}));

// after() needs a Next request scope — run inline in unit tests.
vi.mock("next/server", async (importOriginal) => {
  const actual = await importOriginal<typeof import("next/server")>();
  return { ...actual, after: (fn: () => unknown) => fn() };
});

function req(body?: unknown, headers: Record<string, string> = {}) {
  return new Request("http://localhost/api/internal/hyperdrive-thread-canary", {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

describe("POST /api/internal/hyperdrive-thread-canary", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
    getCloudflareContext.mockReset();
    waitUntil.mockReset();
    resetCanaryCircuitForTests();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.doUnmock("@mastra/pg");
    vi.resetModules();
    vi.restoreAllMocks();
    resetCanaryCircuitForTests();
  });

  function mockCfEnv(env: Record<string, unknown>) {
    getCloudflareContext.mockResolvedValue({
      env,
      ctx: { waitUntil },
    });
  }

  it("returns 404 when ENABLE_HYPERDRIVE_THREAD_CANARY is not true", async () => {
    mockCfEnv({ ENABLE_HYPERDRIVE_THREAD_CANARY: "false" });
    const { POST } = await import("./route");

    const res = await POST(
      req({ resourceId: "org-a" }, { "X-Internal-Secret": "secret" }),
    );
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.error).toBe("not_found");
  });

  const enabledEnv = {
    ENABLE_HYPERDRIVE_THREAD_CANARY: "true",
    INTERNAL_WEBHOOK_SECRET: "expected",
    HYPERDRIVE_FRESH: { connectionString: "postgres://user:pass@127.0.0.1:5432/db" },
  };

  it("returns 401 when X-Internal-Secret is missing or wrong (never exposes rolledBack)", async () => {
    mockCfEnv(enabledEnv);
    for (let i = 0; i < HD_THREAD_CANARY_FAILURE_THRESHOLD; i++) {
      recordCanaryFailure();
    }
    const { POST } = await import("./route");

    const missing = await POST(req({ resourceId: "org-a" }));
    const missingBody = await missing.json();
    expect(missing.status).toBe(401);
    expect(missingBody.error).toBe("unauthorized");
    expect(missingBody.rolledBack).toBeUndefined();

    const wrong = await POST(
      req({ resourceId: "org-a" }, { "X-Internal-Secret": "wrong" }),
    );
    const wrongBody = await wrong.json();
    expect(wrong.status).toBe(401);
    expect(wrongBody.error).toBe("unauthorized");
    expect(wrongBody.rolledBack).toBeUndefined();
  });

  it("returns 503 canary_rolled_back when isolate circuit is open (after auth)", async () => {
    mockCfEnv(enabledEnv);
    for (let i = 0; i < HD_THREAD_CANARY_FAILURE_THRESHOLD; i++) {
      recordCanaryFailure();
    }
    const { POST } = await import("./route");

    const res = await POST(
      req({ resourceId: "org-a" }, { "X-Internal-Secret": "expected" }),
    );
    const body = await res.json();

    expect(res.status).toBe(503);
    expect(body.error).toBe("canary_rolled_back");
    expect(body.rolledBack).toBe(true);
  });

  it("returns 400 when resourceId is missing", async () => {
    mockCfEnv(enabledEnv);
    vi.doMock("@mastra/pg", () => ({
      PostgresStore: vi.fn(),
      IPIX_CF_MASTRA_PG_STUB: false,
    }));
    const { POST } = await import("./route");

    const res = await POST(req({}, { "X-Internal-Secret": "expected" }));
    expect(res.status).toBe(400);
  });

  it("returns 400 resource_id_required for null JSON body", async () => {
    mockCfEnv(enabledEnv);
    vi.doMock("@mastra/pg", () => ({
      PostgresStore: vi.fn(),
      IPIX_CF_MASTRA_PG_STUB: false,
    }));
    const { POST } = await import("./route");

    const res = await POST(req(null, { "X-Internal-Secret": "expected" }));
    const body = await res.json();
    expect(res.status).toBe(400);
    expect(body.error).toBe("resource_id_required");
  });

  it("returns 503 when Hyperdrive binding is missing", async () => {
    mockCfEnv({
      ENABLE_HYPERDRIVE_THREAD_CANARY: "true",
      INTERNAL_WEBHOOK_SECRET: "expected",
    });
    const { POST } = await import("./route");

    const res = await POST(
      req({ resourceId: "org-a" }, { "X-Internal-Secret": "expected" }),
    );
    const body = await res.json();

    expect(res.status).toBe(503);
    expect(body.error).toBe("hyperdrive_binding_missing");
  });

  it("runs create→immediate-read and caps concurrent mode at 3", async () => {
    mockCfEnv(enabledEnv);

    const closeSpy = vi.fn(async () => undefined);
    const ctor = vi.fn(function FakePostgresStore(this: unknown) {});
    // Each getStore returns a fresh memory that tracks save
    ctor.prototype.getStore = vi.fn(async () => {
      let saved: { id: string; resourceId: string } | null = null;
      return {
        saveThread: vi.fn(async ({ thread }: { thread: { id: string; resourceId: string } }) => {
          saved = { id: thread.id, resourceId: thread.resourceId };
          return thread;
        }),
        getThreadById: vi.fn(async ({ threadId }: { threadId: string }) => {
          if (!saved) return null;
          return saved.id === threadId ? saved : null;
        }),
        deleteThread: vi.fn(async () => {
          saved = null;
        }),
      };
    });
    ctor.prototype.close = closeSpy;
    vi.doMock("@mastra/pg", () => ({ PostgresStore: ctor, IPIX_CF_MASTRA_PG_STUB: false }));

    const { POST } = await import("./route");
    const res = await POST(
      req(
        { mode: "concurrent", concurrency: 99, resourceId: "org-a" },
        { "X-Internal-Secret": "expected" },
      ),
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.concurrency).toBe(3);
    expect(body.maxConcurrency).toBe(3);
    expect(body.workload).toBe("create_thread_immediate_read");
    expect(body.successCount).toBe(3);
    expect(body.crossTenantCount).toBe(0);
    expect(body.p95LatencyMs).toEqual(expect.any(Number));
    expect(closeSpy).toHaveBeenCalledTimes(3);
  });

  it("registers timeout cleanup with ctx.waitUntil", async () => {
    const backgroundWork = Promise.resolve();
    vi.doMock("@/lib/db/hyperdrive-thread-canary", async (importOriginal) => {
      const actual = await importOriginal<typeof import("@/lib/db/hyperdrive-thread-canary")>();
      return {
        ...actual,
        createThreadImmediateRead: vi.fn(async () => ({
          result: {
            ok: false,
            threadId: "t1",
            resourceId: "org-a",
            matched: false,
            wrote: false,
            duplicateWrite: false,
            cleanedUp: false,
            latencyMs: 40,
            errorClass: "timeout" as const,
            error: "timeout",
            crossTenant: false,
          },
          backgroundWork,
        })),
      };
    });
    mockCfEnv(enabledEnv);
    const { POST } = await import("./route");
    const res = await POST(
      req({ resourceId: "org-a" }, { "X-Internal-Secret": "expected" }),
    );
    expect(res.status).toBe(502);
    expect(waitUntil).toHaveBeenCalledTimes(1);
    expect(waitUntil.mock.calls[0]?.[0]).toBeInstanceOf(Promise);
  });
});
