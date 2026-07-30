/**
 * Alias stub — IPI-490 · CF-MIG-210 (narrowed in IPI-620A).
 *
 * Used only for `@mastra/pg` (PostgresStore). Bare `pg` / `pg-cloudflare` must
 * NOT point here — Hyperdrive `queryFresh` needs real `pg.Client` via workerd
 * conditional exports.
 *
 * Instantiating PostgresStore from this stub always throws — never silent fake.
 * Node `next dev` / Vitest without IPIX_CF_BUNDLE_STUBS keep the real package.
 *
 * Marker: `getMastraStorage()` rejects `MASTRA_STORAGE_MODE=pg` when this
 * stub is what Turbopack aliased (real provider is not in the Worker upload).
 */
export const IPIX_CF_MASTRA_PG_STUB = true;

const MSG =
  "PostgresStore is unavailable in this Worker bundle (IPI-490). " +
  "Use MASTRA_STORAGE_MODE=noop until the approved Hyperdrive path is implemented (IPI-619/623).";

export class PostgresStore {
  constructor() {
    throw new Error(MSG);
  }
}

export default { PostgresStore, IPIX_CF_MASTRA_PG_STUB };
