/**
 * Wrangler alias stub — IPI-490 · CF-MIG-210.
 *
 * `@mastra/pg` + `pg` are proven in the Worker bundle (~0.6 MiB) via a static
 * import in `src/mastra/storage.ts`, but `wrangler.jsonc` sets
 * `MASTRA_STORAGE_MODE=noop` and Workers default to InMemoryStore (IPI-633).
 * Node `next dev` / Vitest keep the real package (this alias is Wrangler-only).
 */
export class PostgresStore {
  constructor() {
    throw new Error(
      "@mastra/pg is stubbed in the Cloudflare Worker bundle (IPI-490). " +
        "Use MASTRA_STORAGE_MODE=noop / InMemoryStore, or Hyperdrive Client path (IPI-619/623).",
    );
  }
}
