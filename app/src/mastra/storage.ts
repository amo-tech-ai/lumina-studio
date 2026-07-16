import { InMemoryStore } from "@mastra/core/storage";
import { PostgresStore } from "@mastra/pg";

type MastraAppStorage = InMemoryStore | PostgresStore;

let storage: MastraAppStorage | undefined;

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

/**
 * When true, skip PostgresStore even if DATABASE_URL is set.
 * - wrangler `vars.MASTRA_STORAGE_MODE=noop` on ipix-operator (preview/deploy)
 * - auto on Cloudflare Workers unless MASTRA_STORAGE_MODE=pg (escape hatch)
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

export function getMastraStorage(): MastraAppStorage {
  if (!storage) {
    const url = process.env.DATABASE_URL ?? "";

    if (shouldSkipMastraPostgresStorage()) {
      if (url) {
        console.warn(
          "[mastra] Using InMemoryStore on Workers (IPI-490: PostgresStore/pg.Pool hangs). " +
            "Agent runs without durable memory until Hyperdrive Client path (IPI-619/623). " +
            "Override: MASTRA_STORAGE_MODE=pg (not recommended until Client-mode).",
        );
      }
      // Real Mastra store (getStore("memory") etc.) — bare stubs break agent.stream after RUN_STARTED.
      // ponytail: do not cache — mirrors empty-DATABASE_URL path so tests can flip env.
      return new InMemoryStore({ id: "mastra-storage-memory" });
    }

    if (!url) {
      if (process.env.NODE_ENV === "production" && !process.env.CI) {
        throw new Error(
          "DATABASE_URL is required in production. Set it to the Supabase pooler connection string (port 6543).",
        );
      }
      // ponytail: in-memory at build/test time — agents import this at module eval,
      // but no DB call happens until an actual agent turn.
      return new InMemoryStore({ id: "mastra-storage-memory" });
    }
    storage = new PostgresStore({ id: "mastra-storage", connectionString: url });
  }
  return storage;
}
