/**
 * Shared dotenv loading + Supabase env resolution for scripts/*.mjs.
 *
 * Every verification / probe / seed script used to carry its own copy of the
 * `.env.local` parser and its own `NEXT_PUBLIC_* ?? NEXT_* ?? VITE_*` chain.
 * The copies had drifted (some stripped quotes, some did not; the alias
 * precedence differed per script), so they are consolidated here.
 *
 * Alias precedence is `NEXT_PUBLIC_*` → `NEXT_*` → `VITE_*` → bare, matching
 * AGENTS.md: the Next.js operator app is canonical, the Vite app is retiring.
 */
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

/** Repo root, resolved from this file rather than the caller's cwd. */
export const repoRoot = resolve(import.meta.dirname, "..", "..");

export const SUPABASE_URL_ALIASES = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_SUPABASE_URL",
  "VITE_SUPABASE_URL",
  "SUPABASE_URL",
];

export const SUPABASE_ANON_KEY_ALIASES = [
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "NEXT_SUPABASE_PUBLISHABLE_KEY",
  "VITE_SUPABASE_PUBLISHABLE_KEY",
];

export const SUPABASE_DB_URL_ALIASES = ["SUPABASE_DB_URL", "DATABASE_URL"];

/**
 * Parse one KEY=VALUE line. Returns undefined for blanks and comments.
 * Surrounding matching quotes are stripped so `KEY="value"` and `KEY=value`
 * resolve identically.
 */
export function parseEnvLine(line) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) return undefined;
  const eq = trimmed.indexOf("=");
  if (eq === -1) return undefined;
  const key = trimmed.slice(0, eq);
  let value = trimmed.slice(eq + 1).trim();
  if (
    value.length >= 2 &&
    ((value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'")))
  ) {
    value = value.slice(1, -1);
  }
  return { key, value };
}

/**
 * Load KEY=VALUE lines from a dotenv-style file into `env` (first writer wins,
 * so real process env and earlier files always beat later ones). Missing files
 * are ignored — these scripts also run from Infisical / CI secrets.
 */
export function loadEnvFile(path, env = process.env) {
  if (!existsSync(path)) return env;
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const entry = parseEnvLine(line);
    if (!entry) continue;
    if (!env[entry.key]) env[entry.key] = entry.value;
  }
  return env;
}

/**
 * Load the repo's dotenv files. `includeApp` also merges `app/.env.local`,
 * where app-only secrets (e.g. HYPERDRIVE_DATABASE_URL) live.
 */
export function loadRepoEnv({ includeApp = false, env = process.env } = {}) {
  loadEnvFile(resolve(repoRoot, ".env.local"), env);
  if (includeApp) loadEnvFile(resolve(repoRoot, "app", ".env.local"), env);
  return env;
}

/** First non-empty value among `names`. */
export function firstEnv(names, env = process.env) {
  for (const name of names) {
    const value = env[name];
    if (value) return value;
  }
  return undefined;
}

export function resolveSupabaseUrl(env = process.env) {
  return firstEnv(SUPABASE_URL_ALIASES, env);
}

export function resolveSupabaseAnonKey(env = process.env) {
  return firstEnv(SUPABASE_ANON_KEY_ALIASES, env);
}

export function resolveSupabaseDbUrl(env = process.env) {
  return firstEnv(SUPABASE_DB_URL_ALIASES, env);
}

/**
 * Resolve the Supabase connection env a script needs. `serviceRoleKey` is
 * intentionally not aliased — only the one canonical name is accepted so a
 * privileged key can never be picked up from an unexpected variable.
 */
export function resolveSupabaseEnv(env = process.env) {
  return {
    url: resolveSupabaseUrl(env),
    anonKey: resolveSupabaseAnonKey(env),
    serviceRoleKey: env.SUPABASE_SERVICE_ROLE_KEY,
    dbUrl: resolveSupabaseDbUrl(env),
  };
}
