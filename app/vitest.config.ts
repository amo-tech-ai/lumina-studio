import { resolve } from "node:path";
import { availableParallelism } from "node:os";
import { defineConfig } from "vitest/config";

// Default (unset) maxWorkers is CPU count — on a shared dev machine that's
// 20+ concurrent forked processes competing with everything else running
// locally (browsers, IDEs, other sessions). A flat CI ceiling has the same
// problem in reverse: GitHub's ubuntu-latest runners are documented as
// 4-core, so a hardcoded 8 would oversubscribe by 2x on the exact CI this
// repo runs on — worse than the unset default, not better. Cap relative to
// what's actually available: never more than the intended ceiling (6 local
// / 8 CI), never more than one less than the real core count, never below 2.
const workers = Math.max(
  2,
  Math.min(process.env.CI ? 8 : 6, availableParallelism() - 1),
);

export default defineConfig({
  resolve: {
    alias: { "@": resolve(__dirname, "src") },
  },
  test: {
    environment: "node",
    include: ["src/**/*.{test,spec}.{ts,tsx}", "scripts/**/*.test.mjs"],
    maxWorkers: workers,
  },
});

