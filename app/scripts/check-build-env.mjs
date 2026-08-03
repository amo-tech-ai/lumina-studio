/**
 * IPI-914 · CF-DEPLOY-031 — fail fast when build-time NEXT_PUBLIC_* env is
 * missing before a Cloudflare deploy/upload.
 *
 * Next.js inlines NEXT_PUBLIC_* at build time; `opennextjs-cloudflare` uploads
 * succeed regardless of what the build saw. The result is a live Worker with
 * hidden features (marketing chat) or broken routes (/api/marketing-lead 500).
 * This guard runs before `build:cf` so a deploy with missing build env never
 * reaches the wire.
 *
 * Required names mirror the allowlist in cloudflare-secret-allowlist.mjs
 * (BUILD_TIME_SECRET_NAMES). Warnings cover the rest of the build surface.
 * Names only — never logs env values.
 */

import { readFileSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, join, resolve } from "node:path";

const scriptsDir = dirname(fileURLToPath(import.meta.url));
const appDir = dirname(scriptsDir);

/**
 * Required at every deploy — break the site when absent:
 * - NEXT_PUBLIC_SUPABASE_URL / _ANON_KEY — /api/marketing-lead 500
 *   ("Server configuration error") and client Supabase features off.
 * @type {readonly string[]}
 */
export const REQUIRED_BUILD_ENV_NAMES = Object.freeze([
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
]);

/**
 * Optional build-time env — warn (deploy proceeds) when absent.
 * `alsoAccept` lists server-side fallbacks that next.config.ts maps into the
 * same NEXT_PUBLIC_ value at build time (see next.config.ts env block).
 * @type {readonly { name: string; alsoAccept?: readonly string[]; hint: string }[]}
 */
export const WARN_BUILD_ENV_ITEMS = Object.freeze([
  {
    name: "NEXT_PUBLIC_MARKETING_CHAT_ENABLED",
    hint: "unset hides the marketing-site chat UI on the deployed site",
  },
  {
    name: "NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME",
    alsoAccept: Object.freeze(["CLOUDINARY_CLOUD_NAME"]),
    hint: "falls back to server-side CLOUDINARY_CLOUD_NAME via next.config.ts",
  },
  {
    name: "NEXT_PUBLIC_CLOUDINARY_API_KEY",
    alsoAccept: Object.freeze([
      "NEXT_CLOUDINARY_API_KEY",
      "CLOUDINARY_API_KEY",
    ]),
    hint: "falls back to server-side CLOUDINARY_API_KEY via next.config.ts",
  },
  {
    name: "NEXT_PUBLIC_E2E_UPLOAD_POLL_MAX_MS",
    hint: "test-only knob; set only when running the E2E upload tests",
  },
  {
    name: "NEXT_PUBLIC_SITE_URL",
    hint: "metadataBase/OG override; unset falls back to https://www.ipix.co (src/lib/site.ts)",
  },
]);

/**
 * Parse a Next-style .env file: KEY=VALUE lines, `#` comments, optional
 * `export ` prefix, optional surrounding quotes.
 * @param {string} content
 * @returns {Record<string, string>}
 */
export function parseEnvFile(content) {
  /** @type {Record<string, string>} */
  const out = {};
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (line.length === 0 || line.startsWith("#")) continue;
    const withoutExport = line.startsWith("export ")
      ? line.slice("export ".length).trim()
      : line;
    const eq = withoutExport.indexOf("=");
    if (eq <= 0) continue;
    const key = withoutExport.slice(0, eq).trim();
    let value = withoutExport.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    out[key] = value;
  }
  return out;
}

/**
 * Expand Next-style `$VAR` / `${VAR}` references against `env` (missing → "").
 * `$$` escapes a literal `$`. Matches @next/env loader semantics closely enough
 * that a reference to a missing var degrades to an empty value instead of a
 * nonempty literal — so `checkBuildEnv` reports it as missing, like Next does.
 * @param {string} value
 * @param {Record<string, string | undefined>} env
 * @returns {string}
 */
