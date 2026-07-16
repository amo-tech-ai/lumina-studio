// OpenNext Cloudflare adapter — R2 incremental cache optional (CF-MIG P1).
// IPI-490 · CF-MIG-210: IPIX_CF_BUNDLE_STUBS → shiki bridge + `@mastra/pg` stubs
// (browser Shiki via CDN; see scripts/cf-shiki-stub.mjs).
import { defineCloudflareConfig } from "@opennextjs/cloudflare";

const cloudflare = defineCloudflareConfig({});

export default {
  ...cloudflare,
  buildCommand: "IPIX_CF_BUNDLE_STUBS=1 npm run build",
};
