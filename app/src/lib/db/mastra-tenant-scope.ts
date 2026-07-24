/**
 * IPI-621 · CF-DB-007 — Tenant authorization contract helpers.
 *
 * Live `mastra.*` RLS is a **role gate** (`USING(true)` for
 * `hyperdrive_mastra_runtime`), not multi-tenant org RLS. Tenant isolation is
 * the app's job: every persistence op must pass a verified `resourceId`
 * (and `threadId` when reading a thread) as a parameterized SQL bind.
 *
 * Missing / blank / rewrite attempts fail closed **before** any query runs.
 * IPI-146 (memory wiring) and IPI-775 (WITH CHECK org scoping) are out of scope.
 */

export class TenantContextError extends Error {
  readonly code = "TENANT_CONTEXT_REQUIRED" as const;

  constructor(message: string) {
    super(message);
    this.name = "TenantContextError";
  }
}

export type TenantKeyName = "resourceId" | "threadId";

/** Fail closed when tenant key is missing, non-string, or blank. */
export function requireTenantKey(value: unknown, name: TenantKeyName): string {
  if (typeof value !== "string" || value.trim() === "") {
    throw new TenantContextError(
      `Missing ${name}: refuse query (fail closed)`,
    );
  }
  return value;
}

/** Same as requireTenantKey for the canonical Mastra persistence key. */
export function requireResourceId(resourceId: unknown): string {
  return requireTenantKey(resourceId, "resourceId");
}

export function requireThreadId(threadId: unknown): string {
  return requireTenantKey(threadId, "threadId");
}

/**
 * Fail closed when a caller tries to rewrite the tenant key on update/upsert.
 * `after` omitted/undefined means "not touching the key" (allowed).
 */
export function rejectTenantKeyRewrite(
  before: string,
  after: unknown,
  name: TenantKeyName = "resourceId",
): void {
  if (after === undefined) return;
  const next = requireTenantKey(after, name);
  const current = requireTenantKey(before, name);
  if (next !== current) {
    throw new TenantContextError(
      `${name} rewrite denied: refuse query (fail closed)`,
    );
  }
}

/**
 * Bind verified tenant scope for parameterized SQL.
 * Callers must place `resourceId` (and optional `threadId`) in the WHERE/VALUES
 * clauses — this only validates and returns the bind values.
 */
export function bindTenantScope(
  resourceId: unknown,
  threadId?: unknown,
): { resourceId: string; threadId?: string } {
  const scope: { resourceId: string; threadId?: string } = {
    resourceId: requireResourceId(resourceId),
  };
  if (threadId !== undefined) {
    scope.threadId = requireThreadId(threadId);
  }
  return scope;
}
