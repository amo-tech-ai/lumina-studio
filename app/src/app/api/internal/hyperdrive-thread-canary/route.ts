/**
 * IPI-623 · CF-DB-009 — Hyperdrive thread canary (create → immediate-read).
 *
 * Disabled by default via ENABLE_HYPERDRIVE_THREAD_CANARY=false (env / process.env).
 * Reuses HYPERDRIVE_FRESH (IPI-619) + PostgresStore spike pattern (IPI-620B).
 * Does **not** change production `MASTRA_STORAGE_MODE` (stays noop).
 *
 * Concurrency hard-capped at 3 (IPI-620 spike: 3 PASS / 5 FAIL).
 * Isolate circuit-breaker auto-rolls back after consecutive failures;
 * durable kill remains the env flag (set false / version rollback).
 */
import { after, NextResponse } from "next/server";
import { createHash, timingSafeEqual } from "node:crypto";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import type { HyperdriveBinding } from "@/lib/db/hyperdrive-query";
import {
  clampCanaryConcurrency,
  createThreadImmediateRead,
  HD_THREAD_CANARY_MAX_CONCURRENCY,
  isCanaryCircuitOpen,
  recordCanaryFailure,
  recordCanarySuccess,
  threadIdFromIdempotencyKey,
  type PostgresStoreCtor,
  type ThreadCanaryResult,
} from "@/lib/db/hyperdrive-thread-canary";

export const dynamic = "force-dynamic";

type CanaryEnv = {
  HYPERDRIVE_FRESH?: HyperdriveBinding;
  ENABLE_HYPERDRIVE_THREAD_CANARY?: string;
  INTERNAL_WEBHOOK_SECRET?: string;
};

type CanaryBody = {
  mode?: string;
  concurrency?: number;
  resourceId?: string;
  /** Opt-in: keep Idempotency-Key rows for cross-request replay (default cleans them). */
  retainForReplay?: boolean;
};

type WaitUntilFn = (promise: Promise<unknown>) => void;

/** Keep timeout cleanup alive after the response (Worker waitUntil, else Next after). */
function scheduleCanaryBackground(work: Promise<void>, waitUntil?: WaitUntilFn) {
  const safe = work.catch((err) => {
    console.error(
      "hyperdrive-thread-canary: background cleanup failed",
      err instanceof Error ? err.message : err,
    );
  });
  if (waitUntil) {
    waitUntil(safe);
    return;
  }
  after(() => safe);
}

function isCanaryEnabled(envFlag: string | undefined): boolean {
  const flag = envFlag ?? process.env.ENABLE_HYPERDRIVE_THREAD_CANARY;
  return String(flag) === "true";
}

