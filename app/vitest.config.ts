import { resolve } from "node:path";
import { defineConfig } from "vitest/config";

// Test runner for the operator app. Node environment is enough for the current
// registry/agent contract tests; add jsdom + RTL when component tests land.
export default defineConfig({
  resolve: {
    alias: { "@": resolve(__dirname, "src") },
  },
  test: {
    environment: "node",
    include: ["src/**/*.{test,spec}.{ts,tsx}", "scripts/**/*.test.mjs"],
  },
});
