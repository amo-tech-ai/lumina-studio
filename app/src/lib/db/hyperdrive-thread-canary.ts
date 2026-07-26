/**
 * IPI-623 · CF-DB-009 — Hyperdrive Mastra thread canary (create → immediate-read).
 * IPI-823 · CF-DB-009c — post-merge harden: slot retention, idempotent cleanup, latency.
 *
 * Reuses IPI-619 binding (`HYPERDRIVE_FRESH`) + IPI-620 patterns:
 * request-scoped `PostgresStore` (`max: 1`, `disableInit: true`, schema `mastra`).
 * Does **not** flip production `MASTRA_STORAGE_MODE` (stays noop / InMemory).
 *
 * Hard caps: concurrency ≤3; feature-flag + isolate circuit-breaker rollback.
 * Thread ids from Idempotency-Key are scoped by resourceId (Mastra createThread ownership).
 *
 * Timeout + semaphore: on client timeout the HTTP path returns immediately, but the
 * isolate slot stays held until the in-flight roundtrip settles or
 * `HD_THREAD_CANARY_ORPHAN_TIMEOUT_MS` elapses (whichever first), then cleanup/close.
 * That prevents stacked PostgresStore pools past the concurrency cap.
 */
import { createHash } from "node:crypto";
import type { StorageThreadType } from "@mastra/core/memory";
import type { HyperdriveBinding } from "./hyperdrive-query";
import { requireResourceId } from "./mastra-tenant-scope";

export const HD_THREAD_CANARY_MAX_CONCURRENCY = 3;
export const HD_THREAD_CANARY_DEFAULT_CONCURRENCY = 1;
export const HD_THREAD_CANARY_TIMEOUT_MS = 15_000;
/** Bound cleanup/close so a hung delete cannot outlive the request. */
export const HD_THREAD_CANARY_CLEANUP_TIMEOUT_MS = 2_000;
/**
 * After a client-facing timeout, keep the semaphore slot until the underlying
 * DB work settles — or this orphan bound elapses, whichever first.
 */
export const HD_THREAD_CANARY_ORPHAN_TIMEOUT_MS = 5_000;
export const HD_THREAD_CANARY_IDEMPOTENCY_KEY_MAX = 256;
/** Consecutive isolate failures before auto-disable (in-memory; wrangler var is durable kill). */
export const HD_THREAD_CANARY_FAILURE_THRESHOLD = 3;

export type CanaryErrorClass =
  | "timeout"
  | "retryable"
  | "fatal"
  | "roundtrip_failed"
  | "none";

export type ThreadCanaryResult = {
  ok: boolean;
  threadId: string;
  resourceId: string;
  matched: boolean;
  wrote: boolean;
  duplicateWrite: boolean;
  cleanedUp: boolean;
  /** Create→read roundtrip only (excludes cleanup/close). */
  latencyMs: number;
  /** Time spent in delete/close after roundtrip (when cleanup ran). */
  cleanupLatencyMs?: number;
  errorClass: CanaryErrorClass;
  error?: string;
  crossTenant: boolean;
};

type MemoryStore = {
  saveThread: (args: { thread: StorageThreadType }) => Promise<unknown>;
  getThreadById: (args: {
    threadId: string;
  }) => Promise<{ id: string; resourceId?: string } | null>;
  deleteThread: (args: { threadId: string }) => Promise<unknown>;
};

export type PostgresStoreCtor = new (config: {
  id: string;
  connectionString: string;
  schemaName: string;
  disableInit: boolean;
  max: number;
  idleTimeoutMillis: number;
}) => {
  getStore: (name: "memory") => Promise<MemoryStore | null>;
  close: () => Promise<void>;
};

type CircuitState = { consecutiveFailures: number; rolledBack: boolean };

const g = globalThis as typeof globalThis & {
  __ipixHdThreadCanaryCircuit?: CircuitState;
  __ipixHdThreadCanaryInFlight?: number;
  /** Bumped by test resets so fire-and-forget releases do not double-decrement. */
  __ipixHdThreadCanarySlotEpoch?: number;
};

