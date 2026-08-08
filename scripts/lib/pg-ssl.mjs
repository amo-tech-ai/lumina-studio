/**
 * Shared Postgres TLS handling for scripts that connect with `pg` directly.
 *
 * Supabase enforces TLS, so a direct `pg` client needs an explicit CA. The
 * bundled prod CA is used unless PGSSLROOTCERT / VERIFY_RLS_PG_SSLROOTCERT
 * points elsewhere.
 *
 * @see https://supabase.com/docs/guides/platform/ssl-enforcement
 */
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

import { repoRoot } from "./script-env.mjs";

export const DEFAULT_PG_CA_PATH = resolve(
  repoRoot,
  "scripts/certs/supabase-prod-ca-2021.crt",
);

/**
 * Strip SSL query params so a `pg` Client `ssl` option is not overwritten by
 * the connection string.
 */
export function sanitizePgConnectionString(connectionString) {
  try {
    const u = new URL(connectionString);
    for (const key of ["sslmode", "sslrootcert", "sslcert", "sslkey"]) {
      u.searchParams.delete(key);
    }
    return u.toString();
  } catch {
    return connectionString;
  }
}

/** CA path a caller explicitly asked for, if any. */
export function explicitPgCaPath(env = process.env) {
  return env.PGSSLROOTCERT || env.VERIFY_RLS_PG_SSLROOTCERT || "";
}

/**
 * Resolve the `ssl` option for a `pg` Client.
 *
 * Default: rejectUnauthorized:true + Supabase Root 2021 CA
 * (scripts/certs/supabase-prod-ca-2021.crt — same trust anchor as Dashboard
 * "SSL Configuration" / prod-ca-2021.crt). Override the path via PGSSLROOTCERT
 * or VERIFY_RLS_PG_SSLROOTCERT. Local-only escape hatch:
 * VERIFY_RLS_PG_INSECURE_SSL=1 (never set in CI).
 *
 * `requireCa: true` throws when no CA file is found instead of falling back to
 * system roots — for scripts that must never connect on a weaker trust chain
 * than the one they document.
 *
 * Pair with {@link sanitizePgConnectionString}: node-postgres replaces a
 * supplied `ssl` object when the connection string still carries sslmode /
 * sslrootcert / sslcert / sslkey (see https://node-postgres.com/features/ssl).
 *
 * @param {{ requireCa?: boolean, env?: NodeJS.ProcessEnv }} [options]
 */
export function resolvePgSsl({ requireCa = false, env = process.env } = {}) {
  if (
    env.VERIFY_RLS_PG_INSECURE_SSL === "1" ||
    env.NODE_TLS_REJECT_UNAUTHORIZED === "0"
  ) {
    return { rejectUnauthorized: false };
  }
  const explicitCa = explicitPgCaPath(env);
  const caPath = explicitCa || DEFAULT_PG_CA_PATH;
  if (existsSync(caPath)) {
    return { rejectUnauthorized: true, ca: readFileSync(caPath, "utf8") };
  }
  if (requireCa) {
    throw new Error(
      `PG SSL CA not found at ${caPath} — refuse insecure fallback` +
        (explicitCa
          ? " (fix PGSSLROOTCERT / VERIFY_RLS_PG_SSLROOTCERT)"
          : "") +
        "; set VERIFY_RLS_PG_INSECURE_SSL=1 to opt in",
    );
  }
  return { rejectUnauthorized: true };
}
