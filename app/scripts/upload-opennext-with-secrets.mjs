#!/usr/bin/env node
/**
 * IPI-472 + IPI-606 — upload OpenNext Worker code and runtime secrets in one version.
 *
 * Writes allowlisted secrets to a chmod-600 JSON file and passes it to OpenNext via
 * Wrangler passthrough: `opennextjs-cloudflare upload -- --secrets-file <file>`.
 *
 * Greenfield bootstrap: if the Worker script does not exist yet, falls back to
 * `opennextjs-cloudflare deploy` with the same `--secrets-file` (single version).
 *
 * Usage:
 *   node scripts/upload-opennext-with-secrets.mjs --infisical-env dev --wrangler-env preview
 */
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";
import {
  assertInfisicalWranglerEnvPair,
  buildWranglerVarCliArgs,
  collectRuntimeSecretsFromEnv,
  collectWranglerVarsFromEnv,
  RUNTIME_REQUIRED_SECRET_NAMES,
  WRANGLER_REQUIRED_VAR_NAMES,
  runtimeSecretNamesForWranglerEnv,
} from "./cloudflare-secret-allowlist.mjs";
import {
  redactValues,
  requireCloudflareCredentials,
  writeSecureSecretsFile,
} from "./sync-wrangler-secrets-from-infisical.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const appDir = path.resolve(__dirname, "..");
const opennextCli = path.join(appDir, "node_modules", ".bin", "opennextjs-cloudflare");

const WORKER_DOES_NOT_EXIST = /does not yet exist/i;

/** @param {string[]} argv */
function parseArgs(argv) {
  /** @type {{ wranglerEnv: string | null; infisicalEnv: string | null; dryRun: boolean; help: boolean }} */
  const opts = {
    wranglerEnv: null,
    infisicalEnv: null,
    dryRun: false,
    help: false,
  };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--dry-run") {
      opts.dryRun = true;
    } else if (arg === "--help" || arg === "-h") {
      opts.help = true;
    } else if (arg === "--wrangler-env") {
      opts.wranglerEnv = argv[++i] ?? null;
    } else if (arg.startsWith("--wrangler-env=")) {
      opts.wranglerEnv = arg.slice("--wrangler-env=".length);
    } else if (arg === "--infisical-env") {
      opts.infisicalEnv = argv[++i] ?? null;
    } else if (arg.startsWith("--infisical-env=")) {
      opts.infisicalEnv = arg.slice("--infisical-env=".length);
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  return opts;
}

function printHelp() {
  console.log(`Usage:
  node scripts/upload-opennext-with-secrets.mjs \\
    --infisical-env <dev|staging|prod> --wrangler-env <preview|production> [--dry-run]

Uploads OpenNext bundle and runtime secrets in one Worker version via:
  opennextjs-cloudflare upload --env <env> -- --var KEY:VALUE --secrets-file <ephemeral-json>

Greenfield fallback (Worker script missing):
  opennextjs-cloudflare deploy --env <env> -- --var KEY:VALUE --secrets-file <ephemeral-json>

Requires in env: CLOUDFLARE_API_TOKEN, CLOUDFLARE_ACCOUNT_ID, allowlisted runtime secrets.
Run \`npm run build:cf\` before this script on live uploads.
`);
}

/**
 * Build `opennextjs-cloudflare` argv.
 * OpenNext strips `--` and forwards unknown flags to Wrangler (`unknown-options-as-args`),
 * but we still place Wrangler-only flags (`--var`, `--secrets-file`) after `--` so intent
 * matches the passthrough contract and survives stricter CLI parsing later.
 *
 * @param {string} command upload | deploy
 * @param {string} wranglerEnv
 * @param {string} secretsFilePath
 * @param {string[]} varCliArgs wrangler `--var KEY:VALUE` pairs
 * @returns {string[]}
 */
export function buildOpenNextCliArgs(command, wranglerEnv, secretsFilePath, varCliArgs) {
  const envFlag = wranglerEnv === "production" ? "production" : "preview";
  return [
    command,
    "--env",
    envFlag,
    "--",
    ...varCliArgs,
    "--secrets-file",
    secretsFilePath,
  ];
}

/**
 * @param {string} command upload | deploy
 * @param {string} wranglerEnv
 * @param {string} secretsFilePath
 * @param {string[]} varCliArgs wrangler `--var KEY:VALUE` after `--` passthrough
 */
function runOpenNext(command, wranglerEnv, secretsFilePath, varCliArgs) {
  const args = buildOpenNextCliArgs(command, wranglerEnv, secretsFilePath, varCliArgs);

  const r = spawnSync(opennextCli, args, {
    cwd: appDir,
    encoding: "utf8",
    env: process.env,
    maxBuffer: 32 * 1024 * 1024,
  });

  const out = `${r.stdout ?? ""}${r.stderr ?? ""}`.trim();
  return { code: r.status ?? 1, out, error: r.error };
}