function circuit(): CircuitState {
  if (!g.__ipixHdThreadCanaryCircuit) {
    g.__ipixHdThreadCanaryCircuit = { consecutiveFailures: 0, rolledBack: false };
  }
  return g.__ipixHdThreadCanaryCircuit;
}

/** Isolate-local auto-rollback after consecutive failures. */
export function isCanaryCircuitOpen(): boolean {
  return circuit().rolledBack;
}

export function recordCanarySuccess(): void {
  const c = circuit();
  c.consecutiveFailures = 0;
  c.rolledBack = false;
}

export function recordCanaryFailure(): void {
  const c = circuit();
  c.consecutiveFailures += 1;
  if (c.consecutiveFailures >= HD_THREAD_CANARY_FAILURE_THRESHOLD) {
    c.rolledBack = true;
  }
}

/** Test-only reset (circuit + in-flight concurrency). */
export function resetCanaryCircuitForTests(): void {
  g.__ipixHdThreadCanaryCircuit = { consecutiveFailures: 0, rolledBack: false };
  g.__ipixHdThreadCanaryInFlight = 0;
  g.__ipixHdThreadCanarySlotEpoch = (g.__ipixHdThreadCanarySlotEpoch ?? 0) + 1;
}

export function resetCanaryConcurrencyForTests(): void {
  g.__ipixHdThreadCanaryInFlight = 0;
  g.__ipixHdThreadCanarySlotEpoch = (g.__ipixHdThreadCanarySlotEpoch ?? 0) + 1;
}

/** Test helper: current isolate semaphore occupancy. */
export function getCanaryInFlightForTests(): number {
  return g.__ipixHdThreadCanaryInFlight ?? 0;
}

function tryAcquireCanarySlot(): boolean {
  const n = g.__ipixHdThreadCanaryInFlight ?? 0;
  if (n >= HD_THREAD_CANARY_MAX_CONCURRENCY) return false;
  g.__ipixHdThreadCanaryInFlight = n + 1;
  return true;
}

function releaseCanarySlot(): void {
  const n = g.__ipixHdThreadCanaryInFlight ?? 0;
  g.__ipixHdThreadCanaryInFlight = Math.max(0, n - 1);
}

export function clampCanaryConcurrency(raw: unknown): number {
  const n = Number(raw);
  if (!Number.isFinite(n)) return HD_THREAD_CANARY_DEFAULT_CONCURRENCY;
  return Math.min(
    Math.max(Math.trunc(n), HD_THREAD_CANARY_DEFAULT_CONCURRENCY),
    HD_THREAD_CANARY_MAX_CONCURRENCY,
  );
}

/**
 * Deterministic thread id from Idempotency-Key scoped by resourceId.
 * Same key + different tenants ⇒ different ids (Mastra resourceId ownership).
 */
export function threadIdFromIdempotencyKey(key: string, resourceId: string): string {
  const trimmedKey = key.trim();
  if (!trimmedKey) {
    throw new Error("invalid_idempotency_key: empty after trim");
  }
  if (trimmedKey.length > HD_THREAD_CANARY_IDEMPOTENCY_KEY_MAX) {
    throw new Error(
      `invalid_idempotency_key: exceeds max length ${HD_THREAD_CANARY_IDEMPOTENCY_KEY_MAX}`,
    );
  }
  const digest = createHash("sha256")
    .update(`${resourceId}\0${trimmedKey}`)
    .digest("hex")
    .slice(0, 32);
  return `ipi-623-canary-${digest}`;
}

