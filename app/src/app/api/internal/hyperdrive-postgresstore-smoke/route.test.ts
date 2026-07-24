import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const getCloudflareContext = vi.hoisted(() => vi.fn());

vi.mock("@opennextjs/cloudflare", () => ({
  getCloudflareContext,
}));

function req(body?: unknown, headers: Record<string, string> = {}) {
  return new Request("http://localhost/api/internal/hyperdrive-postgresstore-smoke", {
    method: "POST",
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

describe("POST /api/internal/hyperdrive-postgresstore-smoke", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
    getCloudflareContext.mockReset();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.doUnmock("@mastra/pg");
    vi.resetModules();
    vi.restoreAllMocks();
  });

  it("returns 404 when ENABLE_HYPERDRIVE_PG_SMOKE is not true", async () => {
    getCloudflareContext.mockResolvedValue({
      env: { ENABLE_HYPERDRIVE_PG_SMOKE: "false" },
    });
    const { POST } = await import("./route");

    const res = await POST(req({}, { "X-Internal-Secret": "secret" }));
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.error).toBe("not_found");
    expect(body.requestId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    );
  });

  it("returns 401 when secret is wrong", async () => {
    getCloudflareContext.mockResolvedValue({
      env: {
        ENABLE_HYPERDRIVE_PG_SMOKE: "true",
        INTERNAL_WEBHOOK_SECRET: "expected",
        HYPERDRIVE_FRESH: { connectionString: "postgres://user:pass@127.0.0.1:5432/db" },
      },
    });
    const { POST } = await import("./route");

    const res = await POST(req({}, { "X-Internal-Secret": "wrong" }));
    expect(res.status).toBe(401);
  });

  it("returns 503 when the Hyperdrive binding is missing", async () => {
    getCloudflareContext.mockResolvedValue({
      env: {
        ENABLE_HYPERDRIVE_PG_SMOKE: "true",
        INTERNAL_WEBHOOK_SECRET: "expected",
      },
    });
    const { POST } = await import("./route");

    const res = await POST(req({}, { "X-Internal-Secret": "expected" }));
    const body = await res.json();

    expect(res.status).toBe(503);
    expect(body.error).toBe("hyperdrive_binding_missing");
  });

  it("runs a single thread roundtrip against a request-scoped PostgresStore", async () => {
    getCloudflareContext.mockResolvedValue({
      env: {
        ENABLE_HYPERDRIVE_PG_SMOKE: "true",
        INTERNAL_WEBHOOK_SECRET: "expected",
        HYPERDRIVE_FRESH: { connectionString: "postgres://user:pass@127.0.0.1:5432/db" },
      },
    });

    let savedThreadId: string | undefined;
    const memory = {
      saveThread: vi.fn(async ({ thread }: { thread: { id: string } }) => {
        savedThreadId = thread.id;
        return thread;
      }),
      getThreadById: vi.fn(async ({ threadId }: { threadId: string }) => ({
        id: threadId,
      })),
      deleteThread: vi.fn(async () => undefined),
    };
    const ctor = vi.fn(function FakePostgresStore(this: unknown, config: Record<string, unknown>) {
      expect(config).toMatchObject({
        connectionString: "postgres://user:pass@127.0.0.1:5432/db",
        schemaName: "mastra",
        disableInit: true,
      });
    });
    ctor.prototype.getStore = vi.fn(async () => memory);
    ctor.prototype.close = vi.fn(async () => undefined);
    vi.doMock("@mastra/pg", () => ({ PostgresStore: ctor, IPIX_CF_MASTRA_PG_STUB: false }));

    const { POST } = await import("./route");
    const res = await POST(req({ mode: "single" }, { "X-Internal-Secret": "expected" }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.roundtrip).toBe(true);
    expect(body.adapter).toBe("@mastra/pg");
    expect(body.transport).toBe("hyperdrive");
    expect(body.schemaName).toBe("mastra");
    expect(body.disableInit).toBe(true);
    expect(body.stubbed).toBe(false);
    expect(body.result.matched).toBe(true);
    expect(body.result.cleanedUp).toBe(true);
    expect(memory.saveThread).toHaveBeenCalledTimes(1);
    expect(memory.getThreadById).toHaveBeenCalledWith({ threadId: savedThreadId });
    expect(memory.deleteThread).toHaveBeenCalledWith({ threadId: savedThreadId });
    expect(ctor.prototype.close).toHaveBeenCalledTimes(1);
  });

  it("runs concurrent roundtrips and reports per-attempt results with no shared state", async () => {
    getCloudflareContext.mockResolvedValue({
      env: {
        ENABLE_HYPERDRIVE_PG_SMOKE: "true",
        INTERNAL_WEBHOOK_SECRET: "expected",
        HYPERDRIVE_FRESH: { connectionString: "postgres://user:pass@127.0.0.1:5432/db" },
      },
    });

    const closeSpy = vi.fn(async () => undefined);
    const ctor = vi.fn(function FakePostgresStore(this: unknown) {});
    ctor.prototype.getStore = vi.fn(async () => ({
      saveThread: vi.fn(async ({ thread }: { thread: { id: string } }) => thread),
      getThreadById: vi.fn(async ({ threadId }: { threadId: string }) => ({ id: threadId })),
      deleteThread: vi.fn(async () => undefined),
    }));
    ctor.prototype.close = closeSpy;
    vi.doMock("@mastra/pg", () => ({ PostgresStore: ctor, IPIX_CF_MASTRA_PG_STUB: false }));

    const { POST } = await import("./route");
    const res = await POST(
      req({ mode: "concurrent", concurrency: 4 }, { "X-Internal-Secret": "expected" }),
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.roundtrip).toBe(true);
    expect(body.adapter).toBe("@mastra/pg");
    expect(body.concurrency).toBe(4);
    expect(body.successCount).toBe(4);
    expect(body.failureCount).toBe(0);
    expect(new Set(body.results.map((r: { threadId: string }) => r.threadId)).size).toBe(4);
    expect(body.results.every((r: { cleanedUp: boolean }) => r.cleanedUp)).toBe(true);
    expect(closeSpy).toHaveBeenCalledTimes(4);
    expect(ctor).toHaveBeenCalledTimes(4);
  });

  it("still closes the store and reports a sanitized failure when a query throws", async () => {
    getCloudflareContext.mockResolvedValue({
      env: {
        ENABLE_HYPERDRIVE_PG_SMOKE: "true",
        INTERNAL_WEBHOOK_SECRET: "expected",
        HYPERDRIVE_FRESH: { connectionString: "postgres://user:pass@127.0.0.1:5432/db" },
      },
    });

    const closeSpy = vi.fn(async () => undefined);
    const ctor = vi.fn(function FakePostgresStore(this: unknown) {});
    ctor.prototype.getStore = vi.fn(async () => ({
      saveThread: vi.fn(async () => {
        throw new Error("connection terminated unexpectedly — postgres://user:secret@host/db");
      }),
      getThreadById: vi.fn(),
      deleteThread: vi.fn(async () => undefined),
    }));
    ctor.prototype.close = closeSpy;
    vi.doMock("@mastra/pg", () => ({ PostgresStore: ctor, IPIX_CF_MASTRA_PG_STUB: false }));
    vi.spyOn(console, "error").mockImplementation(() => {});

    const { POST } = await import("./route");
    const res = await POST(req({ mode: "single" }, { "X-Internal-Secret": "expected" }));
    const body = await res.json();

    expect(res.status).toBe(502);
    expect(body.ok).toBe(false);
    expect(body.roundtrip).toBe(false);
    expect(body.result.error).toBe("roundtrip_failed");
    expect(JSON.stringify(body)).not.toMatch(/secret/);
    expect(closeSpy).toHaveBeenCalledTimes(1);
  });
});