function secretsEqual(provided: string, expected: string): boolean {
  const a = createHash("sha256").update(provided).digest();
  const b = createHash("sha256").update(expected).digest();
  return timingSafeEqual(a, b);
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function json(status: number, body: Record<string, unknown>) {
  return NextResponse.json(body, { status });
}

async function loadPostgresStore(): Promise<PostgresStoreCtor> {
  const mod = (await import("@mastra/pg")) as {
    IPIX_CF_MASTRA_PG_STUB?: boolean;
    PostgresStore?: PostgresStoreCtor;
  };
  if (mod.IPIX_CF_MASTRA_PG_STUB === true) {
    throw new Error(
      "stubbed_mastra_pg: Worker still aliases @mastra/pg to cf-mastra-pg-stub.mjs — cannot run canary",
    );
  }
  if (typeof mod.PostgresStore !== "function") {
    throw new Error("missing_postgres_store: @mastra/pg did not export PostgresStore");
  }
  return mod.PostgresStore;
}

function proofFields(stubbed = false) {
  return {
    adapter: "@mastra/pg" as const,
    transport: "hyperdrive" as const,
    schemaName: "mastra" as const,
    disableInit: true as const,
    workload: "create_thread_immediate_read" as const,
    maxConcurrency: HD_THREAD_CANARY_MAX_CONCURRENCY,
    stubbed,
  };
}

function p95LatencyMs(results: ThreadCanaryResult[]): number | null {
  if (results.length === 0) return null;
  const sorted = results.map((r) => r.latencyMs).toSorted((a, b) => a - b);
  const idx = Math.min(sorted.length - 1, Math.ceil(sorted.length * 0.95) - 1);
  return sorted[Math.max(0, idx)] ?? null;
}

function isConcurrencySaturated(results: ThreadCanaryResult | ThreadCanaryResult[]): boolean {
  const list = Array.isArray(results) ? results : [results];
  return list.some((r) => r.error === "concurrency_saturated");
}

export async function POST(request: Request) {
  const requestId = crypto.randomUUID();
  const cfRay = request.headers.get("cf-ray") ?? undefined;
  const idempotencyKey = request.headers.get("Idempotency-Key") ?? undefined;

  let env: CanaryEnv | undefined;
  let waitUntil: WaitUntilFn | undefined;
  try {
    const cf = await getCloudflareContext({ async: true });
    env = cf.env as CanaryEnv | undefined;
    const cfCtx = (cf as { ctx?: { waitUntil?: WaitUntilFn } }).ctx;
    if (typeof cfCtx?.waitUntil === "function") {
      waitUntil = cfCtx.waitUntil.bind(cfCtx);
    }
  } catch {
    // Node / Vitest
  }

  // Order: enabled → auth → circuit. Unauth must never see rolledBack.
  if (!isCanaryEnabled(env?.ENABLE_HYPERDRIVE_THREAD_CANARY)) {
    return json(404, { ok: false, error: "not_found", requestId, cfRay });
  }

  const expectedSecret = env?.INTERNAL_WEBHOOK_SECRET ?? process.env.INTERNAL_WEBHOOK_SECRET;
  if (!expectedSecret) {
    return json(500, {
      ok: false,
      error: "misconfigured",
      detail: "INTERNAL_WEBHOOK_SECRET missing",
      requestId,
      cfRay,
    });
  }

  const provided = request.headers.get("X-Internal-Secret");
  if (!provided || !secretsEqual(provided, expectedSecret)) {
    return json(401, { ok: false, error: "unauthorized", requestId, cfRay });
  }

  if (isCanaryCircuitOpen()) {
    return json(503, {
      ok: false,
      error: "canary_rolled_back",
      detail:
        "Isolate circuit open after consecutive failures — set ENABLE_HYPERDRIVE_THREAD_CANARY=false (durable) or wait for new isolate",
      rolledBack: true,
      requestId,
      cfRay,
      ...proofFields(),
    });
  }

  const hyperdrive = env?.HYPERDRIVE_FRESH;
  if (!hyperdrive?.connectionString) {
    return json(503, {
      ok: false,
      error: "hyperdrive_binding_missing",
      detail: "env.HYPERDRIVE_FRESH unavailable — confirm IPI-619 binding + Worker runtime",
      requestId,
      cfRay,
    });
  }

  let PostgresStore: PostgresStoreCtor;
  try {
    PostgresStore = await loadPostgresStore();
  } catch (error) {
    recordCanaryFailure();
    return json(502, {
      ok: false,
      error: "stubbed_or_missing_mastra_pg",
      detail: error instanceof Error ? error.message : "unknown",
      requestId,
      cfRay,
      rolledBack: isCanaryCircuitOpen(),
      ...proofFields(true),
    });
  }

  let body: CanaryBody = {};
  try {
    const parsed: unknown = await request.json();
    if (isPlainObject(parsed)) {
      body = parsed as CanaryBody;
    }
  } catch {
    // empty / invalid JSON → treat as missing resourceId
  }

  const resourceId = body.resourceId;
  if (typeof resourceId !== "string" || resourceId.trim() === "") {
    return json(400, {
      ok: false,
      error: "resource_id_required",
      detail: "JSON body.resourceId required (org-scoped; fail closed)",
      requestId,
      cfRay,
    });
  }

  if (idempotencyKey != null) {
    try {
      threadIdFromIdempotencyKey(idempotencyKey, resourceId.trim());
    } catch {
      return json(400, {
        ok: false,
        error: "invalid_idempotency_key",
        detail: "Idempotency-Key must be non-empty after trim and ≤256 chars",
        requestId,
        cfRay,
      });
    }
  }

  const mode = body.mode === "concurrent" ? "concurrent" : "single";
  const started = Date.now();

  const retainForReplay = body.retainForReplay === true;

  if (mode === "single") {
    const { result, backgroundWork } = await createThreadImmediateRead(
      hyperdrive,
      PostgresStore,
      {
        resourceId,
        idempotencyKey,
        retainForReplay,
      },
    );
    if (backgroundWork) scheduleCanaryBackground(backgroundWork, waitUntil);

    if (isConcurrencySaturated(result)) {
      return json(503, {
        ok: false,
        error: "concurrency_saturated",
        detail: "Isolate canary concurrency cap reached — retry shortly",
        requestId,
        cfRay,
        ...proofFields(),
        result,
      });
    }

    const roundtrip = result.ok && result.matched && !result.crossTenant;
    if (roundtrip) recordCanarySuccess();
    else recordCanaryFailure();

    return json(roundtrip ? 200 : 502, {
      ok: roundtrip,
      requestId,
      cfRay,
      idempotencyKey: idempotencyKey ?? null,
      mode,
      latencyMs: Date.now() - started,
      p95LatencyMs: result.latencyMs,
      roundtrip,
      rolledBack: isCanaryCircuitOpen(),
      ...proofFields(),
      result,
    });
  }

  // Concurrent: unique thread ids per attempt (idempotency key only applies to single mode).
  const concurrency = clampCanaryConcurrency(body.concurrency);
  const outcomes = await Promise.all(
    Array.from({ length: concurrency }, () =>
      createThreadImmediateRead(hyperdrive, PostgresStore, { resourceId }),
    ),
  );
  for (const outcome of outcomes) {
    if (outcome.backgroundWork) {
      scheduleCanaryBackground(outcome.backgroundWork, waitUntil);
    }
  }
  const results = outcomes.map((o) => o.result);

  if (isConcurrencySaturated(results)) {
    return json(503, {
      ok: false,
      error: "concurrency_saturated",
      detail: "Isolate canary concurrency cap reached — retry shortly",
      requestId,
      cfRay,
      mode,
      concurrency,
      ...proofFields(),
      results,
    });
  }

  const failures = results.filter((r) => !r.ok || !r.matched || r.crossTenant);
  const roundtrip = failures.length === 0;
  if (roundtrip) recordCanarySuccess();
  else recordCanaryFailure();

  return json(roundtrip ? 200 : 502, {
    ok: roundtrip,
    requestId,
    cfRay,
    mode,
    concurrency,
    latencyMs: Date.now() - started,
    p95LatencyMs: p95LatencyMs(results),
    successCount: results.length - failures.length,
    failureCount: failures.length,
    duplicateWrites: results.filter((r) => r.duplicateWrite).length,
    crossTenantCount: results.filter((r) => r.crossTenant).length,
    roundtrip,
    rolledBack: isCanaryCircuitOpen(),
    ...proofFields(),
    results,
  });
}
