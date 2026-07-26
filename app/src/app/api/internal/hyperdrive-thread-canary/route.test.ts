import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  HD_THREAD_CANARY_FAILURE_THRESHOLD,
  recordCanaryFailure,
  resetCanaryCircuitForTests,
} from "@/lib/db/hyperdrive-thread-canary";

const getCloudflareContext = vi.hoisted(() => vi.fn());

vi.mock("@opennextjs/cloudflare", () => ({
  getCloudflareContext,
}));

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
    resetCanaryCircuitForTests();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.doUnmock("@mastra/pg");
    vi.resetModules();
    vi.restoreAllMocks();
    resetCanaryCircuitForTests();
  });

  it("returns 404 when ENABLE_HYPERDRIVE_THREAD_CANARY is not true", async () => {
    getCloudflareContext.mockResolvedValue({
      env: { ENABLE_HYPERDRIVE_THREAD_CANARY: "false" },
    });
    const { POST } = await import("./route");

    const res = await POST(
      req({ resourceId: "org-a" }, { "X-Internal-Secret": "secret" }),
    );
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.error).toBe("not_found");
  });

  it("returns 503 canary_rolled_back when isolate circuit is open", async () => {
    getCloudflareContext.mockResolvedValue({
      env: {
        ENABLE_HYPERDRIVE_THREAD_CANARY: "true",
        INTERNAL_WEBHOOK_SECRET: "expected",
        HYPERDRIVE_FRESH: { connectionString: "postgres://user:pass@127.0.0.1:5432/db" },
      },
    });
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
    getCloudflareContext.mockResolvedValue({
      env: {
        ENABLE_HYPERDRIVE_THREAD_CANARY: "true",
        INTERNAL_WEBHOOK_SECRET: "expected",
        HYPERDRIVE_FRESH: { connectionString: "postgres://user:pass@127.0.0.1:5432/db" },
      },
    });
    vi.doMock("@mastra/pg", () => ({
      PostgresStore: vi.fn(),
      IPIX_CF_MASTRA_PG_STUB: false,
    }));
    const { POST } = await import("./route");

    const res = await POST(req({}, { "X-Internal-Secret": "expected" }));
    expect(res.status).toBe(400);
  });

  it("returns 503 when Hyperdrive binding is missing", async () => {
    getCloudflareContext.mockResolvedValue({
      env: {
        ENABLE_HYPERDRIVE_THREAD_CANARY: "true",
        INTERNAL_WEBHOOK_SECRET: "expected",
      },
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
    getCloudflareContext.mockResolvedValue({
      env: {
        ENABLE_HYPERDRIVE_THREAD_CANARY: "true",
        INTERNAL_WEBHOOK_SECRET: "expected",
        HYPERDRIVE_FRESH: { connectionString: "postgres://user:pass@127.0.0.1:5432/db" },
      },
    });

    const closeSpy = vi.fn(async () => undefined);
    const ctor = vi.fn(function FakePostgresStore(this: unknown) {});
    ctor.prototype.getStore = vi.fn(async () => ({
      saveThread: vi.fn(async ({ thread }: { thread: { id: string; resourceId: string } }) => thread),
      getThreadById: vi.fn(async ({ threadId }: { threadId: string }) => {
        // First call in createThreadImmediateRead is existence check — null;
        // after save, read returns the thread. Use call count per memory instance.
        return null;
      }),
      deleteThread: vi.fn(async () => undefined),
    }));
    // Fix memory mock: each getStore returns a fresh memory that tracks save
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
});