export function classifyCanaryError(error: unknown): CanaryErrorClass {
  const msg = error instanceof Error ? error.message : String(error);
  const lower = msg.toLowerCase();
  if (lower.includes("timeout") || lower.includes("timed out") || lower.includes("aborted")) {
    return "timeout";
  }
  if (
    lower.includes("connection") ||
    lower.includes("econnreset") ||
    lower.includes("econnrefused") ||
    lower.includes("too many") ||
    lower.includes("saturat") ||
    lower.includes("53300") || // too_many_connections
    lower.includes("57p03") // cannot_connect_now
  ) {
    return "retryable";
  }
  return "fatal";
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`canary_timeout: exceeded ${ms}ms`)), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (err) => {
        clearTimeout(timer);
        reject(err);
      },
    );
  });
}

function settleOrOrphan(work: Promise<unknown>, orphanMs: number): Promise<void> {
  return Promise.race([
    work.then(
      () => undefined,
      () => undefined,
    ),
    new Promise<void>((resolve) => {
      setTimeout(resolve, orphanMs);
    }),
  ]);
}

export type CreateThreadImmediateReadOpts = {
  resourceId: unknown;
  /** When set, deterministic threadId; skip save if thread already exists for same resource. */
  idempotencyKey?: string;
  /**
   * Keep a newly written Idempotency-Key row after the probe (for cross-request replay).
   * Default false so unique soak keys do not permanently accumulate `mastra_threads` rows.
   * Opt in only when intentionally testing replay (fixed probe key).
   */
  retainForReplay?: boolean;
  timeoutMs?: number;
  cleanup?: boolean;
};

/** Outcome of a canary attempt — callers must schedule `backgroundWork` with waitUntil/after. */
export type CreateThreadCanaryOutcome = {
  result: ThreadCanaryResult;
  /**
   * Present on the client-timeout path: settle orphan DB work, cleanup/close, release slot.
   * Must be registered with Cloudflare `ExecutionContext.waitUntil` or Next.js `after()`
   * before the HTTP response is returned — otherwise the Worker may cancel it.
   */
  backgroundWork?: Promise<void>;
};

/**
 * Locked IPI-623 workload: create one Mastra thread, immediately read it back.
 * Tenant fail-closed via `requireResourceId`. Optional cleanup after proof.
 * Cleanup deletes threads this invocation wrote unless `retainForReplay` (never cross-tenant).
 */
