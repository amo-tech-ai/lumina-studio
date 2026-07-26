import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  clampCanaryConcurrency,
  classifyCanaryError,
  createThreadImmediateRead,
  HD_THREAD_CANARY_FAILURE_THRESHOLD,
  HD_THREAD_CANARY_MAX_CONCURRENCY,
  isCanaryCircuitOpen,
  recordCanaryFailure,
  recordCanarySuccess,
  resetCanaryCircuitForTests,
  threadIdFromIdempotencyKey,
  type PostgresStoreCtor,
} from "./hyperdrive-thread-canary";

const FAKE_HD = { connectionString: "postgres://user:pass@127.0.0.1:5432/db" };

describe("hyperdrive-thread-canary helpers (IPI-623)", () => {
  beforeEach(() => {
    resetCanaryCircuitForTests();
  });

  afterEach(() => {
    resetCanaryCircuitForTests();
    vi.restoreAllMocks();
  });

  it("clamps concurrency to 1..3", () => {
    expect(clampCanaryConcurrency(undefined)).toBe(1);
    expect(clampCanaryConcurrency(0)).toBe(1);
    expect(clampCanaryConcurrency(2)).toBe(2);
    expect(clampCanaryConcurrency(99)).toBe(HD_THREAD_CANARY_MAX_CONCURRENCY);
    expect(clampCanaryConcurrency("3")).toBe(3);
  });

  it("derives a stable thread id from Idempotency-Key", () => {
    const a = threadIdFromIdempotencyKey("booking-shoot-42");
    const b = threadIdFromIdempotencyKey("booking-shoot-42");
    const c = threadIdFromIdempotencyKey("other");
    expect(a).toBe(b);
    expect(a).not.toBe(c);
    expect(a).toMatch(/^ipi-623-canary-[0-9a-f]{32}$/);
  });

  it("classifies timeout vs retryable vs fatal", () => {
    expect(classifyCanaryError(new Error("canary_timeout: exceeded 15000ms"))).toBe("timeout");
    expect(classifyCanaryError(new Error("ECONNRESET connection terminated"))).toBe("retryable");
    expect(classifyCanaryError(new Error("permission denied"))).toBe("fatal");
  });

  it("opens the isolate circuit after consecutive failures and clears on success", () => {
    for (let i = 0; i < HD_THREAD_CANARY_FAILURE_THRESHOLD; i++) {
      expect(isCanaryCircuitOpen()).toBe(false);
      recordCanaryFailure();
    }
    expect(isCanaryCircuitOpen()).toBe(true);
    recordCanarySuccess();
    expect(isCanaryCircuitOpen()).toBe(false);
  });
});

