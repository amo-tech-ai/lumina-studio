import { PostgresStore } from "@mastra/pg";

let storage: PostgresStore | undefined;

export function getMastraStorage(): PostgresStore {
  if (!storage) {
    const url = process.env.DATABASE_URL ?? "";
    if (!url) {
      // ponytail: no-op stub at build/test time — agents import this at module eval,
      // but no DB call happens until an actual agent turn. Fails fast at first real use.
      return {} as unknown as PostgresStore;
    }
    storage = new PostgresStore({ id: "mastra-storage", connectionString: url });
  }
  return storage;
}
