import { resolve } from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: { "@": resolve(__dirname, "src") },
  },
  test: {
    environment: "node",
    include: ["src/**/*.{test,spec}.{ts,tsx}", "scripts/**/*.test.mjs"],
    // Default (unset) maxWorkers is CPU count — on a shared dev machine that's
    // 20+ concurrent forked processes competing with everything else running
    // locally (browsers, IDEs, other sessions). CI runners are typically
    // dedicated, so give them more headroom than a local box.
    maxWorkers: process.env.CI ? 8 : 6,
  },
});

