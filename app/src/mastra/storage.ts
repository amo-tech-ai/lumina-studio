import { PostgresStore } from "@mastra/pg";

let storage: PostgresStore | undefined;

export function getMastraStorage(): PostgresStore {
  if (!storage) {
    const url = process.env.DATABASE_URL ?? "";
    if (!url) {
      if (process.env.NODE_ENV === "production") {
        throw new Error(
          "DATABASE_URL is required in production. Set it to the Supabase pooler connection string (port 6543).",
        );
      }
      // ponytail: no-op stub at build/test time — agents import this at module eval,
      // but no DB call happens until an actual agent turn.
      // Mastra wraps storage in storageWithInit proxy: constructor calls init() then
      // __setLogger() — both must exist as no-ops to avoid unhandled rejections.
      return { init: async () => {}, __setLogger: () => {} } as unknown as PostgresStore;
    }
    storage = new PostgresStore({ id: "mastra-storage", connectionString: url });
  }
  return storage;
}
