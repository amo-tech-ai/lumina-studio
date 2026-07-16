// OpenNext Cloudflare adapter — R2 incremental cache optional (CF-MIG P1).
// IPI-490 · CF-MIG-210: IPIX_CF_BUNDLE_STUBS → shiki bridge + `@mastra/pg` stubs
// (browser Shiki via CDN; see scripts/cf-shiki-stub.mjs).
// MASTRA_STORAGE_MODE=noop is required alongside stubs: Node `next build` is not
// a Workers runtime, so shouldSkipMastraPostgresStorage() stays false when mode
// is unset — a loaded DATABASE_URL would construct PostgresStore from the stub
// (always throws) while agents call getMastraMemory() at module load.
import { defineCloudflareConfig } from "@opennextjs/cloudflare";

const cloudflare = defineCloudflareConfig({});

export default {
  ...cloudflare,
  buildCommand: "IPIX_CF_BUNDLE_STUBS=1 MASTRA_STORAGE_MODE=noop npm run build",
};
