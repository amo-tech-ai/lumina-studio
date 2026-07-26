/**
 * IPI-623 · CF-DB-009 — Hyperdrive Mastra thread canary (create → immediate-read).
 *
 * Reuses IPI-619 binding (`HYPERDRIVE_FRESH`) + IPI-620 patterns:
 * request-scoped `PostgresStore` (`max: 1`, `disableInit: true`, schema `mastra`).
 * Does **not** flip production `MASTRA_STORAGE_MODE` (stays noop / InMemory).
 *
 * Hard caps: concurrency ≤3; feature-flag + isolate circuit-breaker rollback.
 */
import { createHash } from "node:crypto";
import type { StorageThreadType } from "@mastra/core/memory";
import type { HyperdriveBinding } from "./hyperdrive-query";
import { requireResourceId } from "./mastra-tenant-scope";

export const HD_THREAD_CANARY_MAX_CONCURRENCY = 3;
export const HD_THREAD_CANARY_DEFAULT_CONCURRENCY = 1;
export const HD_THREAD_CANARY_TIMEOUT_MS = 15_000;
/** Consecutive isolate failures before auto-disable (in-memory; wrangler var is durable kill). */
export const HD_THREAD_CANARY_FAILURE_THRESHOLD = 3;

export type CanaryErrorClass = "timeout" | "retryable" | "fatal" | "none";

export type ThreadCanaryResult = {
  ok: boolean;
  threadId: string;
  resourceId: string;
  matched: boolean;
  wrote: boolean;
  duplicateWrite: boolean;
  cleanedUp: boolean;
  latencyMs: number;
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

/** Test-only reset. */
export function resetCanaryCircuitForTests(): void {
  g.__ipixHdThreadCanaryCircuit = { consecutiveFailures: 0, rolledBack: false };
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
 * Deterministic thread id from Idempotency-Key — same key ⇒ same id ⇒ 0 duplicate writes.
 */
export function threadIdFromIdempotencyKey(key: string): string {
  const digest = createHash("sha256").update(key.trim()).digest("hex").slice(0, 32);
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

export type CreateThreadImmediateReadOpts = {
  resourceId: unknown;
  /** When set, deterministic threadId; skip save if thread already exists for same resource. */
  idempotencyKey?: string;
  timeoutMs?: number;
  cleanup?: boolean;
};

/**
 * Locked IPI-623 workload: create one Mastra thread, immediately read it back.
 * Tenant fail-closed via `requireResourceId`. Optional cleanup after proof.
 */
export async function createThreadImmediateRead(
  hyperdrive: HyperdriveBinding,
  PostgresStore: PostgresStoreCtor,
  opts: CreateThreadImmediateReadOpts,
): Promise<ThreadCanaryResult> {
  const resourceId = requireResourceId(opts.resourceId);
  const threadId = opts.idempotencyKey?.trim()
    ? threadIdFromIdempotencyKey(opts.idempotencyKey)
    : `ipi-623-canary-${crypto.randomUUID()}`;
  const timeoutMs = opts.timeoutMs ?? HD_THREAD_CANARY_TIMEOUT_MS;
  const cleanup = opts.cleanup !== false;
  const started = Date.now();

  const result: ThreadCanaryResult = {
    ok: false,
    threadId,
    resourceId,
    matched: false,
    wrote: false,
    duplicateWrite: false,
    cleanedUp: false,
    latencyMs: 0,
    errorClass: "none",
    crossTenant: false,
  };

  const store = new PostgresStore({
    id: `mastra-storage-canary-${threadId}`,
    connectionString: hyperdrive.connectionString,
    schemaName: "mastra",
    disableInit: true,
    max: 1,
    idleTimeoutMillis: 5_000,
  });

  try {
    await withTimeout(
      (async () => {
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
        result.wrote = true;

        const read = await memory.getThreadById({ threadId });
        if (read?.resourceId && read.resourceId !== resourceId) {
          result.crossTenant = true;
          throw new Error("cross_tenant: read resourceId mismatch");
        }
        result.matched = read?.id === threadId;
        result.ok = result.matched;
      })(),
      timeoutMs,
    );
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
  } finally {
    if (cleanup) {
      try {
        const memory = await store.getStore("memory");
        if (memory) {
          await memory.deleteThread({ threadId });
          result.cleanedUp = true;
        }
      } catch {
        result.cleanedUp = false;
      }
    }
    await store.close().catch(() => {});
    result.latencyMs = Date.now() - started;
  }

  return result;
}
