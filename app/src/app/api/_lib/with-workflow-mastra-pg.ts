/**
 * IPI-1015 · CF-DB-015 — request-scoped Workers pg for workflow HTTP routes.
 *
 * Reuses `withMastraWorkersPgStorage`. Resolves Hyperdrive here so the scope
 * helper stays OpenNext-free (IPI-844 gzip). CopilotKit keeps its own copy.
 */
import {
  MastraStorageUnavailableError,
  isCloudflareWorkersRuntime,
  shouldSkipMastraPostgresStorage,
} from "@/mastra/storage";

export async function withWorkflowMastraPg<T>(
  fn: () => T | Promise<T>,
): Promise<T> {
  if (!isCloudflareWorkersRuntime() || shouldSkipMastraPostgresStorage()) {
    return await fn();
  }

  const { withMastraWorkersPgStorage } = await import(
    "@/lib/db/mastra-workers-pg-scope"
  );
  const { getCloudflareContext } = await import("@opennextjs/cloudflare");
  const cf = (await getCloudflareContext({ async: true })) as {
    env?: { HYPERDRIVE_FRESH?: { connectionString?: string } };
    ctx?: { waitUntil?: (promise: Promise<unknown>) => void };
  };
  const connectionString = cf.env?.HYPERDRIVE_FRESH?.connectionString?.trim();
  if (!connectionString) {
    throw new MastraStorageUnavailableError(
      "[mastra] HYPERDRIVE_FRESH.connectionString unavailable (IPI-1015)",
    );
  }
  return await withMastraWorkersPgStorage(fn, {
    connectionString,
    waitUntil:
      typeof cf.ctx?.waitUntil === "function"
        ? cf.ctx.waitUntil.bind(cf.ctx)
        : undefined,
  });
}
