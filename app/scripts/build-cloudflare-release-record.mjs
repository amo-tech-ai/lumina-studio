#!/usr/bin/env node
/**
 * IPI-705 · CF-PERF-001 (705a) — sanitized Cloudflare Worker release record.
 *
 * Builds one JSON provenance object from Wrangler NDJSON
 * (`WRANGLER_OUTPUT_FILE_PATH`) plus CI metadata. Fail-closed on required
 * fields. Never embeds secret values.
 *
 * Docs: https://developers.cloudflare.com/workers/wrangler/system-environment-variables/
 *
 * Usage:
 *   node scripts/build-cloudflare-release-record.mjs \
 *     --wrangler-output /tmp/wrangler.ndjson \
 *     --environment production \
 *     --git-sha "$GITHUB_SHA" \
 *     --out release-record.json
 */
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const appDir = path.resolve(__dirname, "..");

/** Schema version for release-record.json consumers (IPI-707 / IPI-708). */
export const RELEASE_RECORD_SCHEMA_VERSION = 1;

/** Required top-level keys (deploymentId may be explicit null for undeployed upload). */
export const REQUIRED_RELEASE_FIELDS = Object.freeze([
  "schemaVersion",
  "worker",
  "environment",
  "versionId",
  "deploymentId",
  "gitSha",
  "createdAt",
  "traffic",
]);

const SECRET_KEY_RE =
  /(?:^|_)(secret|token|password|passwd|authorization|api[_-]?key|cookie|credential|private[_-]?key|connection[_-]?string)(?:$|_)/i;

const SECRET_VALUE_RE =
  /(?:Bearer\s+[A-Za-z0-9\-._~+/]+=*|eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+|sk-[A-Za-z0-9]{16,}|cfut_[A-Za-z0-9_-]{20,}|postgres(?:ql)?:\/\/[^\s"]+)/i;

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Event types that carry version / deployment provenance. */
const PROVENANCE_TYPES = new Set(["version-upload", "version-deploy", "deploy"]);

/**
 * @param {string} text NDJSON from WRANGLER_OUTPUT_FILE_PATH
 * @returns {{ entries: object[], session: object | null, latest: object | null }}
 */
export function parseWranglerNdjson(text) {
  if (typeof text !== "string" || !text.trim()) {
    throw new Error("Wrangler NDJSON is empty or missing");
  }

  const entries = [];
  const lines = text.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    let parsed;
    try {
      parsed = JSON.parse(line);
    } catch {
      throw new Error(`Wrangler NDJSON line ${i + 1} is not valid JSON`);
    }
    if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
      throw new Error(`Wrangler NDJSON line ${i + 1} must be a JSON object`);
    }
    entries.push(parsed);
  }

  if (entries.length === 0) {
    throw new Error("Wrangler NDJSON has no entries");
  }

  const failed = [...entries].reverse().find((e) => e.type === "command-failed");
  if (failed) {
    const code = failed.error_code ?? failed.code ?? "unknown";
    const msg = typeof failed.message === "string" ? failed.message.slice(0, 200) : "command failed";
    throw new Error(`Wrangler command-failed in NDJSON (${code}): ${msg}`);
  }

  const session = [...entries].reverse().find((e) => e.type === "wrangler-session") ?? null;
  const latest =
    [...entries].reverse().find((e) => typeof e.type === "string" && PROVENANCE_TYPES.has(e.type)) ??
    null;

  if (!latest) {
    throw new Error(
      "Wrangler NDJSON missing version-upload, version-deploy, or deploy entry (fail closed)",
    );
  }

  return { entries, session, latest };
}

/**
 * Deep-sanitize a value for release-record JSON. Secret-shaped keys become
 * "[REDACTED]"; secret-shaped string values are replaced. Never throws.
 * @param {unknown} value
 * @param {string} [key]
 * @returns {unknown}
 */