describe("createThreadImmediateRead (IPI-623)", () => {
  beforeEach(() => {
    resetCanaryCircuitForTests();
  });

  function fakeStore(memory: {
    saveThread: ReturnType<typeof vi.fn>;
    getThreadById: ReturnType<typeof vi.fn>;
    deleteThread: ReturnType<typeof vi.fn>;
  }): PostgresStoreCtor {
    const ctor = vi.fn(function FakePostgresStore(
      this: unknown,
      config: Record<string, unknown>,
    ) {
      expect(config).toMatchObject({
        connectionString: FAKE_HD.connectionString,
        schemaName: "mastra",
        disableInit: true,
        max: 1,
      });
    }) as unknown as PostgresStoreCtor & {
      prototype: {
        getStore: ReturnType<typeof vi.fn>;
        close: ReturnType<typeof vi.fn>;
      };
    };
    ctor.prototype.getStore = vi.fn(async () => memory);
    ctor.prototype.close = vi.fn(async () => undefined);
    return ctor;
  }

  it("creates then immediately reads a thread (tenant-scoped)", async () => {
    let saved: { id: string; resourceId: string } | null = null;
    const memory = {
      saveThread: vi.fn(async ({ thread }: { thread: { id: string; resourceId: string } }) => {
        saved = { id: thread.id, resourceId: thread.resourceId };
        return thread;
      }),
      getThreadById: vi.fn(async ({ threadId }: { threadId: string }) => {
        if (!saved || saved.id !== threadId) return null;
        return saved;
      }),
      deleteThread: vi.fn(async () => {
        saved = null;
      }),
    };

    const PostgresStore = fakeStore(memory);
    const result = await createThreadImmediateRead(FAKE_HD, PostgresStore, {
      resourceId: "org-a",
    });

    expect(result.ok).toBe(true);
    expect(result.matched).toBe(true);
    expect(result.wrote).toBe(true);
    expect(result.duplicateWrite).toBe(false);
    expect(result.cleanedUp).toBe(true);
    expect(result.crossTenant).toBe(false);
    expect(result.errorClass).toBe("none");
    expect(memory.saveThread).toHaveBeenCalledTimes(1);
    expect(memory.deleteThread).toHaveBeenCalledTimes(1);
  });

  it("skips write on idempotent replay (0 duplicate writes)", async () => {
    const key = "idem-1";
    const expectedId = threadIdFromIdempotencyKey(key);
    const memory = {
      saveThread: vi.fn(async () => {
        throw new Error("should not write");
      }),
      getThreadById: vi.fn(async () => ({ id: expectedId, resourceId: "org-a" })),
      deleteThread: vi.fn(async () => undefined),
    };
    const PostgresStore = fakeStore(memory);

    const result = await createThreadImmediateRead(FAKE_HD, PostgresStore, {
      resourceId: "org-a",
      idempotencyKey: key,
    });

    expect(result.ok).toBe(true);
    expect(result.threadId).toBe(expectedId);
    expect(result.wrote).toBe(false);
    expect(result.duplicateWrite).toBe(false);
    expect(memory.saveThread).not.toHaveBeenCalled();
  });

  it("fails closed on cross-tenant resourceId mismatch", async () => {
    const key = "idem-x";
    const expectedId = threadIdFromIdempotencyKey(key);
    const memory = {
      saveThread: vi.fn(),
      getThreadById: vi.fn(async () => ({ id: expectedId, resourceId: "org-other" })),
      deleteThread: vi.fn(async () => undefined),
    };
    vi.spyOn(console, "error").mockImplementation(() => {});
    const PostgresStore = fakeStore(memory);

    const result = await createThreadImmediateRead(FAKE_HD, PostgresStore, {
      resourceId: "org-a",
      idempotencyKey: key,
    });

    expect(result.ok).toBe(false);
    expect(result.crossTenant).toBe(true);
    expect(result.error).toBe("cross_tenant");
    expect(memory.saveThread).not.toHaveBeenCalled();
  });

  it("rejects blank resourceId before touching Postgres", async () => {
    const memory = {
      saveThread: vi.fn(),
      getThreadById: vi.fn(),
      deleteThread: vi.fn(),
    };
    const PostgresStore = fakeStore(memory);

    await expect(
      createThreadImmediateRead(FAKE_HD, PostgresStore, { resourceId: "  " }),
    ).rejects.toThrow(/Missing resourceId/);
    expect(memory.saveThread).not.toHaveBeenCalled();
  });

  it("classifies timeout when roundtrip exceeds budget", async () => {
    const memory = {
      saveThread: vi.fn(
        () => new Promise(() => {}), // never resolves
      ),
      getThreadById: vi.fn(async () => null),
      deleteThread: vi.fn(async () => undefined),
    };
    vi.spyOn(console, "error").mockImplementation(() => {});
    const PostgresStore = fakeStore(memory);

    const result = await createThreadImmediateRead(FAKE_HD, PostgresStore, {
      resourceId: "org-a",
      timeoutMs: 30,
    });

    expect(result.ok).toBe(false);
    expect(result.errorClass).toBe("timeout");
    expect(result.error).toBe("timeout");
  });
});
