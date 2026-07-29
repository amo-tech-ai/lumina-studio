// OpenNext Cloudflare adapter — R2 incremental cache optional (CF-MIG P1).
// IPI-490 · CF-MIG-210: IPIX_CF_BUNDLE_STUBS → shiki bridge (scripts/cf-shiki-stub.mjs).
// IPI-706 · CF-BUNDLE-220: same flag also stubs mermaid + katex (streamdown size).
// IPI-844 · CF-DB-012a: same flag also stubs Workers PG scope
// (scripts/cf-mastra-workers-pg-scope-stub.mjs) while MASTRA_STORAGE_MODE=noop.
// IPI-620A/B: `@mastra/pg` / `pg` are NOT stubbed — real packages required for Hyperdrive.
// MASTRA_STORAGE_MODE=noop keeps production Mastra on InMemoryStore (storage.ts skip gate).
import { defineCloudflareConfig } from "@opennextjs/cloudflare";

const cloudflare = defineCloudflareConfig({});

export default {
  ...cloudflare,
  buildCommand: "IPIX_CF_BUNDLE_STUBS=1 MASTRA_STORAGE_MODE=noop npm run build",
};