export function sanitizeForReleaseRecord(value, key = "") {
  if (key && SECRET_KEY_RE.test(key)) {
    return "[REDACTED]";
  }
  if (typeof value === "string") {
    if (SECRET_VALUE_RE.test(value)) return "[REDACTED]";
    return value;
  }
  if (Array.isArray(value)) {
    return value.map((v, i) => sanitizeForReleaseRecord(v, String(i)));
  }
  if (value && typeof value === "object") {
    /** @type {Record<string, unknown>} */
    const out = {};
    for (const [k, v] of Object.entries(value)) {
      out[k] = sanitizeForReleaseRecord(v, k);
    }
    return out;
  }
  return value;
}

/**
 * Assert no secret material remains in a serialized record.
 * @param {unknown} record
 */
export function assertNoSecretsInRecord(record) {
  const json = JSON.stringify(record);
  if (SECRET_VALUE_RE.test(json)) {
    throw new Error("Release record contains secret-shaped values (fail closed)");
  }
  const walk = (obj, pathHint = "") => {
    if (!obj || typeof obj !== "object") return;
    for (const [k, v] of Object.entries(obj)) {
      if (SECRET_KEY_RE.test(k) && v !== "[REDACTED]" && v != null) {
        throw new Error(`Release record key "${pathHint}${k}" must be redacted`);
      }
      if (v && typeof v === "object") walk(v, `${pathHint}${k}.`);
    }
  };
  walk(record);
}

/**
 * @param {object} input
 * @param {object} [input.wranglerLatest] parsed NDJSON provenance entry
 * @param {object | null} [input.wranglerSession]
 * @param {string} input.environment preview | production
 * @param {string} input.gitSha
 * @param {string | null} [input.deploymentId]
 * @param {number | null} [input.trafficPercent] default 0 for new uploads
 * @param {number | null} [input.bundleGzipBytes]
 * @param {string | null} [input.artifactHash]
 * @param {string | null} [input.openNextVersion]
 * @param {string | null} [input.url]
 * @param {string | null} [input.createdAt]
 * @param {string | null} [input.worker] override worker name
 * @param {string | null} [input.versionId] override when NDJSON absent (tests / fallback)
 */
export function buildReleaseRecord(input) {
  const environment = String(input.environment ?? "").trim();
  if (environment !== "preview" && environment !== "production") {
    throw new Error(`environment must be preview|production, got "${environment}"`);
  }

  const gitSha = String(input.gitSha ?? "").trim();
  if (!/^[0-9a-f]{7,40}$/i.test(gitSha)) {
    throw new Error("gitSha must be a 7–40 hex commit SHA");
  }

  const latest = input.wranglerLatest ?? null;
  const session = input.wranglerSession ?? null;

  const versionId = String(
    input.versionId ?? latest?.version_id ?? latest?.versionId ?? "",
  ).trim();
  if (!versionId || !UUID_RE.test(versionId)) {
    throw new Error("versionId is required and must be a UUID (fail closed)");
  }

  const worker = String(
    input.worker ?? latest?.worker_name ?? latest?.workerName ?? "",
  ).trim();
  if (!worker) {
    throw new Error("worker name is required (fail closed)");
  }

  let deploymentId =
    input.deploymentId !== undefined
      ? input.deploymentId
      : (latest?.deployment_id ?? latest?.deploymentId ?? null);
  if (deploymentId != null) {
    deploymentId = String(deploymentId).trim();
    if (!deploymentId) deploymentId = null;
  }

  const trafficPercent =
    input.trafficPercent !== undefined && input.trafficPercent !== null
      ? Number(input.trafficPercent)
      : latest?.type === "version-upload"
        ? 0
        : latest?.type === "deploy"
          ? 100
          : Number(latest?.percentage ?? latest?.traffic_percentage ?? 0);

  if (!Number.isFinite(trafficPercent) || trafficPercent < 0 || trafficPercent > 100) {
    throw new Error(`traffic percentage must be 0–100, got ${trafficPercent}`);
  }

  if (trafficPercent > 0 && (deploymentId == null || deploymentId === "")) {
    throw new Error("deploymentId is required when traffic percentage > 0 (fail closed)");
  }

  const targets = latest?.targets;
  const urlFromTargets =
    Array.isArray(targets) && typeof targets[0] === "string" ? targets[0] : null;
  const url =
    input.url ??
    latest?.preview_url ??
    latest?.previewUrl ??
    urlFromTargets ??
    null;

  const createdAt =
    input.createdAt ??
    (typeof latest?.timestamp === "string" ? latest.timestamp : null) ??
    new Date().toISOString();

  const wranglerVersion =
    (typeof session?.wrangler_version === "string" ? session.wrangler_version : null) ??
    (typeof latest?.wrangler_version === "string" ? latest.wrangler_version : null);

  /** @type {Record<string, unknown>} */
  const record = {
    schemaVersion: RELEASE_RECORD_SCHEMA_VERSION,
    worker,
    environment,
    versionId,
    deploymentId: deploymentId ?? null,
    gitSha: gitSha.toLowerCase(),
    createdAt,
    traffic: { percentage: trafficPercent },
    url: url ?? null,
    bundleGzipBytes:
      input.bundleGzipBytes != null && Number.isFinite(Number(input.bundleGzipBytes))
        ? Math.round(Number(input.bundleGzipBytes))
        : null,
    artifactHash: input.artifactHash ?? null,
    wranglerVersion: wranglerVersion ?? null,
    openNextVersion: input.openNextVersion ?? null,
    source: typeof latest?.type === "string" ? latest.type : "manual",
  };

  const sanitized = /** @type {Record<string, unknown>} */ (
    sanitizeForReleaseRecord(record)
  );
  assertReleaseRecord(sanitized);
  assertNoSecretsInRecord(sanitized);
  return sanitized;
}

