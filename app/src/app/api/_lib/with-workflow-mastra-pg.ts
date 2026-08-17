/**
 * IPI-1015 · CF-DB-015 — request-scoped Workers pg for workflow HTTP routes.
 *
 * Reuses `withMastraWorkersPgStorage`. Resolves Hyperdrive here so the scope
 * helper stays OpenNext-free (IPI-844 gzip). CopilotKit keeps its own copy.
 */
import { NextResponse } from "next/server";
import {
  MastraStorageUnavailableError,
  isCloudflareWorkersRuntime,
  shouldSkipMastraPostgresStorage,
} from "@/mastra/storage";

/** Same 503 contract as CopilotKit `storageUnavailableResponse` — no raw internals. */
export function workflowMastraPgErrorResponse(err: unknown): NextResponse | null {
  if (!(err instanceof MastraStorageUnavailableError)) return null;
  return NextResponse.json(
    {
      error: "Workflow persistence unavailable",
      code: "storage_unavailable",
    },
    { status: 503 },
  );
}

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

function workflowErrorKind(
  err: unknown,
): "storage" | "validation" | "conflict" | "other" {
  if (err instanceof MastraStorageUnavailableError) return "storage";
  const name = err instanceof Error ? err.name : "";
  const msg = (err instanceof Error ? err.message : String(err)).toLowerCase();
  if (
    name === "ZodError" ||
    msg.includes("validation") ||
    msg.includes("invalid input") ||
    msg.includes("invalid_type")
  ) {
    return "validation";
  }
  if (
    msg.includes("duplicate") ||
    msg.includes("already exists") ||
    msg.includes("unique constraint") ||
    msg.includes("unique violation")
  ) {
    return "conflict";
  }
  return "other";
}

/**
 * Client-facing workflow errors — never raw Mastra / Postgres / Zod dumps.
 * Storage → 503, bad input → 400, duplicate runId → 409, else generic 500.
 */
export function workflowClientErrorResponse(err: unknown): NextResponse {
  const storage = workflowMastraPgErrorResponse(err);
  if (storage) return storage;
  const kind = workflowErrorKind(err);
  if (kind === "validation") {
    return NextResponse.json(
      { error: "Invalid workflow input", code: "invalid_input" },
      { status: 400 },
    );
  }
  if (kind === "conflict") {
    return NextResponse.json(
      { error: "Workflow run already exists", code: "run_conflict" },
      { status: 409 },
    );
  }
  return NextResponse.json(
    { error: "Workflow request failed", code: "workflow_failed" },
    { status: 500 },
  );
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
