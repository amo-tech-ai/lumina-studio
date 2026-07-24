import { InMemoryStore } from "@mastra/core/storage";
import * as MastraPg from "@mastra/pg";
import type { PostgresStore as PostgresStoreType } from "@mastra/pg";

type MastraAppStorage = InMemoryStore | PostgresStoreType;

const DEFAULT_PG_POOL_MAX = 4;
const PG_IDLE_TIMEOUT_MS = 10_000;

type IpixMastraGlobal = typeof globalThis & {
  /** Dev HMR: reuse one PostgresStore per Node process (IPI-740). */
  __ipixMastraPgStore?: PostgresStoreType;
};

let storage: MastraAppStorage | undefined;
let lazyStorageProxy: MastraAppStorage | undefined;
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
 * OpenNext used to alias `@mastra/pg` → `cf-mastra-pg-stub.mjs` (IPI-490).
 * IPI-620A/B removed that alias so Hyperdrive spikes can load the real package.
 * Production Workers still default to noop via `MASTRA_STORAGE_MODE` / this skip —
 * {@link assertPostgresStoreModule} still rejects a reintroduced stub if someone
 * asks for `MASTRA_STORAGE_MODE=pg` against a stubbed bundle.
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
      "MASTRA_STORAGE_MODE=pg is unavailable: `@mastra/pg` resolved to cf-mastra-pg-stub.mjs (IPI-490). " +
        "Remove the Worker alias (IPI-620B) or keep MASTRA_STORAGE_MODE=noop until Hyperdrive proof (IPI-623).",
    );
  }
  if (typeof mod?.PostgresStore !== "function") {
    throw new Error("Failed to load PostgresStore from @mastra/pg");
  }
}

/** True when Mastra storage init failed in production — safe for health/degraded signals (no secrets). */
export function isMastraStorageDegraded(): boolean {
  return cachedStorageUnavailableError !== undefined;
}

/**
 * Mastra runtime DB URL (IPI-740).
 * Prefer `MASTRA_DATABASE_URL` (transaction pooler :6543) so session/direct
 * `DATABASE_URL` / `SUPABASE_DB_URL` stay usable for psql + CI (IPI-678).
 */
export type MastraDatabaseUrlSource = "mastra" | "database" | "none";

export function resolveMastraDatabaseUrl(env: NodeJS.ProcessEnv = process.env): string {
  return resolveMastraDatabaseUrlWithSource(env).url;
}

export function resolveMastraDatabaseUrlWithSource(
  env: NodeJS.ProcessEnv = process.env,
): { url: string; source: MastraDatabaseUrlSource } {
  const preferred = (env.MASTRA_DATABASE_URL ?? "").trim();
  if (preferred) return { url: preferred, source: "mastra" };
  const fallback = (env.DATABASE_URL ?? "").trim();
  if (fallback) return { url: fallback, source: "database" };
  return { url: "", source: "none" };
}

/** True when URL looks like Supabase session pooler / direct (port 5432). */
export function isLikelySessionModePostgresUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    const port = parsed.port || (parsed.protocol === "postgresql:" || parsed.protocol === "postgres:" ? "5432" : "");
    return port === "5432";
  } catch {
    return /:(?:5432)(?:\/|\?|$)/.test(url);
  }
}

function resolveMastraPgPoolMax(env: NodeJS.ProcessEnv = process.env): number {
  const parsed = Number(env.MASTRA_PG_POOL_MAX ?? String(DEFAULT_PG_POOL_MAX));
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_PG_POOL_MAX;
}

/**
 * IPI-777: explicit SSL opt-in, matching the Mastra docs' own conditional pattern —
 * but returning `undefined` (not `false`) for the non-opt-in case is load-bearing.
 *
 * `@mastra/pg`'s `PostgresStore` does its OWN connection-string merge in
 * `buildConnectionStringPoolConfig()` (not the raw `pg` driver's):
 *   { ...parse(connectionString), ...(config.ssl !== undefined ? { ssl: config.ssl } : {}) }
 * An explicit `ssl` key — including `false` — always wins over whatever the
 * connection string's own `sslmode=` parsed to, because it's spread last.
 * Passing `ssl: false` unconditionally would silently downgrade to plaintext
 * any connection string that already opts in via `?sslmode=require`. Only
 * return a real value when explicitly forcing SSL on; otherwise return
 * `undefined` so `config.ssl !== undefined` is false and the connection
 * string's own `sslmode=` (or its absence) passes through unmodified.
 */
