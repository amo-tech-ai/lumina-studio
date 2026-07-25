/**
 * IPI-621 · CF-DB-007 — Tenant authorization contract helpers.
 *
 * Live `mastra.*` RLS is a **role gate** (`USING(true)` for
 * `hyperdrive_mastra_runtime`), not multi-tenant org RLS. Tenant isolation is
 * the app's job: every persistence op must pass a verified `resourceId`
 * (and `threadId` when reading a thread) as a parameterized SQL bind.
 *
 * Missing / blank / rewrite attempts fail closed **before** any query runs.
 *
 * ponytail: USING(true) role gate is not multi-tenant isolation — ceiling is
 * app-layer resourceId/threadId binds. Upgrade path:
 * **IPI-146 · MASTRA-GOV-002 — Multi-tenant memory isolation** (wire resourceId
 * into Mastra memory) and **IPI-775 · Add WITH CHECK org-scoping to the 7
 * organizationId-bearing mastra.* tables** (RLS WITH CHECK when org fields
 * are populated).
 */

export class TenantContextError extends Error {
  readonly code = "TENANT_CONTEXT_REQUIRED" as const;

  constructor(message: string) {
    super(message);
    this.name = "TenantContextError";
  }
}

export type TenantKeyName = "resourceId" | "threadId";

/**
 * Fail closed when tenant key is missing, non-string, or blank (after trim).
 *
 * Contract: returns the **canonical** key (`value.trim()`). Callers must use
 * the returned string for binds/comparisons so padded inputs cannot leak.
 * Error shape matches other helpers: `Missing ${name}: refuse query (fail closed)`.
 */
export function requireTenantKey(value: unknown, name: TenantKeyName): string {
  if (typeof value !== "string") {
    throw new TenantContextError(
      `Missing ${name}: refuse query (fail closed)`,
    );
  }
  const canonical = value.trim();
  if (canonical === "") {
    throw new TenantContextError(
      `Missing ${name}: refuse query (fail closed)`,
    );
  }
  return canonical;
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
 * `null` / blank / padded-blank `after` fail closed via requireTenantKey.
 * Comparisons use canonical (trimmed) values.
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
 * clauses — this only validates and returns the canonical bind values.
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