/**
 * Fail-closed schema check.
 * @param {unknown} record
 */
export function assertReleaseRecord(record) {
  if (!record || typeof record !== "object" || Array.isArray(record)) {
    throw new Error("release record must be an object");
  }
  const r = /** @type {Record<string, unknown>} */ (record);
  for (const key of REQUIRED_RELEASE_FIELDS) {
    if (!(key in r)) {
      throw new Error(`release record missing required field: ${key}`);
    }
  }
  if (r.schemaVersion !== RELEASE_RECORD_SCHEMA_VERSION) {
    throw new Error(`unsupported schemaVersion: ${r.schemaVersion}`);
  }
  if (typeof r.worker !== "string" || !r.worker.trim()) {
    throw new Error("worker must be a non-empty string");
  }
  if (r.environment !== "preview" && r.environment !== "production") {
    throw new Error("environment must be preview|production");
  }
  if (typeof r.versionId !== "string" || !UUID_RE.test(r.versionId)) {
    throw new Error("versionId must be a UUID");
  }
  if (r.deploymentId != null && (typeof r.deploymentId !== "string" || !r.deploymentId.trim())) {
    throw new Error("deploymentId must be a non-empty string or null");
  }
  if (typeof r.gitSha !== "string" || !/^[0-9a-f]{7,40}$/i.test(r.gitSha)) {
    throw new Error("gitSha must be a hex SHA");
  }
  if (typeof r.createdAt !== "string" || Number.isNaN(Date.parse(r.createdAt))) {
    throw new Error("createdAt must be an ISO timestamp");
  }
  const traffic = r.traffic;
  if (!traffic || typeof traffic !== "object" || Array.isArray(traffic)) {
    throw new Error("traffic must be an object");
  }
  const pct = /** @type {{ percentage?: unknown }} */ (traffic).percentage;
  if (typeof pct !== "number" || !Number.isFinite(pct) || pct < 0 || pct > 100) {
    throw new Error("traffic.percentage must be 0–100");
  }
  if (pct > 0 && (r.deploymentId == null || r.deploymentId === "")) {
    throw new Error("deploymentId required when traffic.percentage > 0");
  }
  if (r.bundleGzipBytes != null) {
    if (typeof r.bundleGzipBytes !== "number" || !Number.isFinite(r.bundleGzipBytes) || r.bundleGzipBytes < 0) {
      throw new Error("bundleGzipBytes must be a non-negative number or null");
    }
  }
}

