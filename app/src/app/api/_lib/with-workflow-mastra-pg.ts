/**
 * IPI-1015 · CF-DB-015 — request-scoped Workers pg for workflow HTTP routes.
 *
 * Storage scope is Next-free (`with-workflow-mastra-pg-scope.ts`) so Mastra
 * Studio can resume Brand Intelligence without importing `next/server`.
 * This file keeps Route Handler JSON helpers.
 */
import { NextResponse } from "next/server";
import { MastraStorageUnavailableError } from "@/mastra/storage";

export {
  WORKFLOW_SNAPSHOT_LOAD_TIMEOUT_MS,
  withWorkflowMastraPg,
  withWorkflowStoreTimeout,
} from "./with-workflow-mastra-pg-scope";

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
