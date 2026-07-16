// OpenNext Cloudflare adapter — R2 incremental cache optional (CF-MIG P1).
// IPI-490 · CF-MIG-210: set IPIX_CF_BUNDLE_STUBS so next.config turbopack/webpack
// server stubs drop `@shikijs/langs` (~7.6 MiB) from the Worker graph.
import { defineCloudflareConfig } from "@opennextjs/cloudflare";

const cloudflare = defineCloudflareConfig({});

export default {
  ...cloudflare,
  buildCommand: "IPIX_CF_BUNDLE_STUBS=1 npm run build",
};