function resolveMastraPgSslOption(
  env: NodeJS.ProcessEnv = process.env,
): { rejectUnauthorized: false } | undefined {
  return env.DATABASE_SSL === "true" ? { rejectUnauthorized: false } : undefined;
}

/**
 * IPI-630 — which Postgres schema Mastra PostgresStore targets.
 * Default **public** until Wave E: set `MASTRA_SCHEMA=mastra` only in the same
 * deploy window as IPI-784 / #614 (after SET SCHEMA cutover). Activating early
 * points the app at empty mastra.* while history still lives in public.mastra_*.
 */
export function resolveMastraSchemaName(env: NodeJS.ProcessEnv = process.env): string {
  const raw = (env.MASTRA_SCHEMA ?? "public").trim();
  return raw.length > 0 ? raw : "public";
}

const MASTRA_PG_APPLICATION_NAME = "ipix-mastra";

/**
 * IPI-777: tag every Mastra Postgres connection with a stable `application_name`
 * so `pg_stat_activity` can isolate this app's connections from Supabase's own
 * internal/management sessions when auditing SSL, pool usage, etc. `PostgresStore`
 * has no code-level `application_name` option (unlike `ssl`/`max`), so it must be
 * carried on the connection string itself — `pg-connection-string`'s `parse()`
 * picks up any query param generically and it flows through to the Pool config.
 * Never overrides an operator-set `application_name` already on the URL.
 */
export function withMastraApplicationName(
  url: string,
  appName: string = MASTRA_PG_APPLICATION_NAME,
): string {
  if (!url) return url;
  try {
    const parsed = new URL(url);
    if (!parsed.searchParams.has("application_name")) {
      parsed.searchParams.set("application_name", appName);
    }
    return parsed.toString();
  } catch {
    // Malformed/non-standard connection string (e.g. unix socket) — pass through untouched.
    return url;
  }
}

/**
 * Loud once-per-process when Mastra would open a session-mode pool.
 * next + mastra are separate OS processes → worst case 2×max clients (IPI-740).
 * Does not throw — keep DATABASE_URL fallback for CI / gradual rollout.
 */
export function warnIfMastraSessionPoolFallback(
  opts: {
    url: string;
    source: MastraDatabaseUrlSource;
    poolMax: number;
  },
  env: NodeJS.ProcessEnv = process.env,
  log: { warn: (msg: string) => void } = console,
): void {
  const g = globalThis as IpixMastraGlobal & { __ipixMastraSessionPoolWarned?: boolean };
  if (g.__ipixMastraSessionPoolWarned) return;
  if (opts.source === "none" || !opts.url) return;

  const sessionPort = isLikelySessionModePostgresUrl(opts.url);
  const usingDatabaseFallback = opts.source === "database";
  if (!usingDatabaseFallback && !sessionPort) return;

  g.__ipixMastraSessionPoolWarned = true;
  const reasons: string[] = [];
  if (usingDatabaseFallback) {
    reasons.push("MASTRA_DATABASE_URL unset — falling back to DATABASE_URL");
  }
  if (sessionPort) {
    reasons.push("connection port is 5432 (session/direct), not transaction 6543");
  }
  log.warn(
    `[mastra] IPI-740 session-pool risk: ${reasons.join("; ")}. ` +
      `Set MASTRA_DATABASE_URL to the Supabase transaction pooler (:6543). ` +
      `next dev + mastra dev are separate processes — up to 2×${opts.poolMax} clients ` +
      `if both hit session :5432 (pool_size 15 → EMAXCONNSESSION). ` +
      `Keep DATABASE_URL on session for psql/CI (IPI-678).` +
      (env.CI ? " (CI may ignore — prefer setting MASTRA_DATABASE_URL in Infisical/Vercel.)" : ""),
  );
}

