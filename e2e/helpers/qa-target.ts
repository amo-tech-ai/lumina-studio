import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

/** IPI-829 / IPI-894 / IPI-836 — QA project ref (ipix-planner-staging). */
export const QA_PROJECT_REF = "wtuhdynujhszsbwxlbdi";
/** Production fashionos — never Playwright / materialize. */
export const PROD_PROJECT_REF = "nvdlhrodvevgwdsneplk";

function unquote(value: string): string {
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
export function loadEnvLocalFiles(): void {
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

export function refuseQaTarget(message: string): never {
  throw new Error(`IPI-836 QA target refused: ${message}`);
}

/** Hard-fail unless value is present, excludes prod, and includes QA ref. */
export function assertQaOnly(label: string, value: string | undefined): string {
  if (!value?.trim()) refuseQaTarget(`missing ${label}`);
  if (value.includes(PROD_PROJECT_REF)) {
    refuseQaTarget(`${label} points at production (${PROD_PROJECT_REF})`);
  }
  if (!value.includes(QA_PROJECT_REF)) {
    refuseQaTarget(`${label} must reference QA project ${QA_PROJECT_REF}`);
  }
  return value;
}

/**
 * Preflight for onboarding launch e2e. Loads local env, then validates
 * QA_DATABASE_URL (+ optional QA_SUPABASE_*) never touch production.
 */
export function preflightOnboardingQaTarget(): {
  databaseUrl: string;
  supabaseUrl: string;
  anonKey: string;
} {
  loadEnvLocalFiles();
  const databaseUrl = assertQaOnly("QA_DATABASE_URL", process.env.QA_DATABASE_URL);
  const supabaseUrl = assertQaOnly(
    "QA_SUPABASE_URL",
    process.env.QA_SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL,
  );
  const anonKey =
    process.env.QA_SUPABASE_ANON_KEY?.trim() ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ||
    "";
  if (!anonKey) refuseQaTarget("missing QA_SUPABASE_ANON_KEY (or NEXT_PUBLIC_SUPABASE_ANON_KEY)");
  if (anonKey.includes(PROD_PROJECT_REF)) {
    refuseQaTarget("anon key embeds production project ref");
  }
  return { databaseUrl, supabaseUrl, anonKey };
}

/** Env overrides so Playwright's Next webServer talks to QA, not production. */
export function qaWebServerEnv(): Record<string, string> {
  const { databaseUrl, supabaseUrl, anonKey } = preflightOnboardingQaTarget();
  return {
    NEXT_PUBLIC_SUPABASE_URL: supabaseUrl.replace(/\/$/, ""),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: anonKey,
    // Keep Hyperdrive / Mastra pooler on QA postgres when present.
    DATABASE_URL: databaseUrl,
    QA_DATABASE_URL: databaseUrl,
    QA_SUPABASE_URL: supabaseUrl.replace(/\/$/, ""),
    QA_SUPABASE_ANON_KEY: anonKey,
    OPERATOR_AUTH_ENABLED: process.env.OPERATOR_AUTH_ENABLED ?? "true",
  };
}