/** @param {string} text */
export function parseWorkerVersionId(text) {
  const patterns = [
    /Uploaded\s+(?:worker\s+)?version\s+([0-9a-f-]{36})/i,
    /Current\s+Version\s+ID:\s*([0-9a-f-]{36})/i,
    /Version\s+ID:\s*([0-9a-f-]{36})/i,
    /version_id[=:\s]+([0-9a-f-]{36})/i,
  ];
  for (const re of patterns) {
    const m = text.match(re);
    if (m?.[1]) return m[1];
  }
  return null;
}

/** @param {string} text */
export function parseWorkersDevUrl(text) {
  const m = text.match(/https:\/\/[a-z0-9-]+\.[a-z0-9-]+\.workers\.dev/i);
  return m?.[0] ?? null;
}

function main() {
  const opts = parseArgs(process.argv.slice(2));

  if (opts.help) {
    printHelp();
    process.exit(0);
  }

  if (!opts.wranglerEnv) {
    console.error("Error: --wrangler-env is required (preview | production)");
    printHelp();
    process.exit(1);
  }

  const infisicalEnv =
    opts.infisicalEnv ?? process.env.INFISICAL_ENV?.trim() ?? process.env.INFISICAL_ENVIRONMENT?.trim() ?? null;

  if (!opts.dryRun && !infisicalEnv) {
    console.error("Error: --infisical-env is required for live upload (dev | staging | prod)");
    printHelp();
    process.exit(1);
  }

  if (infisicalEnv) {
    assertInfisicalWranglerEnvPair(infisicalEnv, opts.wranglerEnv);
  }

  runtimeSecretNamesForWranglerEnv(opts.wranglerEnv);

  const { present, missing } = collectRuntimeSecretsFromEnv(process.env, opts.wranglerEnv);
  const namesToSync = Object.keys(present).sort();
  const { present: varsPresent, missing: varsMissing } = collectWranglerVarsFromEnv(process.env);
  const varNames = Object.keys(varsPresent).sort();
  const varCliArgs = buildWranglerVarCliArgs(varsPresent);

  const missingRequired = RUNTIME_REQUIRED_SECRET_NAMES.filter((n) => !present[n]);
  if (!opts.dryRun && missingRequired.length > 0) {
    console.error(
      `Error: required runtime secrets missing (${missingRequired.join(", ")}). Fetch secrets before upload.`,
    );
    process.exit(1);
  }

  const missingRequiredVars = WRANGLER_REQUIRED_VAR_NAMES.filter((n) => !varsPresent[n]);
  if (!opts.dryRun && missingRequiredVars.length > 0) {
    console.error(
      `Error: required wrangler vars missing (${missingRequiredVars.join(", ")}). ` +
        "Set GitHub environment variables and pass them to the upload step — do not use Dashboard edits.",
    );
    process.exit(1);
  }

  console.log(`wrangler env: ${opts.wranglerEnv}`);
  console.log(`runtime secrets (${namesToSync.length}): ${namesToSync.join(", ")}`);
  console.log(`wrangler vars (${varNames.length}): ${varNames.join(", ") || "(none — optional only)"}`);

  if (missing.length > 0) {
    console.warn(
      `warn: optional allowlisted secrets unset (${missing.length}): ${missing.join(", ")}`,
    );
  }

  if (varsMissing.length > 0) {
    console.warn(
      `warn: optional wrangler vars unset (${varsMissing.length}): ${varsMissing.join(", ")}`,
    );
  }

  if (opts.dryRun) {
    console.log("dry-run: no OpenNext or wrangler calls made; secret values not printed");
    process.exit(0);
  }

  if (namesToSync.length === 0) {
    console.error("Error: no allowlisted runtime secrets found in env.");
    process.exit(1);
  }

  requireCloudflareCredentials(process.env);

  let secretsFile;
  try {
    secretsFile = writeSecureSecretsFile(present);

    let command = "upload";
    let result = runOpenNext(command, opts.wranglerEnv, secretsFile.filePath, varCliArgs);

    if (result.error) {
      console.error(`opennextjs-cloudflare ${command} failed: ${result.error.message}`);
      process.exit(1);
    }

    if (result.code !== 0 && WORKER_DOES_NOT_EXIST.test(result.out)) {
      console.log("Worker script not found — falling back to deploy with --secrets-file");
      command = "deploy";
      result = runOpenNext(command, opts.wranglerEnv, secretsFile.filePath, varCliArgs);
    }

    if (result.error) {
      console.error(`opennextjs-cloudflare ${command} failed: ${result.error.message}`);
      process.exit(1);
    }

    if (result.code !== 0) {
      console.error(`opennextjs-cloudflare ${command} exited non-zero:`);
      console.error(redactValues(result.out));
      process.exit(result.code);
    }

    const versionId = parseWorkerVersionId(result.out);
    const previewUrl = parseWorkersDevUrl(result.out);

    console.log(`upload complete via opennextjs-cloudflare ${command} + --secrets-file`);
    if (versionId) {
      console.log(`worker_version_id=${versionId}`);
    }
    if (previewUrl) {
      console.log(`preview_url=${previewUrl}`);
    }
    if (result.out) {
      console.log(redactValues(result.out));
    }
  } finally {
    secretsFile?.cleanup();
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  main();
}

export { parseArgs, runOpenNext };
