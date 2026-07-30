/**
 * IPI-803 · CF-DB-012 — Workers request-scoped Hyperdrive PostgresStore (A1/A2).
 *
 * Simulates a warm isolate (WebSocketPair) without a real Worker runtime.
 * Proves: Hyperdrive URL + schema=mastra + max:1; sequential requests get
 * distinct stores that are closed; no module-global Pool reuse.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const HD_URL = "postgres://hd:secret@hyperdrive.local:5432/db";

describe("IPI-803 Workers request-scoped PostgresStore", () => {
  const originalWebSocketPair = (globalThis as { WebSocketPair?: unknown }).WebSocketPair;

  beforeEach(() => {
    vi.unstubAllEnvs();
    // workerd / Cloudflare Workers expose WebSocketPair — storage.ts uses this.
    (globalThis as { WebSocketPair?: unknown }).WebSocketPair = class WebSocketPair {};
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
    vi.doUnmock("@mastra/pg");
    if (originalWebSocketPair === undefined) {
      delete (globalThis as { WebSocketPair?: unknown }).WebSocketPair;
    } else {
      (globalThis as { WebSocketPair?: unknown }).WebSocketPair = originalWebSocketPair;
    }
  });

  it("createWorkersHyperdrivePostgresStore uses schema mastra, max:1, disableInit", async () => {
    const close = vi.fn(async () => {});
    const ctor = vi.fn(function FakePostgresStore(this: { close: typeof close }) {
      this.close = close;
    });
    vi.doMock("@mastra/pg", () => ({
      PostgresStore: ctor,
      IPIX_CF_MASTRA_PG_STUB: undefined,
    }));
    vi.stubEnv("MASTRA_STORAGE_MODE", "pg");
    vi.stubEnv("MASTRA_SCHEMA", "mastra");
    vi.stubEnv("MASTRA_PG_POOL_MAX", "4"); // must still force Workers max:1
    vi.resetModules();

    const { createWorkersHyperdrivePostgresStore, WORKERS_MASTRA_PG_POOL_MAX } =
      await import("./mastra-workers-pg-scope");
    createWorkersHyperdrivePostgresStore(HD_URL, {
      MASTRA_SCHEMA: "mastra",
      MASTRA_PG_POOL_MAX: "4",
    });

    expect(WORKERS_MASTRA_PG_POOL_MAX).toBe(1);
    expect(ctor).toHaveBeenCalledWith(
      expect.objectContaining({
        schemaName: "mastra",
        disableInit: true,
        max: 1,
        connectionString: expect.stringContaining("application_name=ipix-mastra"),
      }),
    );
  });

  it("assertMastraSchemaForWorkersPg fails closed when schema is not mastra", async () => {
    vi.resetModules();
    const { assertMastraSchemaForWorkersPg } = await import("./mastra-workers-pg-scope");
    const { MastraStorageUnavailableError } = await import("@/mastra/storage");
    expect(() => assertMastraSchemaForWorkersPg({ MASTRA_SCHEMA: "public" })).toThrow(
      MastraStorageUnavailableError,
    );
  });

  it("getMastraStorage on Workers+pg without ALS throws (no module Pool)", async () => {
    vi.stubEnv("MASTRA_STORAGE_MODE", "pg");
    vi.stubEnv("MASTRA_SCHEMA", "mastra");
    vi.resetModules();
    const { getMastraStorage, MastraStorageUnavailableError } = await import("@/mastra/storage");
    expect(() => getMastraStorage()).toThrow(MastraStorageUnavailableError);
    expect(() => getMastraStorage()).toThrow(/withMastraWorkersPgStorage/);
  });

  it("withMastraWorkersPgStorage: sequential warm-isolate requests use distinct stores", async () => {
    const closes: Array<ReturnType<typeof vi.fn>> = [];
    const ctor = vi.fn(function FakePostgresStore(this: {
      id: string;
      close: ReturnType<typeof vi.fn>;
    }) {
      const close = vi.fn(async () => {});
      closes.push(close);
      this.close = close;
      this.id = `store-${closes.length}`;
    });
    vi.doMock("@mastra/pg", () => ({
      PostgresStore: ctor,
      IPIX_CF_MASTRA_PG_STUB: undefined,
    }));
    vi.stubEnv("MASTRA_STORAGE_MODE", "pg");
    vi.stubEnv("MASTRA_SCHEMA", "mastra");
    vi.resetModules();

    const { getMastraStorage, getMastraStorageLazy } = await import("@/mastra/storage");
    const {
      withMastraWorkersPgStorage,
      getWorkersPgStoreCreateCount,
      resetWorkersPgStoreCreateCountForTests,
    } = await import("./mastra-workers-pg-scope");

    resetWorkersPgStoreCreateCountForTests();
    const seen: unknown[] = [];

    // Request 1 (warm isolate)
    await withMastraWorkersPgStorage(
      async () => {
        const a = getMastraStorage();
        const b = getMastraStorage();
        expect(a).toBe(b); // same request → same ALS store
        seen.push(a);
        // Lazy proxy must also resolve to the ALS store
        const lazy = getMastraStorageLazy();
        const getStore = Reflect.get(lazy, "id", lazy);
        expect(getStore).toBeDefined();
      },
      { connectionString: HD_URL },
    );
    expect(closes[0]).toHaveBeenCalledTimes(1);

    // Request 2 (same isolate, new invocation)
    await withMastraWorkersPgStorage(
      async () => {
        const c = getMastraStorage();
        expect(c).not.toBe(seen[0]); // must not reuse closed/cross-request store
        seen.push(c);
      },
      { connectionString: HD_URL },
    );
    expect(closes[1]).toHaveBeenCalledTimes(1);

    expect(ctor).toHaveBeenCalledTimes(2);
    expect(getWorkersPgStoreCreateCount()).toBe(2);
    // After both requests: no live ALS → throws (no module cache fallback)
    expect(() => getMastraStorage()).toThrow(/withMastraWorkersPgStorage/);
  });

  it("withMastraWorkersPgStorage is a passthrough when mode=noop", async () => {
    const ctor = vi.fn(function FakePostgresStore() {});
    vi.doMock("@mastra/pg", () => ({
      PostgresStore: ctor,
      IPIX_CF_MASTRA_PG_STUB: undefined,
    }));
    vi.stubEnv("MASTRA_STORAGE_MODE", "noop");
    vi.resetModules();

    const { getMastraStorage } = await import("@/mastra/storage");
    const { withMastraWorkersPgStorage } = await import("./mastra-workers-pg-scope");
    const out = await withMastraWorkersPgStorage(async () => {
      const store = getMastraStorage();
      return store.constructor.name;
    });
    expect(out).toBe("InMemoryStore");
    expect(ctor).not.toHaveBeenCalled();
  });

  it("nested withMastraWorkersPgStorage reuses the outer store (one create)", async () => {
    const closes: Array<ReturnType<typeof vi.fn>> = [];
    const ctor = vi.fn(function FakePostgresStore(this: {
      close: ReturnType<typeof vi.fn>;
    }) {
      const close = vi.fn(async () => {});
      closes.push(close);
      this.close = close;
    });
    vi.doMock("@mastra/pg", () => ({
      PostgresStore: ctor,
      IPIX_CF_MASTRA_PG_STUB: undefined,
    }));
    vi.stubEnv("MASTRA_STORAGE_MODE", "pg");
    vi.stubEnv("MASTRA_SCHEMA", "mastra");
    vi.resetModules();

    const { getMastraStorage } = await import("@/mastra/storage");
    const {
      withMastraWorkersPgStorage,
      resetWorkersPgStoreCreateCountForTests,
      getWorkersPgStoreCreateCount,
    } = await import("./mastra-workers-pg-scope");
    resetWorkersPgStoreCreateCountForTests();

    await withMastraWorkersPgStorage(
      async () => {
        const outer = getMastraStorage();
        await withMastraWorkersPgStorage(async () => {
          expect(getMastraStorage()).toBe(outer);
        });
      },
      { connectionString: HD_URL },
    );

    expect(ctor).toHaveBeenCalledTimes(1);
    expect(getWorkersPgStoreCreateCount()).toBe(1);
    expect(closes[0]).toHaveBeenCalledTimes(1);
  });

  it("defers store.close until Response body completes (SSE lifecycle)", async () => {
    const close = vi.fn(async () => {});
    const ctor = vi.fn(function FakePostgresStore(this: { close: typeof close }) {
      this.close = close;
    });
    vi.doMock("@mastra/pg", () => ({
      PostgresStore: ctor,
      IPIX_CF_MASTRA_PG_STUB: undefined,
    }));
    vi.stubEnv("MASTRA_STORAGE_MODE", "pg");
    vi.stubEnv("MASTRA_SCHEMA", "mastra");
    vi.resetModules();

    const { getMastraStorage } = await import("@/mastra/storage");
    const { withMastraWorkersPgStorage } = await import("./mastra-workers-pg-scope");

    let sawOpenWhileStreaming = false;
    const response = await withMastraWorkersPgStorage(
      async () => {
        getMastraStorage();
        const stream = new ReadableStream<Uint8Array>({
          start(controller) {
            queueMicrotask(() => {
              // Pool must still be open while SSE body is in flight.
              sawOpenWhileStreaming = close.mock.calls.length === 0;
              controller.enqueue(new TextEncoder().encode("data: ok\n\n"));
              controller.close();
            });
          },
        });
        return new Response(stream, {
          headers: { "content-type": "text/event-stream" },
        });
      },
      { connectionString: HD_URL },
    );

    expect(close).not.toHaveBeenCalled();
    const text = await response.text();
    expect(text).toContain("data: ok");
    expect(sawOpenWhileStreaming).toBe(true);
    // Drain may settle close on a microtask after text() resolves.
    await vi.waitFor(() => expect(close).toHaveBeenCalledTimes(1));
  });

  it("closes the store when the SSE client cancels mid-stream", async () => {
    const close = vi.fn(async () => {});
    const ctor = vi.fn(function FakePostgresStore(this: { close: typeof close }) {
      this.close = close;
    });
    vi.doMock("@mastra/pg", () => ({
      PostgresStore: ctor,
      IPIX_CF_MASTRA_PG_STUB: undefined,
    }));
    vi.stubEnv("MASTRA_STORAGE_MODE", "pg");
    vi.stubEnv("MASTRA_SCHEMA", "mastra");
    vi.resetModules();

    const { withMastraWorkersPgStorage } = await import("./mastra-workers-pg-scope");
    const response = await withMastraWorkersPgStorage(
      async () =>
        new Response(
          new ReadableStream<Uint8Array>({
            start(controller) {
              controller.enqueue(new TextEncoder().encode("data: ok\n\n"));
              // never closed — in-flight agent turn until client disconnects
            },
          }),
          { headers: { "content-type": "text/event-stream" } },
        ),
      { connectionString: HD_URL },
    );

    expect(close).not.toHaveBeenCalled();
    await response.body!.cancel();
    await vi.waitFor(() => expect(close).toHaveBeenCalledTimes(1));
  });

  it("keeps store open through awaited start-style work before close (workflow suspend)", async () => {
    const close = vi.fn(async () => {});
    const ctor = vi.fn(function FakePostgresStore(this: { close: typeof close }) {
      this.close = close;
    });
    vi.doMock("@mastra/pg", () => ({
      PostgresStore: ctor,
      IPIX_CF_MASTRA_PG_STUB: undefined,
    }));
    vi.stubEnv("MASTRA_STORAGE_MODE", "pg");
    vi.stubEnv("MASTRA_SCHEMA", "mastra");
    vi.resetModules();

    const { getMastraStorage } = await import("@/mastra/storage");
    const { withMastraWorkersPgStorage } = await import("./mastra-workers-pg-scope");
    const checkpointWrites: string[] = [];

    const result = await withMastraWorkersPgStorage(
      async () => {
        // Mimic run.start(): await through suspend/checkpoint before returning JSON.
        await new Promise<void>((resolve) => {
          queueMicrotask(() => {
            const store = getMastraStorage();
            checkpointWrites.push(String(Reflect.get(store, "id", store) ?? "ok"));
            resolve();
          });
        });
        expect(close).not.toHaveBeenCalled();
        return { runId: "run-suspended", status: "suspended" };
      },
      { connectionString: HD_URL },
    );

    expect(result).toEqual({ runId: "run-suspended", status: "suspended" });
    expect(checkpointWrites).toHaveLength(1);
    expect(close).toHaveBeenCalledTimes(1);
  });
});