/**
 * Build from NDJSON text + CI fields.
 * @param {{
 *   ndjsonText: string;
 *   environment: string;
 *   gitSha: string;
 *   deploymentId?: string | null;
 *   trafficPercent?: number | null;
 *   bundleGzipBytes?: number | null;
 *   artifactHash?: string | null;
 *   openNextVersion?: string | null;
 *   url?: string | null;
 *   worker?: string | null;
 *   versionId?: string | null;
 * }} args
 */
export function buildReleaseRecordFromNdjson(args) {
  const { entries: _entries, session, latest } = parseWranglerNdjson(args.ndjsonText);
  return buildReleaseRecord({
    wranglerLatest: latest,
    wranglerSession: session,
    environment: args.environment,
    gitSha: args.gitSha,
    deploymentId: args.deploymentId,
    trafficPercent: args.trafficPercent,
    bundleGzipBytes: args.bundleGzipBytes,
    artifactHash: args.artifactHash,
    openNextVersion: args.openNextVersion,
    url: args.url,
    worker: args.worker,
    versionId: args.versionId,
  });
}

/** @param {string} filePath */
export function readBundleGzipBytes(filePath) {
  if (!filePath || !existsSync(filePath)) return null;
  const raw = JSON.parse(readFileSync(filePath, "utf8"));
  if (typeof raw.gzipKiB === "number" && Number.isFinite(raw.gzipKiB)) {
    return Math.round(raw.gzipKiB * 1024);
  }
  if (typeof raw.bundleGzipBytes === "number" && Number.isFinite(raw.bundleGzipBytes)) {
    return Math.round(raw.bundleGzipBytes);
  }
  return null;
}

/** @param {string} filePath */
export function readArtifactHash(filePath) {
  if (!filePath || !existsSync(filePath)) return null;
  const raw = JSON.parse(readFileSync(filePath, "utf8"));
  if (typeof raw.metafileSha256 === "string" && raw.metafileSha256.trim()) {
    return raw.metafileSha256.trim();
  }
  return null;
}

export function readOpenNextVersion(pkgJsonPath = path.join(appDir, "package.json")) {
  try {
    const pkg = JSON.parse(readFileSync(pkgJsonPath, "utf8"));
    const v =
      pkg.dependencies?.["@opennextjs/cloudflare"] ??
      pkg.devDependencies?.["@opennextjs/cloudflare"];
    return typeof v === "string" ? v.replace(/^[\^~]/, "") : null;
  } catch {
    return null;
  }
}

/** Stable content hash for the sanitized record (audit fingerprint). */
export function fingerprintRecord(record) {
  const json = JSON.stringify(record);
  return createHash("sha256").update(json).digest("hex");
}

/** @param {string[]} argv */
export function parseCliArgs(argv) {
  /** @type {Record<string, string | boolean | null>} */
  const opts = {
    wranglerOutput: null,
    environment: null,
    gitSha: null,
    out: null,
    bundleReport: null,
    deploymentId: null,
    trafficPercent: null,
    versionId: null,
    worker: null,
    url: null,
    help: false,
  };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    const next = () => argv[++i] ?? null;
    if (arg === "--help" || arg === "-h") opts.help = true;
    else if (arg === "--wrangler-output") opts.wranglerOutput = next();
    else if (arg.startsWith("--wrangler-output="))
      opts.wranglerOutput = arg.slice("--wrangler-output=".length);
    else if (arg === "--environment") opts.environment = next();
    else if (arg.startsWith("--environment=")) opts.environment = arg.slice("--environment=".length);
    else if (arg === "--git-sha") opts.gitSha = next();
    else if (arg.startsWith("--git-sha=")) opts.gitSha = arg.slice("--git-sha=".length);
    else if (arg === "--out") opts.out = next();
    else if (arg.startsWith("--out=")) opts.out = arg.slice("--out=".length);
    else if (arg === "--bundle-report") opts.bundleReport = next();
    else if (arg.startsWith("--bundle-report="))
      opts.bundleReport = arg.slice("--bundle-report=".length);
    else if (arg === "--deployment-id") opts.deploymentId = next();
    else if (arg.startsWith("--deployment-id="))
      opts.deploymentId = arg.slice("--deployment-id=".length);
    else if (arg === "--traffic-percent") opts.trafficPercent = next();
    else if (arg.startsWith("--traffic-percent="))
      opts.trafficPercent = arg.slice("--traffic-percent=".length);
    else if (arg === "--version-id") opts.versionId = next();
    else if (arg.startsWith("--version-id=")) opts.versionId = arg.slice("--version-id=".length);
    else if (arg === "--worker") opts.worker = next();
    else if (arg.startsWith("--worker=")) opts.worker = arg.slice("--worker=".length);
    else if (arg === "--url") opts.url = next();
    else if (arg.startsWith("--url=")) opts.url = arg.slice("--url=".length);
    else throw new Error(`Unknown argument: ${arg}`);
  }
  return opts;
}

