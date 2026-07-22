/**
 * IPI-620 (Part B) · CF-DB-006 — PostgresStore + Hyperdrive compatibility spike.
 *
 * Disabled by default via ENABLE_HYPERDRIVE_PG_SMOKE=false; enable only for preview proof.
 * This route never touches the production Mastra storage path — `MASTRA_STORAGE_MODE`
 * stays "noop" and `getMastraStorage()` (src/mastra/storage.ts) is untouched. It builds its
 * own request-scoped `PostgresStore` purely to prove/disprove Workers-runtime
 * compatibility with the Hyperdrive binding ahead of IPI-623's real workload migration.
 *
 * Follows the same disabled-by-default / secret-gated pattern as the IPI-586 AI Gateway
 * smoke route (src/app/api/internal/cloudflare-ai-gateway-smoke/route.ts).
 */
import { NextResponse } from "next/server";
import { createHash, timingSafeEqual } from "node:crypto";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { PostgresStore } from "@mastra/pg";
import type { StorageThreadType } from "@mastra/core/memory";

export const dynamic = "force-dynamic";

const MIN_CONCURRENCY = 2;
const MAX_CONCURRENCY = 10;
const DEFAULT_CONCURRENCY = 5;

type HyperdriveBinding = { connectionString: string };

type SmokeEnv = {
  HYPERDRIVE_FRESH?: HyperdriveBinding;
  ENABLE_HYPERDRIVE_PG_SMOKE?: string;
  INTERNAL_WEBHOOK_SECRET?: string;
};

function isSmokeEnabled(envFlag: string | undefined): boolean {
  const flag = envFlag ?? process.env.ENABLE_HYPERDRIVE_PG_SMOKE;
  return String(flag) === "true";
}

function secretsEqual(provided: string, expected: string): boolean {
  const a = createHash("sha256").update(provided).digest();
  const b = createHash("sha256").update(expected).digest();
  return timingSafeEqual(a, b);
}

function json(status: number, body: Record<string, unknown>) {
  return NextResponse.json(body, { status });
}

type RoundtripResult = {
  ok: boolean;
  threadId: string;
  matched: boolean;
  latencyMs: number;
  error?: string;
};

/**
 * One thread create + read roundtrip against a fresh, request-scoped `PostgresStore`.
 * Never cached at module/global scope — a new store (and its internal `pg.Pool`) is
 * created and closed within this single call, per Cloudflare's documented rule against
 * global-scope DB clients in Workers.
 */
async function threadRoundtrip(hyperdrive: HyperdriveBinding): Promise<RoundtripResult> {
  const threadId = `ipi-620b-smoke-${crypto.randomUUID()}`;
  const started = Date.now();
  const store = new PostgresStore({
    id: `mastra-storage-spike-${threadId}`,
    connectionString: hyperdrive.connectionString,
    schemaName: "mastra",
    disableInit: true,
    max: 1,
    idleTimeoutMillis: 5_000,
  });

  try {
    const memory = await store.getStore("memory");
    if (!memory) throw new Error("memory domain unavailable on PostgresStore");

    const thread: StorageThreadType = {
      id: threadId,
      resourceId: "ipi-620b-spike",
      title: "IPI-620B Hyperdrive smoke",
      createdAt: new Date(),
      updatedAt: new Date(),
      metadata: { spike: "ipi-620b" },
    };
    await memory.saveThread({ thread });
    const read = await memory.getThreadById({ threadId });
    // Best-effort cleanup so repeated smoke runs don't accumulate rows in `mastra.mastra_threads`.
    await memory.deleteThread({ threadId }).catch(() => {});

    return {
      ok: true,
      threadId,
      matched: read?.id === threadId,
      latencyMs: Date.now() - started,
    };
  } catch (error) {
    return {
      ok: false,
      threadId,
      matched: false,
      latencyMs: Date.now() - started,
      error: error instanceof Error ? error.message : "unknown error",
    };
  } finally {
    // Graceful cleanup (recommended, not a hard CF requirement — Workers free
    // sockets at invocation end regardless).
    await store.close().catch(() => {});
  }
}

export async function POST(request: Request) {
  const requestId = crypto.randomUUID();
  const cfRay = request.headers.get("cf-ray") ?? undefined;

  let env: SmokeEnv | undefined;
  try {
    const ctx = await getCloudflareContext({ async: true });
    env = ctx.env as SmokeEnv | undefined;
  } catch {
    // Node / Vitest — fall through; flag/secret still read from process.env
  }

  if (!isSmokeEnabled(env?.ENABLE_HYPERDRIVE_PG_SMOKE)) {
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

  const hyperdrive = env?.HYPERDRIVE_FRESH;
  if (!hyperdrive?.connectionString) {
    return json(503, {
      ok: false,
      error: "hyperdrive_binding_missing",
      detail: "env.HYPERDRIVE_FRESH unavailable — confirm IPI-619 binding merged + Worker runtime",
      requestId,
      cfRay,
    });
  }

  let body: { mode?: string; concurrency?: number } = {};
  try {
    body = await request.json();
  } catch {
    // no body / not JSON — default to single mode
  }

  const mode = body.mode === "concurrent" ? "concurrent" : "single";
  const started = Date.now();

  if (mode === "single") {
    const result = await threadRoundtrip(hyperdrive);
    return json(result.ok && result.matched ? 200 : 502, {
      ok: result.ok && result.matched,
      requestId,
      cfRay,
      mode,
      latencyMs: Date.now() - started,
      result,
    });
  }

  const concurrency = Math.min(
    Math.max(Number(body.concurrency ?? DEFAULT_CONCURRENCY) || DEFAULT_CONCURRENCY, MIN_CONCURRENCY),
    MAX_CONCURRENCY,
  );
  const results = await Promise.all(
    Array.from({ length: concurrency }, () => threadRoundtrip(hyperdrive)),
  );
  const failures = results.filter((r) => !r.ok || !r.matched);

  return json(failures.length === 0 ? 200 : 502, {
    ok: failures.length === 0,
    requestId,
    cfRay,
    mode,
    concurrency,
    latencyMs: Date.now() - started,
    successCount: results.length - failures.length,
    failureCount: failures.length,
    results,
  });
}
