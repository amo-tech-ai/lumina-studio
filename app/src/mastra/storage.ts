import { PostgresStore } from "@mastra/pg";

const GLOBAL_KEY = "__mastra_storage__";

function getGlobalStorage(): PostgresStore | undefined {
  return (globalThis as unknown as Record<string, PostgresStore | undefined>)[GLOBAL_KEY];
}

function setGlobalStorage(store: PostgresStore): void {
  (globalThis as unknown as Record<string, PostgresStore | undefined>)[GLOBAL_KEY] = store;
}

export function getMastraStorage(): PostgresStore {
  let storage = getGlobalStorage();
  if (!storage) {
    const url = process.env.DATABASE_URL;
    if (!url) {
      throw new Error(
        "DATABASE_URL is not set. Add it to .env.local or inject via Infisical.",
      );
    }
    storage = new PostgresStore({
      id: "mastra-storage",
      connectionString: url,
    });
    setGlobalStorage(storage);
  }
  return storage;
}
