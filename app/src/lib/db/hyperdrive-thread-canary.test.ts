import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  clampCanaryConcurrency,
  classifyCanaryError,
  createThreadImmediateRead,
  getCanaryInFlightForTests,
  HD_THREAD_CANARY_FAILURE_THRESHOLD,
  HD_THREAD_CANARY_IDEMPOTENCY_KEY_MAX,
  HD_THREAD_CANARY_MAX_CONCURRENCY,
  HD_THREAD_CANARY_ORPHAN_TIMEOUT_MS,
  isCanaryCircuitOpen,
  recordCanaryFailure,
  recordCanarySuccess,
  resetCanaryCircuitForTests,
  threadIdFromIdempotencyKey,
  type PostgresStoreCtor,
} from "./hyperdrive-thread-canary";

const FAKE_HD = { connectionString: "postgres://user:pass@127.0.0.1:5432/db" };

describe("hyperdrive-thread-canary helpers (IPI-623 / IPI-823)", () => {
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

  it("derives a stable thread id from Idempotency-Key scoped by resourceId", () => {
    const a = threadIdFromIdempotencyKey("booking-shoot-42", "org-a");
    const b = threadIdFromIdempotencyKey("booking-shoot-42", "org-a");
    const c = threadIdFromIdempotencyKey("other", "org-a");
    expect(a).toBe(b);
    expect(a).not.toBe(c);
    expect(a).toMatch(/^ipi-623-canary-[0-9a-f]{32}$/);
  });

  it("same idempotency key + different resourceIds produce different thread ids", () => {
    const a = threadIdFromIdempotencyKey("shared-key", "org-a");
    const b = threadIdFromIdempotencyKey("shared-key", "org-b");
    expect(a).not.toBe(b);
  });

  it("rejects empty or oversized idempotency keys", () => {
    expect(() => threadIdFromIdempotencyKey("   ", "org-a")).toThrow(/invalid_idempotency_key/);
    expect(() =>
      threadIdFromIdempotencyKey("x".repeat(HD_THREAD_CANARY_IDEMPOTENCY_KEY_MAX + 1), "org-a"),
    ).toThrow(/invalid_idempotency_key/);
  });

  it("classifies timeout vs retryable vs fatal", () => {
    expect(classifyCanaryError(new Error("canary_timeout: exceeded 15000ms"))).toBe("timeout");
    expect(classifyCanaryError(new Error("ECONNRESET connection terminated"))).toBe("retryable");
    expect(classifyCanaryError(new Error("concurrency_saturated"))).toBe("retryable");
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

describe("createThreadImmediateRead (IPI-623 / IPI-823)", () => {
  beforeEach(() => {
    resetCanaryCircuitForTests();
  });

  afterEach(() => {
    resetCanaryCircuitForTests();
    vi.restoreAllMocks();
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
    const { result } = await createThreadImmediateRead(FAKE_HD, PostgresStore, {
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

  it("skips write on idempotent replay and does not delete (0 duplicate writes)", async () => {
    const key = "idem-1";
    const expectedId = threadIdFromIdempotencyKey(key, "org-a");
    const memory = {
      saveThread: vi.fn(async () => {
        throw new Error("should not write");
      }),
      getThreadById: vi.fn(async () => ({ id: expectedId, resourceId: "org-a" })),
      deleteThread: vi.fn(async () => undefined),
    };
    const PostgresStore = fakeStore(memory);

    const { result } = await createThreadImmediateRead(FAKE_HD, PostgresStore, {
      resourceId: "org-a",
      idempotencyKey: key,
    });

    expect(result.ok).toBe(true);
    expect(result.threadId).toBe(expectedId);
    expect(result.wrote).toBe(false);
    expect(result.duplicateWrite).toBe(false);
    expect(memory.saveThread).not.toHaveBeenCalled();
    expect(memory.deleteThread).not.toHaveBeenCalled();
  });

  it("cleans up keyed rows by default so unique soak keys do not accumulate", async () => {
    const key = "idem-ephemeral";
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

    const { result } = await createThreadImmediateRead(FAKE_HD, PostgresStore, {
      resourceId: "org-a",
      idempotencyKey: key,
    });
    expect(result.ok).toBe(true);
    expect(result.wrote).toBe(true);
    expect(result.cleanedUp).toBe(true);
    expect(memory.deleteThread).toHaveBeenCalledTimes(1);
    expect(saved).toBeNull();
  });

  it("preserves keyed thread when retainForReplay so a second call skips save", async () => {
    const key = "idem-preserve";
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

    const { result: first } = await createThreadImmediateRead(FAKE_HD, PostgresStore, {
      resourceId: "org-a",
      idempotencyKey: key,
      retainForReplay: true,
    });
    expect(first.ok).toBe(true);
    expect(first.wrote).toBe(true);
    expect(first.cleanedUp).toBe(false);
    expect(memory.deleteThread).not.toHaveBeenCalled();
    expect(saved).not.toBeNull();

    const { result: second } = await createThreadImmediateRead(FAKE_HD, PostgresStore, {
      resourceId: "org-a",
      idempotencyKey: key,
      retainForReplay: true,
    });
    expect(second.ok).toBe(true);
    expect(second.wrote).toBe(false);
    expect(second.matched).toBe(true);
    expect(memory.saveThread).toHaveBeenCalledTimes(1);
    expect(memory.deleteThread).not.toHaveBeenCalled();
  });

  it("classifies unmatched immediate read as roundtrip_failed", async () => {
    const memory = {
      saveThread: vi.fn(async ({ thread }: { thread: { id: string; resourceId: string } }) => thread),
      getThreadById: vi.fn(async () => null),
      deleteThread: vi.fn(async () => undefined),
    };
    vi.spyOn(console, "error").mockImplementation(() => {});
    const PostgresStore = fakeStore(memory);

    const { result } = await createThreadImmediateRead(FAKE_HD, PostgresStore, {
      resourceId: "org-a",
    });

    expect(result.ok).toBe(false);
    expect(result.matched).toBe(false);
    expect(result.wrote).toBe(true);
    expect(result.errorClass).toBe("roundtrip_failed");
    expect(result.error).toBe("roundtrip_failed");
    expect(result.errorClass).not.toBe("none");
  });

  it("records latencyMs before slow cleanup", async () => {
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
        await new Promise((r) => setTimeout(r, 200));
        saved = null;
      }),
    };
    const PostgresStore = fakeStore(memory);
    const wallStart = Date.now();
    const { result } = await createThreadImmediateRead(FAKE_HD, PostgresStore, {
      resourceId: "org-a",
    });
    const wallMs = Date.now() - wallStart;

    expect(result.ok).toBe(true);
    expect(result.cleanedUp).toBe(true);
    expect(result.latencyMs).toBeLessThan(150);
    expect(result.latencyMs).toBeLessThan(wallMs);
    expect(result.cleanupLatencyMs ?? 0).toBeGreaterThanOrEqual(180);
  });

  it("fails closed on cross-tenant resourceId mismatch and does not delete", async () => {
    const key = "idem-x";
    const expectedId = threadIdFromIdempotencyKey(key, "org-a");
    const memory = {
      saveThread: vi.fn(),
      getThreadById: vi.fn(async () => ({ id: expectedId, resourceId: "org-other" })),
      deleteThread: vi.fn(async () => undefined),
    };
    vi.spyOn(console, "error").mockImplementation(() => {});
    const PostgresStore = fakeStore(memory);

    const { result } = await createThreadImmediateRead(FAKE_HD, PostgresStore, {
      resourceId: "org-a",
      idempotencyKey: key,
    });

    expect(result.ok).toBe(false);
    expect(result.crossTenant).toBe(true);
    expect(result.error).toBe("cross_tenant");
    expect(memory.saveThread).not.toHaveBeenCalled();
    expect(memory.deleteThread).not.toHaveBeenCalled();
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

  it("on timeout without write: exposes backgroundWork and returns without hanging", async () => {
    const memory = {
      saveThread: vi.fn(
        () => new Promise(() => {}), // never resolves
      ),
      getThreadById: vi.fn(async () => null),
      deleteThread: vi.fn(async () => undefined),
    };
    vi.spyOn(console, "error").mockImplementation(() => {});
    const PostgresStore = fakeStore(memory);

    const timeoutMs = 30;
    const wallStart = Date.now();
    const { result, backgroundWork } = await createThreadImmediateRead(FAKE_HD, PostgresStore, {
      resourceId: "org-a",
      timeoutMs,
    });
    const wallMs = Date.now() - wallStart;

    expect(result.ok).toBe(false);
    expect(result.errorClass).toBe("timeout");
    expect(result.error).toBe("timeout");
    expect(result.wrote).toBe(false);
    expect(memory.deleteThread).not.toHaveBeenCalled();
    expect(backgroundWork).toBeInstanceOf(Promise);
    // Timeout path returns immediately; cleanup/orphan is in backgroundWork.
    expect(wallMs).toBeLessThan(timeoutMs + 500);
    expect(result.latencyMs).toBeLessThan(timeoutMs + 500);
    // Drain backgroundWork (orphan bound when save never settles) so the suite
    // does not leave a pending settleOrOrphan timer / slot release.
    await Promise.race([
      backgroundWork!,
      new Promise<void>((resolve) =>
        setTimeout(resolve, HD_THREAD_CANARY_ORPHAN_TIMEOUT_MS + 500),
      ),
    ]);
    resetCanaryCircuitForTests();
  }, HD_THREAD_CANARY_ORPHAN_TIMEOUT_MS + 2_000);

  it("keeps semaphore slot until hung work settles after timeout", async () => {
    let resolveSave!: (value: unknown) => void;
    const saveGate = new Promise((resolve) => {
      resolveSave = resolve;
    });
    let saveCalls = 0;
    const memory = {
      saveThread: vi.fn(() => {
        saveCalls += 1;
        // First call hangs until we release; later calls hang forever (cap fillers).
        if (saveCalls === 1) return saveGate;
        return new Promise(() => {});
      }),
      getThreadById: vi.fn(async () => null),
      deleteThread: vi.fn(async () => undefined),
    };
    vi.spyOn(console, "error").mockImplementation(() => {});
    const PostgresStore = fakeStore(memory);

    const pending = createThreadImmediateRead(FAKE_HD, PostgresStore, {
      resourceId: "org-a",
      timeoutMs: 40,
    });

    await vi.waitFor(() => {
      expect(getCanaryInFlightForTests()).toBe(1);
    });

    const { result, backgroundWork } = await pending;
    expect(result.errorClass).toBe("timeout");
    expect(backgroundWork).toBeInstanceOf(Promise);
    // Slot still held while underlying save is in flight.
    expect(getCanaryInFlightForTests()).toBe(1);

    // Fill remaining slots with forever-hung work so the cap is real.
    const fillers = Array.from({ length: HD_THREAD_CANARY_MAX_CONCURRENCY - 1 }, () =>
      createThreadImmediateRead(FAKE_HD, PostgresStore, {
        resourceId: "org-a",
        timeoutMs: 40,
      }),
    );
    await vi.waitFor(() => {
      expect(getCanaryInFlightForTests()).toBe(HD_THREAD_CANARY_MAX_CONCURRENCY);
    });
    const { result: saturatedWhileHeld } = await createThreadImmediateRead(
      FAKE_HD,
      PostgresStore,
      {
        resourceId: "org-a",
        timeoutMs: 20,
      },
    );
    expect(saturatedWhileHeld.error).toBe("concurrency_saturated");

    // Settling the original hung save frees one slot (fillers still hold the rest until orphan).
    resolveSave({});
    await vi.waitFor(() => {
      expect(getCanaryInFlightForTests()).toBe(HD_THREAD_CANARY_MAX_CONCURRENCY - 1);
    });

    // A new acquire can proceed only after that settle freed a slot.
    const afterSettle = createThreadImmediateRead(FAKE_HD, PostgresStore, {
      resourceId: "org-a",
      timeoutMs: 40,
    });
    await vi.waitFor(() => {
      expect(getCanaryInFlightForTests()).toBe(HD_THREAD_CANARY_MAX_CONCURRENCY);
    });
    await afterSettle;

    await Promise.all(fillers);
    // Reset clears background orphans for subsequent tests (epoch-guarded release).
    resetCanaryCircuitForTests();
    expect(getCanaryInFlightForTests()).toBe(0);
  });

  it("returns concurrency_saturated without opening another PostgresStore", async () => {
    const hang = () => new Promise(() => {});
    const memory = {
      saveThread: vi.fn(hang),
      getThreadById: vi.fn(async () => null),
      deleteThread: vi.fn(async () => undefined),
    };
    vi.spyOn(console, "error").mockImplementation(() => {});
    const PostgresStore = fakeStore(memory);

    // Async fns run sync until first await — all three acquire before yielding.
    const inflight = Array.from({ length: HD_THREAD_CANARY_MAX_CONCURRENCY }, () =>
      createThreadImmediateRead(FAKE_HD, PostgresStore, {
        resourceId: "org-a",
        timeoutMs: 200,
      }),
    );

    const { result: saturated } = await createThreadImmediateRead(FAKE_HD, PostgresStore, {
      resourceId: "org-a",
      timeoutMs: 50,
    });

    expect(saturated.ok).toBe(false);
    expect(saturated.error).toBe("concurrency_saturated");
    expect(saturated.errorClass).toBe("retryable");
    // Only the in-flight attempts constructed stores (not the saturated call).
    expect(PostgresStore).toHaveBeenCalledTimes(HD_THREAD_CANARY_MAX_CONCURRENCY);

    await Promise.all(inflight);
  });
});