function requireProductionDatabaseUrl(env: NodeJS.ProcessEnv = process.env): void {
  if (env.NODE_ENV !== "production" || env.CI) return;

  const target = isVercelRuntime(env) ? "Vercel production" : "production";
  console.error(
    `[mastra] MASTRA_DATABASE_URL / DATABASE_URL missing in ${target} — durable storage unavailable. ` +
      "CopilotKit /info may still list agents; agent runs requiring memory return 503 " +
      "storage_unavailable until MASTRA_DATABASE_URL (transaction :6543) or DATABASE_URL is set and redeployed.",
  );
  throw new MastraStorageUnavailableError(
    `MASTRA_DATABASE_URL or DATABASE_URL is required in ${target}. ` +
      "Prefer MASTRA_DATABASE_URL = Supabase transaction pooler (port 6543); keep session DATABASE_URL for psql/CI (IPI-678).",
  );
}

function createPostgresStore(url: string, env: NodeJS.ProcessEnv = process.env): PostgresStoreType {
  // IPI-740: Cap pool size. next dev and mastra dev are separate OS processes —
  // each gets its own pool (worst case 2× max on session :5432). Transaction
  // MASTRA_DATABASE_URL (:6543) + per-process max is the real fix.
  // IPI-630: disableInit always — tables come from migrations (IPI-628), never
  // runtime DDL. schemaName stays "public" until Wave E sets MASTRA_SCHEMA=mastra
  // in the same window as IPI-784 / #614 SET SCHEMA cutover (do not activate early).
  return new MastraPg.PostgresStore({
    id: "mastra-storage",
    connectionString: withMastraApplicationName(url),
    schemaName: resolveMastraSchemaName(env),
    disableInit: true,
    max: resolveMastraPgPoolMax(env),
    idleTimeoutMillis: PG_IDLE_TIMEOUT_MS,
    ssl: resolveMastraPgSslOption(env),
  });
}

export function getMastraStorage(): MastraAppStorage {
  // Worker / explicit noop first — never run missing-URL latch recovery into Postgres.
  // Once this process chose InMemory for Workers (IPI-490), keep that backend.
  if (shouldSkipMastraPostgresStorage()) {
    if (cachedStorageUnavailableError) {
      // Durable PG is not used here; drop a prior missing-URL latch so health is not sticky.
      cachedStorageUnavailableError = undefined;
    }
    if (!storage) {
      const { url } = resolveMastraDatabaseUrlWithSource();
      if (url) {
        console.warn(
          "[mastra] Using InMemoryStore on Workers (IPI-490: PostgresStore/pg.Pool hangs). " +
            "Agent runs without durable memory until Hyperdrive Client path (IPI-619/623).",
        );
      }
      // Real Mastra store (getStore("memory") etc.) — bare stubs break agent.stream after RUN_STARTED.
      storage = new InMemoryStore({ id: "mastra-storage-memory" });
    }
    return storage;
  }

  // Scope: missing-env-var only. Transient connection errors bubble; do not latch.
  // Keep the latch until durable PostgresStore init succeeds so health does not
  // flip "recovered" while createPostgresStore / assertPostgresStoreModule still throws.
  const recoveringFromMissingUrlLatch = Boolean(cachedStorageUnavailableError);
  if (cachedStorageUnavailableError) {
    const { url } = resolveMastraDatabaseUrlWithSource();
    if (!url) {
      throw cachedStorageUnavailableError;
    }
  }
  if (!storage) {
    const { url, source } = resolveMastraDatabaseUrlWithSource();

    if (!url) {
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
      // IPI-620B: OpenNext no longer aliases this to cf-mastra-pg-stub; assert still
      // guards if a stub is reintroduced under MASTRA_STORAGE_MODE=pg.
      assertPostgresStoreModule(MastraPg);
      const poolMax = resolveMastraPgPoolMax();
      warnIfMastraSessionPoolFallback({ url, source, poolMax });
      const g = globalThis as IpixMastraGlobal;
      // Dev HMR: Next can re-eval this module; reuse one pool inside this process.
      if (process.env.NODE_ENV !== "production" && g.__ipixMastraPgStore) {
        storage = g.__ipixMastraPgStore;
      } else {
        storage = createPostgresStore(url);
        if (process.env.NODE_ENV !== "production") {
          g.__ipixMastraPgStore = storage as PostgresStoreType;
        }
      }
      if (recoveringFromMissingUrlLatch) {
        cachedStorageUnavailableError = undefined;
        console.warn(
          "[mastra] IPI-778: MASTRA_DATABASE_URL / DATABASE_URL now set — clearing storage degraded latch.",
        );
      }
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
