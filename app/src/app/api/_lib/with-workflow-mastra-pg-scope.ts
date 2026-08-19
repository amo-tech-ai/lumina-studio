/**
 * Storage-only workflow pg scope — no Next route APIs.
 * HTTP JSON helpers stay in `with-workflow-mastra-pg.ts`.
 * Mastra Studio resume must import this file (IPI-1018).
 */
import {
  MastraStorageUnavailableError,
  isCloudflareWorkersRuntime,
  shouldSkipMastraPostgresStorage,
} from "@/mastra/storage";

/** Per-attempt cap so a hung snapshot load cannot eat the resume `maxDuration`. */
export const WORKFLOW_SNAPSHOT_LOAD_TIMEOUT_MS = 4_000;

export async function withWorkflowStoreTimeout<T>(
  promise: Promise<T>,
  label: string,
  ms = WORKFLOW_SNAPSHOT_LOAD_TIMEOUT_MS,
): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timer = setTimeout(() => {
          reject(
            new MastraStorageUnavailableError(
              `[mastra] ${label} timed out after ${ms}ms (IPI-1015)`,
            ),
          );
        }, ms);
      }),
    ]);
  } finally {
    if (timer !== undefined) clearTimeout(timer);
  }
}

type WorkflowCfContext = {
  env?: { HYPERDRIVE_FRESH?: { connectionString?: string } };
  ctx?: { waitUntil?: (promise: Promise<unknown>) => void };
};

async function resolveWorkflowCloudflareContext(): Promise<WorkflowCfContext> {
  try {
    const { getCloudflareContext } = await import("@opennextjs/cloudflare");
    const cf = (await getCloudflareContext({ async: true })) as WorkflowCfContext | null;
    if (!cf || typeof cf !== "object") {
      throw new MastraStorageUnavailableError(
        "[mastra] Cloudflare context missing env/ctx (IPI-1015)",
      );
    }
    return cf;
  } catch (err) {
    if (err instanceof MastraStorageUnavailableError) throw err;
    throw new MastraStorageUnavailableError(
      "[mastra] Cloudflare context unavailable (IPI-1015)",
    );
  }
}

export async function withWorkflowMastraPg<T>(
  fn: () => T | Promise<T>,
): Promise<T> {
  if (!isCloudflareWorkersRuntime() || shouldSkipMastraPostgresStorage()) {
    return await fn();
  }

  const { withMastraWorkersPgStorage } = await import(
    "@/lib/db/mastra-workers-pg-scope"
  );
  const cf = await resolveWorkflowCloudflareContext();
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
