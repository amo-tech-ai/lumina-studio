import { InMemoryStore } from "@mastra/core/storage";
import * as MastraPg from "@mastra/pg";
import type { PostgresStore as PostgresStoreType } from "@mastra/pg";

type MastraAppStorage = InMemoryStore | PostgresStoreType;

let storage: MastraAppStorage | undefined;
let lazyStorageProxy: MastraAppStorage | undefined;
let storageDegraded = false;
let cachedStorageUnavailableError: MastraStorageUnavailableError | undefined;

/** Thrown when durable storage is required but DATABASE_URL is unset in production. */
export class MastraStorageUnavailableError extends Error {
  readonly code = "storage_unavailable" as const;

  constructor(message: string) {
    super(message);
    this.name = "MastraStorageUnavailableError";
  }
}

/**
 * Cloudflare Workers / workerd isolate detection.
 * Direct `pg.Pool` (PostgresStore) hangs under OpenNext preview (IPI-490).
 */
export function isCloudflareWorkersRuntime(): boolean {
  try {
    const ua =
      typeof navigator !== "undefined" && typeof navigator.userAgent === "string"
        ? navigator.userAgent
        : "";
    if (ua.includes("Cloudflare-Workers")) return true;
    // workerd exposes WebSocketPair; Node does not.
    return typeof (globalThis as { WebSocketPair?: unknown }).WebSocketPair === "function";
  } catch {
    return false;
  }
}

export function isVercelRuntime(env: NodeJS.ProcessEnv = process.env): boolean {
  return env.VERCEL === "1";
}

/**
 * When true, skip PostgresStore even if DATABASE_URL is set.
 * - wrangler `vars.MASTRA_STORAGE_MODE=noop` on ipix-operator (preview/deploy)
 * - auto on Cloudflare Workers unless MASTRA_STORAGE_MODE=pg
 *
 * OpenNext Worker builds alias `@mastra/pg` to `cf-mastra-pg-stub.mjs` (IPI-490).
 * In that bundle `MASTRA_STORAGE_MODE=pg` cannot load the real provider —
 * {@link assertPostgresStoreModule} rejects the override with a clear error.
 */
export function shouldSkipMastraPostgresStorage(
  env: NodeJS.ProcessEnv = process.env,
  onWorkers: boolean = isCloudflareWorkersRuntime(),
): boolean {
  const mode = (env.MASTRA_STORAGE_MODE ?? "").trim().toLowerCase();
  if (mode === "noop" || mode === "off" || mode === "memory") return true;
  if (mode === "pg" || mode === "postgres") return false;
  // Default on Workers: skip — Pool hang (IPI-490). Node next-dev keeps PG.
  return onWorkers;
}

/** Reject OpenNext stub module when operator asked for real PostgresStore. */
export function assertPostgresStoreModule(mod: {
  IPIX_CF_MASTRA_PG_STUB?: boolean;
  PostgresStore?: unknown;
}): asserts mod is { PostgresStore: typeof import("@mastra/pg").PostgresStore } {
  if (mod?.IPIX_CF_MASTRA_PG_STUB) {
    throw new Error(
      "MASTRA_STORAGE_MODE=pg is unavailable in this Worker bundle (IPI-490). " +
        "`@mastra/pg` is stubbed for gzip size; use MASTRA_STORAGE_MODE=noop until Hyperdrive (IPI-619/623).",
    );
  }
  if (typeof mod?.PostgresStore !== "function") {
    throw new Error("Failed to load PostgresStore from @mastra/pg");
  }
}

/** True when Mastra storage init failed in production — safe for health/degraded signals (no secrets). */
export function isMastraStorageDegraded(): boolean {
  return storageDegraded;
}

function requireProductionDatabaseUrl(env: NodeJS.ProcessEnv = process.env): void {
  if (env.NODE_ENV !== "production" || env.CI) return;

  const target = isVercelRuntime(env) ? "Vercel production" : "production";
  storageDegraded = true;
  console.error(
    `[mastra] DATABASE_URL missing in ${target} — durable storage unavailable. ` +
      "CopilotKit /info may still list agents; agent runs requiring memory return 503 " +
      "storage_unavailable until DATABASE_URL is set (Supabase pooler port 6543) and redeployed.",
  );
  throw new MastraStorageUnavailableError(
    `DATABASE_URL is required in ${target}. Set it to the Supabase pooler connection string (port 6543).`,
  );
}

export function getMastraStorage(): MastraAppStorage {
  if (cachedStorageUnavailableError) {
    throw cachedStorageUnavailableError;
  }
  if (!storage) {
    const url = process.env.DATABASE_URL ?? "";

    if (shouldSkipMastraPostgresStorage()) {
      if (url) {
        console.warn(
          "[mastra] Using InMemoryStore on Workers (IPI-490: PostgresStore/pg.Pool hangs). " +
            "Agent runs without durable memory until Hyperdrive Client path (IPI-619/623).",
        );
      }
      // Real Mastra store (getStore("memory") etc.) — bare stubs break agent.stream after RUN_STARTED.
      storage = new InMemoryStore({ id: "mastra-storage-memory" });
    } else if (!url) {
      try {
        requireProductionDatabaseUrl();
      } catch (err) {
        if (err instanceof MastraStorageUnavailableError) {
          cachedStorageUnavailableError = err;
        }
        throw err;
      }
      // ponytail: in-memory at build/test time — agents import this at module eval,
      // but no DB call happens until an actual agent turn.
      storage = new InMemoryStore({ id: "mastra-storage-memory" });
    } else {
      // IPI-718: static ESM import (Mastra docs). Never CJS-load @mastra/pg —
      // that throws ERR_REQUIRE_ESM (p-map) on Vercel when the package is externalized.
      // OpenNext aliases this module to cf-mastra-pg-stub.mjs when IPIX_CF_BUNDLE_STUBS=1.
      assertPostgresStoreModule(MastraPg);
      storage = new MastraPg.PostgresStore({ id: "mastra-storage", connectionString: url });
    }
  }
  return storage;
}

/**
 * Defers {@link getMastraStorage} until a storage method is invoked — keeps CopilotKit
 * `/info` and agent discovery loadable without DATABASE_URL at module import.
 */
export function getMastraStorageLazy(): MastraAppStorage {
  if (!lazyStorageProxy) {
    lazyStorageProxy = new Proxy({} as MastraAppStorage, {
      get(_target, prop) {
        const store = getMastraStorage();
        const value = Reflect.get(store, prop, store) as unknown;
        return typeof value === "function"
          ? (value as (...args: unknown[]) => unknown).bind(store)
          : value;
      },
    });
  }
  return lazyStorageProxy;
}
