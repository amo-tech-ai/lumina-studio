import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const HD_URL = "postgres://hd:secret@hyperdrive.local:5432/db";

describe("withWorkflowMastraPg (IPI-1015)", () => {
  const originalWebSocketPair = (globalThis as { WebSocketPair?: unknown }).WebSocketPair;

  beforeEach(() => {
    vi.unstubAllEnvs();
    (globalThis as { WebSocketPair?: unknown }).WebSocketPair = class WebSocketPair {};
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllEnvs();
    vi.resetModules();
    vi.doUnmock("@mastra/pg");
    vi.doUnmock("@opennextjs/cloudflare");
    if (originalWebSocketPair === undefined) {
      delete (globalThis as { WebSocketPair?: unknown }).WebSocketPair;
    } else {
      (globalThis as { WebSocketPair?: unknown }).WebSocketPair = originalWebSocketPair;
    }
  });

  it("passthrough when storage mode is noop (no Hyperdrive)", async () => {
    vi.stubEnv("MASTRA_STORAGE_MODE", "noop");
    vi.resetModules();
    const { withWorkflowMastraPg } = await import("./with-workflow-mastra-pg");
    const out = await withWorkflowMastraPg(async () => "ok");
    expect(out).toBe("ok");
  });

  it("Workers+pg: getMastraStorage works inside wrap and throws after", async () => {
    const close = vi.fn(async () => {});
    const ctor = vi.fn(function FakePostgresStore(this: { close: typeof close }) {
      this.close = close;
    });
    vi.doMock("@mastra/pg", () => ({
      PostgresStore: ctor,
      IPIX_CF_MASTRA_PG_STUB: undefined,
    }));
    vi.doMock("@opennextjs/cloudflare", () => ({
      getCloudflareContext: async () => ({
        env: { HYPERDRIVE_FRESH: { connectionString: HD_URL } },
        ctx: { waitUntil: vi.fn() },
      }),
    }));
    vi.stubEnv("MASTRA_STORAGE_MODE", "pg");
    vi.stubEnv("MASTRA_SCHEMA", "mastra");
    vi.resetModules();

    const { getMastraStorage } = await import("@/mastra/storage");
    const { withWorkflowMastraPg } = await import("./with-workflow-mastra-pg");

    await withWorkflowMastraPg(async () => {
      expect(getMastraStorage()).toBeTruthy();
    });
    expect(() => getMastraStorage()).toThrow(/withMastraWorkersPgStorage/);
    expect(close).toHaveBeenCalledTimes(1);
  });

  it("Workers+pg: missing Hyperdrive fails closed", async () => {
    vi.doMock("@opennextjs/cloudflare", () => ({
      getCloudflareContext: async () => ({ env: {}, ctx: {} }),
    }));
    vi.stubEnv("MASTRA_STORAGE_MODE", "pg");
    vi.stubEnv("MASTRA_SCHEMA", "mastra");
    vi.resetModules();

    const { MastraStorageUnavailableError } = await import("@/mastra/storage");
    const { withWorkflowMastraPg } = await import("./with-workflow-mastra-pg");
    await expect(withWorkflowMastraPg(async () => "nope")).rejects.toThrow(
      MastraStorageUnavailableError,
    );
  });

  it("maps MastraStorageUnavailableError to 503 storage_unavailable", async () => {
    vi.resetModules();
    const { MastraStorageUnavailableError } = await import("@/mastra/storage");
    const { workflowMastraPgErrorResponse } = await import("./with-workflow-mastra-pg");
    const res = workflowMastraPgErrorResponse(
      new MastraStorageUnavailableError("HYPERDRIVE_FRESH missing"),
    );
    expect(res).not.toBeNull();
    expect(res!.status).toBe(503);
    await expect(res!.json()).resolves.toEqual({
      error: "Workflow persistence unavailable",
      code: "storage_unavailable",
    });
    expect(workflowMastraPgErrorResponse(new Error("other"))).toBeNull();
  });

  it("Workers+pg: getCloudflareContext throw fails closed as storage unavailable", async () => {
    vi.doMock("@opennextjs/cloudflare", () => ({
      getCloudflareContext: async () => {
        throw new Error("not on workers");
      },
    }));
    vi.stubEnv("MASTRA_STORAGE_MODE", "pg");
    vi.stubEnv("MASTRA_SCHEMA", "mastra");
    vi.resetModules();

    const { MastraStorageUnavailableError } = await import("@/mastra/storage");
    const { withWorkflowMastraPg } = await import("./with-workflow-mastra-pg");
    await expect(withWorkflowMastraPg(async () => "nope")).rejects.toThrow(
      MastraStorageUnavailableError,
    );
  });

  it("Workers+pg: unexpected Cloudflare context shape fails closed", async () => {
    vi.doMock("@opennextjs/cloudflare", () => ({
      getCloudflareContext: async () => null,
    }));
    vi.stubEnv("MASTRA_STORAGE_MODE", "pg");
    vi.stubEnv("MASTRA_SCHEMA", "mastra");
    vi.resetModules();

    const { MastraStorageUnavailableError } = await import("@/mastra/storage");
    const { withWorkflowMastraPg } = await import("./with-workflow-mastra-pg");
    await expect(withWorkflowMastraPg(async () => "nope")).rejects.toThrow(
      MastraStorageUnavailableError,
    );
  });

  it("sanitizes validation / conflict / unknown errors for the client", async () => {
    vi.resetModules();
    const { MastraStorageUnavailableError } = await import("@/mastra/storage");
    const { workflowClientErrorResponse } = await import("./with-workflow-mastra-pg");

    const zodErr = new Error("Validation error: required at product_category");
    zodErr.name = "ZodError";
    const invalid = workflowClientErrorResponse(zodErr);
    expect(invalid.status).toBe(400);
    await expect(invalid.json()).resolves.toEqual({
      error: "Invalid workflow input",
      code: "invalid_input",
    });

    const conflict = workflowClientErrorResponse(
      new Error("duplicate key value violates unique constraint mastra_workflow_snapshot_pkey"),
    );
    expect(conflict.status).toBe(409);
    await expect(conflict.json()).resolves.toEqual({
      error: "Workflow run already exists",
      code: "run_conflict",
    });

    const leaked = workflowClientErrorResponse(
      new Error("relation mastra.mastra_workflow_snapshot does not exist"),
    );
    expect(leaked.status).toBe(500);
    await expect(leaked.json()).resolves.toEqual({
      error: "Workflow request failed",
      code: "workflow_failed",
    });

    const storage = workflowClientErrorResponse(
      new MastraStorageUnavailableError("HYPERDRIVE_FRESH missing"),
    );
    expect(storage.status).toBe(503);
  });

  it("withWorkflowStoreTimeout fails closed when the store never returns", async () => {
    vi.useFakeTimers();
    vi.resetModules();
    const { MastraStorageUnavailableError } = await import("@/mastra/storage");
    const { withWorkflowStoreTimeout } = await import("./with-workflow-mastra-pg");
    const hung = withWorkflowStoreTimeout(new Promise(() => {}), "loadWorkflowSnapshot", 50);
    const expectReject = expect(hung).rejects.toThrow(MastraStorageUnavailableError);
    await vi.advanceTimersByTimeAsync(50);
    await expectReject;
    vi.useRealTimers();
  });
});
