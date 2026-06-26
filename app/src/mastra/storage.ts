import { PostgresStore } from "@mastra/pg";

let storage: PostgresStore | undefined;

export function getMastraStorage(): PostgresStore {
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
  }
  return storage;
}
