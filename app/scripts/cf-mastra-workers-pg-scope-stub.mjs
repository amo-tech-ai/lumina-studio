/** IPI-844 — OpenNext noop stub for mastra-workers-pg-scope (drop alias for pg flip). */
export const WORKERS_MASTRA_PG_POOL_MAX = 1;
export function assertMastraSchemaForWorkersPg() {
  return "mastra";
}
export function createWorkersHyperdrivePostgresStore() {
  throw new Error("[mastra] PG scope stubbed (IPI-844); rebuild without IPIX_CF_BUNDLE_STUBS for pg");
}
export function getWorkersPgStoreCreateCount() {
  return 0;
}
export function resetWorkersPgStoreCreateCountForTests() {}
export async function withMastraWorkersPgStorage(fn) {
  return await fn();
}
