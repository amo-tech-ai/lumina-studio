/**
 * Build-time stub for `@ast-grep/napi`.
 *
 * OpenNext CLI still uses the real native addon in-process (`astCodePatcher.js`).
 * Mastra 1.59 workspace AST-edit also does `import("@ast-grep/napi")`, and OpenNext
 * esbuild follows that into linux `.node` files. This module is the Worker-graph
 * replacement only — it is never executed on a successful planner/shoot path.
 */
export const Lang = {};
export function parse() {
  throw new Error("@ast-grep/napi is unavailable in the Cloudflare Workers runtime");
}
export default { Lang, parse };
