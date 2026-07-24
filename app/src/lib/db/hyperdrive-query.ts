/**
 * IPI-620 (Part A) · CF-DB-006 — shared Hyperdrive query helper.
 *
 * Follows the official Cloudflare recipe exactly:
 * @see https://developers.cloudflare.com/hyperdrive/examples/connect-to-postgres/postgres-drivers-and-libraries/node-postgres/
 * @see https://developers.cloudflare.com/hyperdrive/concepts/connection-lifecycle/
 *
 * - `new Client()`, never `new Pool()` — Hyperdrive itself is the pool.
 * - Fresh client **inside** each call — never cached at module/global scope.
 * - No `client.end()` — Workers-to-Hyperdrive connections are cleaned up when
 *   the request/invocation ends; calling `end()` after a failed `connect()` can
 *   hang/exit in node-postgres and is unnecessary on Workers.
 * - Minimal structural type (`HyperdriveBinding`), not generated `CloudflareEnv`
 *   (same reason as `CfEnvLike` in `src/lib/ai/cloudflare-models.ts`).
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
  }
}
