/**
 * IPI-620 (Part A) · CF-DB-006 — shared Hyperdrive query helper.
 *
 * Follows the official Cloudflare recipe exactly:
 * @see https://developers.cloudflare.com/hyperdrive/examples/connect-to-postgres/postgres-database-providers/supabase/
 *
 * - `new Client()`, never `new Pool()` — Hyperdrive itself is the pool, so a
 *   second pool on top is redundant (and wrong per the docs above).
 * - The client is created fresh **inside** the caller's request handler and
 *   passed in as `hyperdrive` — never cached at module/global scope. A
 *   client cached in a global is Cloudflare's #1 documented cause of
 *   Workers connection errors.
 * - Minimal structural type (`HyperdriveBinding`), not the generated
 *   `CloudflareEnv` ambient global — same reason as `CfEnvLike` in
 *   `src/lib/ai/cloudflare-models.ts`: `cloudflare-env.d.ts` doesn't exist
 *   until `npm run cf-typegen` runs, and this file is part of the first
 *   (non-Cloudflare-scoped) tsc pass.
 */
import { Client, type QueryResultRow } from "pg";

export type HyperdriveBinding = { connectionString: string };

/**
 * Run one parameterized query against the Hyperdrive-fronted Postgres
 * connection and return the result rows. Always use `$1, $2, ...`
 * placeholders — never interpolate values into `sql`.
 *
 * Errors are sanitized before leaving this function: callers never see the
 * connection string or the raw driver error (which can include query text).
 */
export async function queryFresh<T extends QueryResultRow = QueryResultRow>(
  hyperdrive: HyperdriveBinding,
  sql: string,
  params: unknown[] = [],
): Promise<T[]> {
  const client = new Client({ connectionString: hyperdrive.connectionString });
  try {
    await client.connect();
    const result = await client.query<T>(sql, params);
    return result.rows;
  } catch (error) {
    // Log the real cause server-side only; never rethrow it to the caller.
    console.error("queryFresh: query failed", error instanceof Error ? error.message : error);
    throw new Error("Database query failed");
  } finally {
    // Not a hard CF requirement (Workers auto-clean connections at
    // invocation end) but still good practice for graceful cleanup.
    await client.end().catch(() => {});
  }
}
