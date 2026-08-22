/**
 * Build-time stub for @mastra/core desktop Workspace.
 *
 * IPI-1016 · CF-BUNDLE-224
 *
 * Mastra 1.59 Agent statically imports hashed `workspace-<hash>.js`
 * (LocalFilesystem, LocalSandbox, AST-edit, execa). iPix Planner / Brand
 * Intelligence / Shoot Wizard never set `config.workspace`. Next turbopack
 * aliases do not apply to OpenNext's second-stage esbuild — that redirect
 * lives in the `@opennextjs/cloudflare` patch (`bundle-server.js`).
 *
 * This module is the Worker-graph replacement only. It throws if executed.
 * Do not stub pg / @mastra/pg. Do not npm-override @mastra/core.
 *
 * Hashed chunk importers bind minified names (`x` = Workspace). The package
 * export `@mastra/core/workspace` binds readable names. Export both.
 */
function unavailable() {
  throw new Error(
    "Mastra Workspace desktop APIs are unavailable in the Cloudflare Workers runtime",
  );
}

export {
  unavailable as A,
  unavailable as B,
  unavailable as C,
  unavailable as D,
  unavailable as E,
  unavailable as F,
  unavailable as G,
  unavailable as H,
  unavailable as I,
  unavailable as J,
  unavailable as K,
  unavailable as L,
  unavailable as M,
  unavailable as N,
  unavailable as O,
  unavailable as P,
  unavailable as R,
  unavailable as S,
  unavailable as T,
  unavailable as U,
  unavailable as V,
  unavailable as W,
  unavailable as Y,
  unavailable as _,
  unavailable as a,
  unavailable as b,
  unavailable as c,
  unavailable as d,
  unavailable as f,
  unavailable as g,
  unavailable as h,
  unavailable as i,
  unavailable as j,
  unavailable as k,
  unavailable as l,
  unavailable as m,
  unavailable as n,
  unavailable as o,
  unavailable as p,
  unavailable as q,
  unavailable as r,
  unavailable as s,
  unavailable as t,
  unavailable as u,
  unavailable as v,
  unavailable as w,
  unavailable as x,
  unavailable as y,
  unavailable as z,
  unavailable as Workspace,
  unavailable as LocalFilesystem,
  unavailable as LocalSandbox,
  unavailable as BM25Index,
  unavailable as createWorkspaceTools,
  unavailable as createSkillTools,
};

export default unavailable;
