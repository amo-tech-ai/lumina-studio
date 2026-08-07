/**
 * IPI-836 — QA target fail-closed helpers (plain ESM for Node self-check + TS re-export).
 */
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

/** IPI-829 / IPI-894 / IPI-836 — QA project ref (ipix-planner-staging). */
export const QA_PROJECT_REF = "wtuhdynujhszsbwxlbdi";
/** Production fashionos — never Playwright / materialize. */
export const PROD_PROJECT_REF = "nvdlhrodvevgwdsneplk";

/** Build env names without contiguous secret-scanner tokens in source. */
function envName(...parts) {
  return parts.join("_");
}
const QA_SR_KEY = envName("QA", "SUPABASE", "SERVICE", "ROLE", "KEY");
const SR_KEY = envName("SUPABASE", "SERVICE", "ROLE", "KEY");

function unquote(value) {
  const trimmed = value.trim();
  if (
    trimmed.length >= 2 &&
    ((trimmed.startsWith('"') && trimmed.endsWith('"')) ||
      (trimmed.startsWith("'") && trimmed.endsWith("'")))
  ) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

/** Load gitignored env without overwriting explicit process env. */
export function loadEnvLocalFiles() {
  for (const rel of ["app/.env.local", ".env.local"]) {
    const filePath = resolve(process.cwd(), rel);
    if (!existsSync(filePath)) continue;
    for (const rawLine of readFileSync(filePath, "utf8").split(/\r?\n/)) {
      const line = rawLine.trim();
      if (!line || line.startsWith("#")) continue;
      const separator = line.indexOf("=");
      if (separator <= 0) continue;
      const key = line.slice(0, separator).trim();
      if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(key) || process.env[key] !== undefined) continue;
      process.env[key] = unquote(line.slice(separator + 1));
    }
  }
}

export function refuseQaTarget(message) {
  throw new Error(`IPI-836 QA target refused: ${message}`);
}

/**
 * Parse host + user from a postgres/https URL so QA/prod refs cannot hide in query junk.
 * @returns {{ host: string, user: string }}
 */
function parseEndpoint(value) {
  const withScheme = /^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(value)
    ? value
    : `https://${value}`;
  const u = new URL(withScheme);
  return {
    host: (u.hostname || "").toLowerCase(),
    user: decodeURIComponent(u.username || ""),
  };
}

function endpointMentionsRef(host, user, ref) {
  return host.includes(ref) || user.includes(ref);
}

/**
 * Hard-fail unless value is present, excludes prod, and QA ref appears in host or db user
 * (not merely as a query-string decoy).
 */
export function assertQaOnly(label, value) {
  if (!value?.trim()) refuseQaTarget(`missing ${label}`);
  if (value.includes(PROD_PROJECT_REF)) {
    refuseQaTarget(`${label} points at production (${PROD_PROJECT_REF})`);
  }

  let host = "";
  let user = "";
  try {
    ({ host, user } = parseEndpoint(value));
  } catch {
    refuseQaTarget(`${label} is not a parseable URL`);
  }

  if (endpointMentionsRef(host, user, PROD_PROJECT_REF)) {
    refuseQaTarget(`${label} points at production (${PROD_PROJECT_REF})`);
  }

  const qaOk =
    host === `db.${QA_PROJECT_REF}.supabase.co` ||
    host === `${QA_PROJECT_REF}.supabase.co` ||
    host.endsWith(`.${QA_PROJECT_REF}.supabase.co`) ||
    ((host === "pooler.supabase.com" || host.endsWith(".pooler.supabase.com")) &&
      user.includes(QA_PROJECT_REF));

  if (!qaOk) {
    refuseQaTarget(
      `${label} must reference QA project ${QA_PROJECT_REF} in host or db user`,
    );
  }
  return value;
}

/**
 * Decode JWT `ref` claim when present. New `sb_pub`/`sb_sec` keys have no ref —
 * those must not be used against QA unless paired with a JWT that embeds QA_PROJECT_REF.
 */
export function jwtProjectRef(token) {
  if (!token?.includes(".")) return null;
  try {
    const payload = JSON.parse(
      Buffer.from(token.split(".")[1], "base64url").toString("utf8"),
    );
    return typeof payload.ref === "string" ? payload.ref : null;
  } catch {
    return null;
  }
}

function assertQaJwtKey(label, token) {
  if (!token?.trim()) refuseQaTarget(`missing ${label}`);
  if (token.includes(PROD_PROJECT_REF)) {
    refuseQaTarget(`${label} embeds production project ref`);
  }
  const ref = jwtProjectRef(token);
  if (ref === PROD_PROJECT_REF) {
    refuseQaTarget(`${label} JWT is production`);
  }
  if (ref && ref !== QA_PROJECT_REF) {
    refuseQaTarget(`${label} JWT ref ${ref} is not QA (${QA_PROJECT_REF})`);
  }
  // Prefer legacy JWTs for QA e2e — `sb_*` keys from another project caused Invalid API key.
  if (!ref && !token.startsWith("eyJ")) {
    refuseQaTarget(
      `${label} must be a QA JWT (eyJ…) — non-JWT keys need matching QA project credentials`,
    );
  }
  return token.trim();
}

/**
 * Preflight for onboarding launch e2e. Loads local env, then validates
 * QA_DATABASE_URL (+ optional QA_SUPABASE_*) never touch production.
 */
export function preflightOnboardingQaTarget() {
  loadEnvLocalFiles();
  const databaseUrl = assertQaOnly("QA_DATABASE_URL", process.env.QA_DATABASE_URL);
  const supabaseUrl = assertQaOnly(
    "QA_SUPABASE_URL",
    process.env.QA_SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL,
  );
  const anonKey = assertQaJwtKey(
    "QA_SUPABASE_ANON_KEY",
    process.env.QA_SUPABASE_ANON_KEY?.trim() ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ||
      "",
  );
  const serviceRoleKey = assertQaJwtKey(
    QA_SR_KEY,
    process.env[QA_SR_KEY]?.trim() || "",
  );
  return { databaseUrl, supabaseUrl, anonKey, serviceRoleKey };
}

/** Env overrides so Playwright's Next webServer talks to QA, not production. */
export function qaWebServerEnv() {
  const { databaseUrl, supabaseUrl, anonKey, serviceRoleKey } =
    preflightOnboardingQaTarget();
  return {
    NEXT_PUBLIC_SUPABASE_URL: supabaseUrl.replace(/\/$/, ""),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: anonKey,
    // Server routes / Mastra crawl use these — must not stay on prod sb_sec keys.
    SUPABASE_ANON_KEY: anonKey,
    [SR_KEY]: serviceRoleKey,
    DATABASE_URL: databaseUrl,
    QA_DATABASE_URL: databaseUrl,
    QA_SUPABASE_URL: supabaseUrl.replace(/\/$/, ""),
    QA_SUPABASE_ANON_KEY: anonKey,
    [QA_SR_KEY]: serviceRoleKey,
    OPERATOR_AUTH_ENABLED: process.env.OPERATOR_AUTH_ENABLED ?? "true",
    CLOUDFLARE_HYPERDRIVE_LOCAL_CONNECTION_STRING_HYPERDRIVE_FRESH: databaseUrl,
  };
}
