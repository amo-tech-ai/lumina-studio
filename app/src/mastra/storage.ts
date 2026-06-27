import { PostgresStore } from "@mastra/pg";

let storage: PostgresStore | undefined;

export function getMastraStorage(): PostgresStore {
  if (!storage) {
    const url = process.env.DATABASE_URL ?? "";
    if (!url) {
      // ponytail: no-op stub at build/test time — agents import this at module eval,
      // but no DB call happens until an actual agent turn. Fails fast at first real use.
      // Mastra wraps storage in storageWithInit proxy: constructor calls init() then
      // __setLogger() — both must exist as no-ops to avoid unhandled rejections.
      return { init: async () => {}, __setLogger: () => {} } as unknown as PostgresStore;
    }
    storage = new PostgresStore({ id: "mastra-storage", connectionString: url });
  }
  return storage;
}