function printHelp() {
  console.log(`Usage:
  node scripts/build-cloudflare-release-record.mjs \\
    --wrangler-output <ndjson> --environment <preview|production> \\
    --git-sha <sha> [--out release-record.json] [--bundle-report path] \\
    [--deployment-id id] [--traffic-percent 0] [--version-id uuid] [--worker name]

Fails closed when Wrangler NDJSON is missing/invalid or required fields are absent.
Never prints secret values.
`);
}

function main() {
  const opts = parseCliArgs(process.argv.slice(2));
  if (opts.help) {
    printHelp();
    process.exit(0);
  }

  const wranglerPath =
    (typeof opts.wranglerOutput === "string" && opts.wranglerOutput) ||
    process.env.WRANGLER_OUTPUT_FILE_PATH ||
    null;
  const environment =
    (typeof opts.environment === "string" && opts.environment) ||
    process.env.WRANGLER_ENV ||
    null;
  const gitSha =
    (typeof opts.gitSha === "string" && opts.gitSha) ||
    process.env.GITHUB_SHA ||
    null;

  if (!wranglerPath || !environment || !gitSha) {
    console.error(
      "Error: --wrangler-output, --environment, and --git-sha are required (or WRANGLER_OUTPUT_FILE_PATH / WRANGLER_ENV / GITHUB_SHA).",
    );
    printHelp();
    process.exit(1);
  }

  if (!existsSync(wranglerPath)) {
    console.error(`Error: Wrangler output file not found: ${wranglerPath}`);
    process.exit(1);
  }

  const ndjsonText = readFileSync(wranglerPath, "utf8");
  const bundleReport =
    (typeof opts.bundleReport === "string" && opts.bundleReport) ||
    path.join(appDir, ".open-next", "worker-bundle-report.json");

  const trafficPercent =
    opts.trafficPercent != null && opts.trafficPercent !== ""
      ? Number(opts.trafficPercent)
      : null;

  const record = buildReleaseRecordFromNdjson({
    ndjsonText,
    environment,
    gitSha,
    deploymentId: typeof opts.deploymentId === "string" ? opts.deploymentId : undefined,
    trafficPercent,
    bundleGzipBytes: readBundleGzipBytes(bundleReport),
    artifactHash: readArtifactHash(bundleReport),
    openNextVersion: readOpenNextVersion(),
    url: typeof opts.url === "string" ? opts.url : undefined,
    worker: typeof opts.worker === "string" ? opts.worker : undefined,
    versionId: typeof opts.versionId === "string" ? opts.versionId : undefined,
  });

  const outPath =
    (typeof opts.out === "string" && opts.out) ||
    path.join(appDir, ".open-next", "cloudflare-release-record.json");

  writeFileSync(outPath, `${JSON.stringify(record, null, 2)}\n`, "utf8");
  console.log(`release_record_path=${outPath}`);
  console.log(`release_record_worker=${record.worker}`);
  console.log(`release_record_version_id=${record.versionId}`);
  console.log(`release_record_deployment_id=${record.deploymentId ?? ""}`);
  console.log(`release_record_traffic=${/** @type {{ percentage: number }} */ (record.traffic).percentage}`);
  console.log(`release_record_fingerprint=${fingerprintRecord(record)}`);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  main();
}