export async function createThreadImmediateRead(
  hyperdrive: HyperdriveBinding,
  PostgresStore: PostgresStoreCtor,
  opts: CreateThreadImmediateReadOpts,
): Promise<CreateThreadCanaryOutcome> {
  const resourceId = requireResourceId(opts.resourceId);
  const threadId =
    opts.idempotencyKey != null
      ? threadIdFromIdempotencyKey(opts.idempotencyKey, resourceId)
      : `ipi-623-canary-${crypto.randomUUID()}`;
  const timeoutMs = opts.timeoutMs ?? HD_THREAD_CANARY_TIMEOUT_MS;
  const cleanup = opts.cleanup !== false;
  // Keyed rows are cleaned by default; opt into retention for intentional replay probes.
  const preserveForReplay =
    opts.idempotencyKey != null && opts.retainForReplay === true;
  const started = Date.now();

  const result: ThreadCanaryResult = {
    ok: false,
    threadId,
    resourceId,
    matched: false,
    wrote: false,
    // ponytail: cannot distinguish ON CONFLICT upsert from insert via PostgresStore API; upgrade when store exposes created|updated
    duplicateWrite: false,
    cleanedUp: false,
    latencyMs: 0,
    errorClass: "none",
    crossTenant: false,
  };

  if (!tryAcquireCanarySlot()) {
    result.errorClass = "retryable";
    result.error = "concurrency_saturated";
    result.latencyMs = Date.now() - started;
    return { result };
  }

  const slotEpoch = g.__ipixHdThreadCanarySlotEpoch ?? 0;
  let slotReleased = false;
  const releaseSlot = () => {
    if (slotReleased) return;
    slotReleased = true;
    // Test resets bump epoch so orphaned fire-and-forget must not double-decrement.
    if ((g.__ipixHdThreadCanarySlotEpoch ?? 0) !== slotEpoch) return;
    releaseCanarySlot();
  };

  let store: InstanceType<PostgresStoreCtor> | undefined;
  /** True only after this invocation successfully persisted the thread. */
  let createdByUs = false;

  const roundtripWork = (async () => {
    store = new PostgresStore({
      id: `mastra-storage-canary-${threadId}`,
      connectionString: hyperdrive.connectionString,
      schemaName: "mastra",
      disableInit: true,
      max: 1,
      idleTimeoutMillis: 5_000,
    });

    const memory = await store.getStore("memory");
    if (!memory) throw new Error("memory domain unavailable on PostgresStore");

    const existing = await memory.getThreadById({ threadId });
    if (existing) {
      if (existing.resourceId && existing.resourceId !== resourceId) {
        result.crossTenant = true;
        throw new Error("cross_tenant: thread resourceId mismatch");
      }
      result.matched = existing.id === threadId;
      result.ok = result.matched;
      result.wrote = false;
      result.duplicateWrite = false;
      return;
    }

    const thread: StorageThreadType = {
      id: threadId,
      resourceId,
      title: "IPI-623 Hyperdrive thread canary",
      createdAt: new Date(),
      updatedAt: new Date(),
      metadata: { canary: "ipi-623", idempotencyKey: opts.idempotencyKey ?? null },
    };
    await memory.saveThread({ thread });
    createdByUs = true;
    result.wrote = true;

    const read = await memory.getThreadById({ threadId });
    if (read?.resourceId && read.resourceId !== resourceId) {
      result.crossTenant = true;
      throw new Error("cross_tenant: read resourceId mismatch");
    }
    result.matched = read?.id === threadId;
    result.ok = result.matched;
    if (!result.matched) {
      result.errorClass = "roundtrip_failed";
      result.error = "roundtrip_failed";
    }
  })();

  let timedOut = false;
  try {
    await withTimeout(roundtripWork, timeoutMs);
  } catch (error) {
    console.error(
      "hyperdrive-thread-canary: create→read failed",
      error instanceof Error ? error.message : error,
    );
    result.errorClass = classifyCanaryError(error);
    result.error =
      result.errorClass === "timeout"
        ? "timeout"
        : result.crossTenant
          ? "cross_tenant"
          : "roundtrip_failed";
    result.ok = false;
    timedOut = result.errorClass === "timeout";
  }

  // Roundtrip latency only — capture before cleanup/close so soak p95 is not inflated.
  result.latencyMs = Date.now() - started;

  const finishCleanupAndRelease = async () => {
    const cleanupStarted = Date.now();
    try {
      if (timedOut) {
        await settleOrOrphan(roundtripWork, HD_THREAD_CANARY_ORPHAN_TIMEOUT_MS);
      }

      // Idempotent keyed rows must survive so the next identical key hits the existing-thread branch.
      if (store && cleanup && createdByUs && !result.crossTenant && !preserveForReplay) {
        try {
          await withTimeout(
            (async () => {
              const memory = await store!.getStore("memory");
              if (memory) {
                await memory.deleteThread({ threadId });
                result.cleanedUp = true;
              }
            })(),
            HD_THREAD_CANARY_CLEANUP_TIMEOUT_MS,
          );
        } catch {
          result.cleanedUp = false;
        }
      }

      if (store) {
        // Bound close so a hung pool cannot stall forever after timeout.
        await withTimeout(store.close(), HD_THREAD_CANARY_CLEANUP_TIMEOUT_MS).catch(() => {});
      }
    } finally {
      result.cleanupLatencyMs = Date.now() - cleanupStarted;
      releaseSlot();
    }
  };

  if (timedOut) {
    // Return timeout immediately; caller must waitUntil/after(backgroundWork) so
    // settle + close + releaseSlot still run after the HTTP response is sent.
    const backgroundWork = finishCleanupAndRelease();
    return { result: { ...result }, backgroundWork };
  }

  await finishCleanupAndRelease();
  return { result };
}
