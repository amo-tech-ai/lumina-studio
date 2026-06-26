import { PostgresStore } from "@mastra/pg";

let storage: PostgresStore | undefined;

export function getMastraStorage(): PostgresStore {
  if (!storage) {
    // DATABASE_URL is validated at connection time by PostgresStore, not here —
    // eager throws break Next.js builds and unit tests that import agents.
    storage = new PostgresStore({
      id: "mastra-storage",
      connectionString: process.env.DATABASE_URL ?? "",
    });
  }
  return storage;
}
