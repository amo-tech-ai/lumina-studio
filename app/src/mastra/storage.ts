import { createRequire } from "node:module";
import { InMemoryStore } from "@mastra/core/storage";
import type { PostgresStore as PostgresStoreType } from "@mastra/pg";

type MastraAppStorage = InMemoryStore | PostgresStoreType;

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

export function getMastraStorage(): MastraAppStorage {
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
      if (process.env.NODE_ENV === "production" && !process.env.CI) {
        // Agents call getMastraStorage() at module import (memory: getPlannerMemory()).
        // Throwing here yields Next.js HTML /500 before the CopilotKit route handler runs.
        console.error(
          "[mastra] DATABASE_URL missing in production — using InMemoryStore for this process. " +
            "CopilotKit /info and agent turns work without durable memory until DATABASE_URL " +
            "is set to the Supabase pooler connection string (port 6543) and redeployed.",
        );
      }
      // ponytail: in-memory at build/test time — agents import this at module eval,
      // but no DB call happens until an actual agent turn.
      storage = new InMemoryStore({ id: "mastra-storage-memory" });
    } else {
      // Lazy createRequire + require: avoid calling createRequire(import.meta.url)
      // at module init on Workers noop path (Seer). Sync API kept — dynamic import
      // would force async getMastraStorage(). OpenNext stubs `@mastra/pg` (IPI-490).
      const require = createRequire(import.meta.url);
      const mod = require("@mastra/pg") as {
        IPIX_CF_MASTRA_PG_STUB?: boolean;
        PostgresStore: typeof import("@mastra/pg").PostgresStore;
      };
      assertPostgresStoreModule(mod);
      storage = new mod.PostgresStore({ id: "mastra-storage", connectionString: url });
    }
  }
  return storage;
}
