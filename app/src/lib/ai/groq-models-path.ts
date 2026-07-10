import { existsSync } from "node:fs";
import { dirname, join } from "node:path";

// Node-only — used by tests and Mastra dev tooling to locate the repo-root
// `config/groq-models.json` SSOT. Deliberately kept out of `provider.ts` (the
// module Cloudflare Workers imports at runtime) so that module never pulls in
// `node:fs`, even indirectly.
const MAX_BUNDLE_ANCESTOR_HOPS = 8;

/** Walks up from `startDir` looking for `config/groq-models.json` (tests / Mastra dev). */
export function findGroqModelsConfigPath(startDir: string): string {
  let dir = startDir;
  for (let hop = 0; hop < MAX_BUNDLE_ANCESTOR_HOPS; hop += 1) {
    const candidate = join(dir, "config", "groq-models.json");
    if (existsSync(candidate)) return candidate;
    const parent = dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  throw new Error(
    `Could not find config/groq-models.json within ${MAX_BUNDLE_ANCESTOR_HOPS} ancestor directories of "${startDir}"`,
  );
}
