import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

type QaCredentials = {
  email: string;
  password: string;
};

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

/**
 * Load ignored local QA configuration without overwriting explicit process
 * environment values. Secret values are never logged or returned wholesale.
 */
export function loadEnvLocal(filePath = resolve(process.cwd(), ".env.local")): void {
  if (!existsSync(filePath)) return;

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

/** Resolve credentials only when a password is configured; callers skip otherwise. */
export function getQaCredentials(): QaCredentials {
  loadEnvLocal();
  return {
    email: process.env.QA_EMAIL?.trim() || process.env.Email?.trim() || "qa@ipix.test",
    password: process.env.QA_PASSWORD?.trim() || process.env.Password?.trim() || "",
  };
}