export function expandEnvValue(value, env) {
  return value.replace(
    /\$\$|\$\{([A-Za-z_][A-Za-z0-9_]*)\}|\$([A-Za-z_][A-Za-z0-9_]*)/g,
    (match, braced, plain) => {
      if (match === "$$") return "$";
      return env[braced ?? plain] ?? "";
    },
  );
}

/** @param {string} path */
function tryReadEnvFile(path) {
  try {
    return readFileSync(path, "utf8");
  } catch (error) {
    if (error?.code === "ENOENT") return null;
    throw error;
  }
}

/**
 * Merge .env.local with process.env. Process env wins, matching Next.js
 * precedence. `BUILD_ENV_FILE` overrides the file path (CI/tests).
 * @param {object} [options]
 * @param {NodeJS.ProcessEnv} [options.env]
 * @param {string} [options.envFile]
  * @returns {{ merged: Record<string, string | undefined>; filePath: string; fileFound: boolean }}
  */
export function loadBuildEnv({ env = process.env, envFile } = {}) {
  const filePath =
    envFile ?? env.BUILD_ENV_FILE ?? join(appDir, ".env.local");
  const fileEnv = tryReadEnvFile(filePath);
  /** @type {Record<string, string | undefined>} */
  const merged = fileEnv ? parseEnvFile(fileEnv) : {};
  for (const [key, value] of Object.entries(env)) {
    merged[key] = value;
  }
  if (fileEnv) {
    for (const key of Object.keys(merged)) {
      const value = merged[key];
      if (typeof value === "string") {
        merged[key] = expandEnvValue(value, merged);
      }
    }
  }
  return { merged, filePath, fileFound: fileEnv !== null };
}

/**
 * @param {Record<string, string | undefined>} merged
 * @returns {{ ok: boolean; missingRequired: string[]; warnings: { name: string; hint: string }[] }}
 */
export function checkBuildEnv(merged) {
  /** @type {string[]} */
  const missingRequired = [];
  for (const name of REQUIRED_BUILD_ENV_NAMES) {
    if (!merged[name]?.trim()) missingRequired.push(name);
  }

  /** @type {{ name: string; hint: string }[]} */
  const warnings = [];
  for (const item of WARN_BUILD_ENV_ITEMS) {
    const candidates = [item.name, ...(item.alsoAccept ?? [])];
    const present = candidates.some((candidate) => merged[candidate]?.trim());
    if (!present) {
      warnings.push({ name: item.name, hint: item.hint });
    }
  }

  return { ok: missingRequired.length === 0, missingRequired, warnings };
}

/** @param {{ name: string; hint: string }} item */
function formatWarnLine(item) {
  return `  - ${item.name} (${item.hint})`;
}

/**
 * @param {{ ok: boolean; missingRequired: string[]; warnings: { name: string; hint: string }[] }} result
 * @returns {string}
 */
export function formatBuildEnvReport(result) {
  const lines = ["check-build-env (IPI-914 · CF-DEPLOY-031)"];
  if (result.ok && result.warnings.length === 0) {
    lines.push("  OK — required build-time NEXT_PUBLIC_* env present.");
    return lines.join("\n");
  }
  if (!result.ok) {
    lines.push(
      "  FAIL — missing required build-time env (Next.js inlines these at build;",
      "  a deploy now would ship a broken site):",
    );
    for (const name of result.missingRequired) {
      lines.push(`  - ${name}`);
    }
    lines.push(
      "  Set them in app/.env.local (or export them) before re-running deploy.",
    );
  }
  for (const item of result.warnings) {
    lines.push(formatWarnLine(item));
  }
  return lines.join("\n");
}

function main() {
  const { merged, filePath, fileFound } = loadBuildEnv();
  const result = checkBuildEnv(merged);
  const report = formatBuildEnvReport(result);
  if (result.ok) {
    console.log(report);
    return 0;
  }
  console.error(report);
  if (!fileFound) {
    console.error(
      `  (no env file at ${filePath} — create it from app/.env.example`,
      `  and fill the required values, or export them before re-running deploy)`,
    );
  }
  return 1;
}

const isMain =
  process.argv[1] !== undefined &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href;
if (isMain) {
  process.exitCode = main();
}
