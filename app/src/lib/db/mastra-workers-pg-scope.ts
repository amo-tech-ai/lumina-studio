/**
 * IPI-803 · CF-DB-012 — request-scoped Hyperdrive PostgresStore for Workers.
 *
 * Route-layer only. Do **not** import this from `app/src/mastra/storage.ts` —
 * that module is duplicated across ~30 OpenNext server chunks; pulling ALS /
 * OpenNext / Workers PG setup through it blew the 9 MiB Worker gzip gate.
 */
import { AsyncLocalStorage } from "node:async_hooks";
import * as MastraPg from "@mastra/pg";
import type { PostgresStore as PostgresStoreType } from "@mastra/pg";
import {
  MastraStorageUnavailableError,
  assertPostgresStoreModule,
  isCloudflareWorkersRuntime,
  registerWorkersPgScopedStoreGetter,
  resolveMastraSchemaName,
  shouldSkipMastraPostgresStorage,
  withMastraApplicationName,
} from "@/mastra/storage";

/** IPI-803 / canary: Workers Hyperdrive PostgresStore always max:1 until IPI-839 evidence. */
export const WORKERS_MASTRA_PG_POOL_MAX = 1;
const WORKERS_PG_IDLE_TIMEOUT_MS = 5_000;

export type WithMastraWorkersPgStorageOpts = {
  /** Inject in unit tests; otherwise resolved from HYPERDRIVE_FRESH. */
  connectionString?: string;
  waitUntil?: (promise: Promise<unknown>) => void;
  env?: NodeJS.ProcessEnv;
};

type WorkersPgRequestScope = {
  store: PostgresStoreType;
};

const workersPgRequestScope = new AsyncLocalStorage<WorkersPgRequestScope>();
let workersPgStoreCreateCount = 0;

registerWorkersPgScopedStoreGetter(() => workersPgRequestScope.getStore()?.store);

function resolveWorkersPgSslOption(
  env: NodeJS.ProcessEnv = process.env,
): { rejectUnauthorized: false } | undefined {
  return env.DATABASE_SSL === "true" ? { rejectUnauthorized: false } : undefined;
}

/** Fail closed: Workers `pg` mode must target `mastra.*`, not empty `public`. */
export function assertMastraSchemaForWorkersPg(
  env: NodeJS.ProcessEnv = process.env,
): "mastra" {
  const schema = resolveMastraSchemaName(env);
  if (schema !== "mastra") {
    throw new MastraStorageUnavailableError(
      `[mastra] Workers pg requires MASTRA_SCHEMA=mastra (got "${schema}") (IPI-803)`,
    );
  }
  return schema;
}

export function createWorkersHyperdrivePostgresStore(
  connectionString: string,
  env: NodeJS.ProcessEnv = process.env,
): PostgresStoreType {
  assertPostgresStoreModule(MastraPg);
  assertMastraSchemaForWorkersPg(env);
  workersPgStoreCreateCount += 1;
  return new MastraPg.PostgresStore({
    id: `mastra-storage-workers-${workersPgStoreCreateCount}`,
    connectionString: withMastraApplicationName(connectionString),
    schemaName: resolveMastraSchemaName(env),
    disableInit: true,
    max: WORKERS_MASTRA_PG_POOL_MAX,
    idleTimeoutMillis: WORKERS_PG_IDLE_TIMEOUT_MS,
    ssl: resolveWorkersPgSslOption(env),
  });
}

export function getWorkersPgStoreCreateCount(): number {
  return workersPgStoreCreateCount;
}

export function resetWorkersPgStoreCreateCountForTests(): void {
  workersPgStoreCreateCount = 0;
}

async function closeWorkersPgStore(store: PostgresStoreType): Promise<void> {
  try {
    await store.close();
  } catch (err) {
    console.warn(
      "[mastra] Workers PostgresStore.close() failed (IPI-803):",
      err instanceof Error ? err.message : err,
    );
  }
}

/**
 * Hyperdrive URL must be passed by the route (e.g. CopilotKit via getCloudflareContext).
 * Do **not** import `@opennextjs/cloudflare` or `cloudflare:workers` here — either
 * path duplicates across OpenNext route chunks and blows the 9 MiB gzip gate (IPI-844).
 */
function requireWorkersHyperdriveConnectionString(
  opts: WithMastraWorkersPgStorageOpts,
): string {
  const cs = opts.connectionString?.trim();
  if (!cs) {
    throw new MastraStorageUnavailableError(
      "[mastra] Workers pg requires opts.connectionString (HYPERDRIVE_FRESH) (IPI-803/IPI-844)",
    );
  }
  return cs;
}

async function resolveWaitUntil(
  explicit?: (promise: Promise<unknown>) => void,
): Promise<((promise: Promise<unknown>) => void) | undefined> {
  // Routes that already hold OpenNext ctx may pass waitUntil; otherwise we still
  // close after the body drains (void done) — fine for non-streaming JSON routes.
  if (typeof explicit === "function") return explicit;
  return undefined;
}

function deferWorkersPgStoreUntilResponseDone(
  response: Response,
  store: PostgresStoreType,
  waitUntil?: (promise: Promise<unknown>) => void,
): Response {
  const body = response.body;
  if (!body) {
    void closeWorkersPgStore(store);
    return response;
  }

  const { readable, writable } = new TransformStream<Uint8Array, Uint8Array>();
  const done = body
    .pipeTo(writable)
    .catch(() => {})
    .finally(() => closeWorkersPgStore(store));

  if (typeof waitUntil === "function") waitUntil(done);
  else void done;

  return new Response(readable, {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers,
  });
}

async function runWithMastraWorkersPgStorage<T>(
  fn: () => T | Promise<T>,
  opts: WithMastraWorkersPgStorageOpts = {},
): Promise<T> {
  const env = opts.env ?? process.env;

  if (workersPgRequestScope.getStore()) {
    return await fn();
  }

  const connectionString = requireWorkersHyperdriveConnectionString(opts);
  const waitUntil = await resolveWaitUntil(opts.waitUntil);
  const store = createWorkersHyperdrivePostgresStore(connectionString, env);
  let deferredClose = false;
  try {
    const result = await workersPgRequestScope.run({ store }, async () => {
      const out = await fn();
      if (out instanceof Response) {
        deferredClose = true;
        return deferWorkersPgStoreUntilResponseDone(out, store, waitUntil) as T;
      }
      return out;
    });
    return result;
  } finally {
    if (!deferredClose) {
      await closeWorkersPgStore(store);
    }
  }
}

/**
 * Enter request-scoped Hyperdrive PostgresStore for one Worker invocation.
 * noop / Node / Vercel: passthrough.
 */
export async function withMastraWorkersPgStorage<T>(
  fn: () => T | Promise<T>,
  opts: WithMastraWorkersPgStorageOpts = {},
): Promise<T> {
  const env = opts.env ?? process.env;
  if (!isCloudflareWorkersRuntime() || shouldSkipMastraPostgresStorage(env)) {
    return await fn();
  }
  return runWithMastraWorkersPgStorage(fn, opts);
}
