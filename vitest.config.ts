import { defineConfig } from "vitest/config";
import codspeedPlugin from "@codspeed/vitest-plugin";

// Vitest is used here only to run CodSpeed benchmarks (bench/**/*.bench.mjs).
// The project's functional tests continue to run via `node --test`.
export default defineConfig({
  plugins: [codspeedPlugin()],
  test: {
    benchmark: {
      include: ["bench/**/*.bench.mjs"],
    },
  },
});
