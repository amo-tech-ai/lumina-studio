#!/usr/bin/env node
/**
 * IPI-606 · CF-SEC-010 — sync allowlisted runtime secrets from Infisical-injected env
 * to Cloudflare Worker via `wrangler versions upload --secrets-file` (single version upload).
 *
 * Usage (operator):
 *   infisical run --env=dev -- node scripts/sync-wrangler-secrets-from-infisical.mjs --wrangler-env preview --dry-run
 *   infisical run --env=prod -- node scripts/sync-wrangler-secrets-from-infisical.mjs --wrangler-env production
 *
 * Requires in env (from Infisical or CI): CLOUDFLARE_API_TOKEN, CLOUDFLARE_ACCOUNT_ID,
 * plus allowlisted runtime secret values injected by `infisical run`.
 *
 * Primary path: ephemeral JSON secrets file (chmod 600) → wrangler versions upload --secrets-file.
 * Avoids repeated wrangler secret bulk (each bulk creates a new deployment version).
 */
import { spawnSync } from "node:child_process";
import { chmodSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  assertInfisicalWranglerEnvPair,
  collectRuntimeSecretsFromEnv,
  INFISICAL_TO_WRANGLER_ENV,
  RUNTIME_REQUIRED_SECRET_NAMES,
  runtimeSecretNamesForWranglerEnv,
  wranglerCliEnvArgs,
} from "./cloudflare-secret-allowlist.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const appDir = path.resolve(__dirname, "..");
const localWrangler = path.join(appDir, "node_modules", ".bin", "wrangler");

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
  infisical run --env=<infisical-env> -- node scripts/sync-wrangler-secrets-from-infisical.mjs \\
    --infisical-env <infisical-env> --wrangler-env <preview|production> [--dry-run]

Infisical → wrangler mapping (SSOT):
  dev/staging → preview
  prod        → production

Options:
  --infisical-env  Infisical env slug (dev | staging | prod) — must pair with --wrangler-env
  --wrangler-env   Target wrangler environment (preview | production)
  --dry-run        Print secret names that would sync; never call wrangler or print values
  --help           Show this help

Primary upload: wrangler versions upload [--env preview|--env=""] --secrets-file <ephemeral-json>
  Entry point comes from wrangler.jsonc \`main\` — do not pass a positional worker path.
  production: top-level Worker (ipix-operator) via --env="" (matches npm run deploy)

Env (names only — set via Infisical or CI):
  CLOUDFLARE_API_TOKEN, CLOUDFLARE_ACCOUNT_ID
  Plus allowlisted runtime secrets (see app/docs/infisical-cloudflare-secrets.md)
`);
}

function requireCloudflareCredentials(env) {
  const missing = ["CLOUDFLARE_API_TOKEN", "CLOUDFLARE_ACCOUNT_ID"].filter((k) => !env[k]?.trim());
  if (missing.length > 0) {
    throw new Error(`Missing Cloudflare credentials: ${missing.join(", ")}`);
  }
}

function runWrangler(args) {
  const r = spawnSync(localWrangler, args, {
    cwd: appDir,
    encoding: "utf8",
    env: process.env,
    maxBuffer: 16 * 1024 * 1024,
  });
  const out = `${r.stdout ?? ""}${r.stderr ?? ""}`.trim();
  return { code: r.status ?? 1, out, error: r.error };
}

function redactValues(text) {
  return text.replace(/"[^"]*"/g, '"[REDACTED]"');
}

/**
 * Write allowlisted secrets to a secure temp JSON file (chmod 600).
 * @returns {{ filePath: string; cleanup: () => void }}
 */
export function writeSecureSecretsFile(secrets) {
  const dir = mkdtempSync(path.join(tmpdir(), "ipix-cf-secrets-"));
  const filePath = path.join(dir, "secrets.json");
  writeFileSync(filePath, JSON.stringify(secrets), { mode: 0o600 });
  chmodSync(filePath, 0o600);
  return {
    filePath,
    cleanup: () => {
      try {
        rmSync(dir, { recursive: true, force: true });
      } catch {
        // best-effort delete
      }
    },
  };
}

/** @param {string} wranglerEnv */
export function buildVersionsUploadArgs(wranglerEnv, secretsFilePath) {
  return [
    "versions",
    "upload",
    ...wranglerCliEnvArgs(wranglerEnv),
    "--secrets-file",
    secretsFilePath,
  ];
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
    console.error("Error: --infisical-env is required for live sync (dev | staging | prod)");
    printHelp();
    process.exit(1);
  }

  if (infisicalEnv) {
    assertInfisicalWranglerEnvPair(infisicalEnv, opts.wranglerEnv);
  }

  runtimeSecretNamesForWranglerEnv(opts.wranglerEnv);

  const { present, missing } = collectRuntimeSecretsFromEnv(process.env, opts.wranglerEnv);
  const namesToSync = Object.keys(present).sort();

  const missingRequired = RUNTIME_REQUIRED_SECRET_NAMES.filter((n) => !present[n]);
  if (!opts.dryRun && missingRequired.length > 0) {
    console.error(
      `Error: required runtime secrets missing from Infisical env (${missingRequired.join(", ")}).`,
    );
    console.error("SSOT sync aborted — fix Infisical or use --dry-run to inspect names only.");
    process.exit(1);
  }

  if (namesToSync.length === 0) {
    console.error(
      `Error: no allowlisted runtime secrets found in env for wrangler env "${opts.wranglerEnv}".`,
    );
    console.error("Run via: infisical run --env=<dev|staging|prod> -- node scripts/...");
    process.exit(1);
  }

  console.log(`wrangler env: ${opts.wranglerEnv}`);
  console.log(`secrets to sync (${namesToSync.length}): ${namesToSync.join(", ")}`);

  if (missing.length > 0) {
    console.warn(
      `warn: optional allowlisted secrets unset in Infisical env (${missing.length}): ${missing.join(", ")}`,
    );
  }

  if (opts.dryRun) {
    console.log("dry-run: no wrangler calls made; secret values not printed");
    process.exit(0);
  }

  requireCloudflareCredentials(process.env);

  let secretsFile;
  try {
    secretsFile = writeSecureSecretsFile(present);
    const uploadArgs = buildVersionsUploadArgs(opts.wranglerEnv, secretsFile.filePath);

    const result = runWrangler(uploadArgs);
    if (result.error) {
      console.error(`wrangler versions upload failed: ${result.error.message}`);
      process.exit(1);
    }

    if (result.code !== 0) {
      console.error("wrangler versions upload exited non-zero:");
      console.error(redactValues(result.out));
      process.exit(result.code);
    }

    console.log("sync complete via --secrets-file (values not logged)");
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

export { parseArgs, redactValues, runWrangler, requireCloudflareCredentials };
