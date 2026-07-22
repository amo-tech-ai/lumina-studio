#!/usr/bin/env node
/**
 * CLD-105 (IPI-432) — Cloudinary pipeline integration smoke test.
 *
 * Proves the production media processing path on the remote project:
 *   signed upload → real Cloudinary asset → signed notification POST →
 *   webhook route → Supabase rows → DNA trigger → signed delivery URL
 *   (200 image/*) → cleanup
 *
 * The notification delivered to the webhook route is synthetically generated
 * and signed by the verifier from the real Cloudinary upload response data.
 * Cloudinary's external asynchronous callback delivery to ephemeral tunnel
 * URLs is not reliable enough for deterministic testing and is not proven
 * here. The webhook route's signature verification, row creation, and DNA
 * trigger are otherwise fully verified against production paths.
 *
 * Run: npm run verify:cloudinary-pipeline
 * Fixture (IPI-512): npm run verify:cloudinary-pipeline -- --mode=fixture --keep-fixture
 *
 * Architecture:
 *   - Exercises the REAL application paths (api/assets/upload-sign,
 *     api/assets/cloudinary/webhook, lib/cloudinary/url presets) — no duplicated
 *     URL builders. Delivery URL mirrors cloudinarySignedPresetUrl exactly
 *     (c_limit,w_600,f_auto,q_auto for the asset-masonry preset).
 *   - Pure helpers (pollForWebhookRow, validateUploadResponse, interpretDnaState,
 *     isTestPublicId, cleanup) are exported so verify-cloudinary-pipeline.test.mjs
 *     can exercise them without hitting real Cloudinary/Supabase.
 *   - Cleanup runs in `finally` with a 2s settle delay — failed tests never
 *     leave junk assets behind, even if a late real callback arrives.
 *   - Emits the exact CLD-105 stage format and a machine-readable JSON report
 *     at app/scripts/.cld105-report.json for CI integration.
 *
 * Required env (loaded from .env.local if present):
 *   - CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET
 *   - NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 *   - CLD105_BRAND_ID (a brand owned by the test operator)
 *   - CLD105_ORG_ID (optional — org for taxonomy folder; if unset, derived from brands.org_id)
 *   - CLD105_OPERATOR_COOKIE (session cookie) OR CLD105_OPERATOR_EMAIL +
 *     CLD105_OPERATOR_PASSWORD (signed in via Supabase Auth). If neither is set,
 *     relies on OPERATOR_AUTH_ENABLED=false dev bypass.
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { randomUUID } from "node:crypto";
import { deflateSync } from "node:zlib";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const appRoot = resolve(__dirname, "..");
const repoRoot = resolve(appRoot, "..");
const envPath = resolve(appRoot, ".env.local");

function stripQuotes(s) {
  if (s.length >= 2) {
    if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
      return s.slice(1, -1);
    }
  }
  return s;
}

function loadEnvFile(path) {
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq);
    const val = stripQuotes(trimmed.slice(eq + 1));
    if (!process.env[key]) process.env[key] = val;
  }
}
loadEnvFile(envPath);

// --- Cloudinary account config -------------------------------------------------

const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY;
const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET;

// The asset-masonry preset from lib/cloudinary/url.ts — kept here as a literal
// (not imported) so the script has zero TypeScript loader deps and this is the
// single non-TS surface that must be kept in sync if the preset changes.
export const ASSET_MASONRY_TRANSFORM = "c_limit,w_600,f_auto,q_auto";

// All HTTP requests (signing, upload, delivery) abort after this duration.
const REQUEST_TIMEOUT_MS = 15_000;

// Default test scope for unit tests (no brand). Live fixtures use
// testScopeForBrand(brandId, orgId) and pass the prefix into cleanup — never mutate these.
// Legacy flat folder — unit-test default for isTestPublicId only (not used by live taxonomy path).
export const TEST_FOLDER = "ipix/cld105-test";
export const TEST_PUBLIC_ID_PREFIX = `${TEST_FOLDER}/cld105-`;

/** Mirror of taxonomy.ts detectEnv — plain .mjs can't import the TS module. */
const DAM_ENVIRONMENTS = ["dev", "staging", "prod"];
export const FIXTURE_WORK_TYPE = "qa-fixtures";

export function detectDamEnv() {
  for (const key of ["VERCEL_ENV", "NEXT_PUBLIC_VERCEL_ENV"]) {
    const val = process.env[key];
    if (val === "production") return "prod";
    if (val === "preview" || val === "staging") return "staging";
  }
  const override = process.env.DAM_ENV;
  if (override) {
    if (DAM_ENVIRONMENTS.includes(override)) return override;
    throw new Error(
      `detectDamEnv(): invalid DAM_ENV="${override}" — must be one of ${DAM_ENVIRONMENTS.join(", ")}`,
    );
  }
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      'detectDamEnv(): NODE_ENV=production but no VERCEL_ENV/DAM_ENV — refusing to fall back to "dev"',
    );
  }
  return "dev";
}

/**
 * Brand-scoped taxonomy folder + public_id prefix for a disposable fixture run.
 * Shape mirrors taxonomy assetFolderFor: ipix/{env}/{orgId}/{brandId}/qa-fixtures
 * Live runs: pass orgId from CLD105_ORG_ID or brands.org_id — never hardcode prod orgs.
 */
export function testScopeForBrand(brandId, orgId, env) {
  if (!orgId) {
    throw new Error(
      "testScopeForBrand requires orgId (set CLD105_ORG_ID or derive from brands.org_id)",
    );
  }
  const resolvedEnv = env ?? detectDamEnv();
  const testFolder = `ipix/${resolvedEnv}/${orgId}/${brandId}/${FIXTURE_WORK_TYPE}`;
  return {
    testFolder,
    testPublicIdPrefix: `${testFolder}/cld105-`,
    workType: FIXTURE_WORK_TYPE,
    env: resolvedEnv,
  };
}

// --- Pure helpers (exported for unit testing) ----------------------------------

/**
 * Generate a small unique PNG in-memory. The pixel data incorporates a hash of
 * runId so two runs can't produce byte-identical assets (defends against a cached
 * CDN hit masquerading as a fresh upload). Returns a Buffer.
 */
export function generateTestImage(runId) {
  const PNG_SIG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const width = 16;
  const height = 16;
  const rgba = Buffer.alloc(width * height * 4);
  // FNV-1a hash of the runId — different runIds produce different seeds, unlike
  // a length-only seed which collides for any two equal-length strings.
  let seed = 0x811c9dc5;
  const id = String(runId ?? "");
  for (let i = 0; i < id.length; i++) {
    seed ^= id.charCodeAt(i);
    seed = Math.imul(seed, 0x01000193) >>> 0;
  }
  for (let i = 0; i < width * height; i++) {
    seed = Math.imul(seed ^ i, 0x01000193) >>> 0;
    rgba[i * 4] = seed & 0xff;
    rgba[i * 4 + 1] = (seed >>> 8) & 0xff;
    rgba[i * 4 + 2] = (seed >>> 16) & 0xff;
    rgba[i * 4 + 3] = 0xff;
  }
  // One filter-type-0 byte per scanline, then the RGBA bytes.
  const raw = Buffer.concat(
    Array.from({ length: height }, (_, y) =>
      Buffer.concat([Buffer.from([0]), rgba.subarray(y * width * 4, (y + 1) * width * 4)]),
    ),
  );
  const idat = deflateSync(raw, { level: 0 });

  function chunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);
    const typeBuf = Buffer.from(type, "ascii");
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])) >>> 0, 0);
    return Buffer.concat([len, typeBuf, data, crc]);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type RGBA
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;
  return Buffer.concat([PNG_SIG, chunk("IHDR", ihdr), chunk("IDAT", idat), chunk("IEND", Buffer.alloc(0))]);
}

// CRC32 for PNG chunks (standard zlib polynomial).
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();
function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return c ^ 0xffffffff;
}

/**
 * Validate the Cloudinary upload response. Returns { ok, publicId, bytes } on
 * success or { ok: false, error } on a malformed response.
 */
export function validateUploadResponse(json) {
  if (!json || typeof json !== "object") {
    return { ok: false, error: "upload response is not an object" };
  }
  if (!json.public_id || typeof json.public_id !== "string") {
    return { ok: false, error: "missing public_id in upload response" };
  }
  if (typeof json.bytes !== "number" || json.bytes <= 0) {
    return { ok: false, error: "missing/invalid bytes in upload response" };
  }
  // IPI-641: fresh uploads must return provider identity for the pipeline smoke check.
  if (!json.asset_id || typeof json.asset_id !== "string") {
    return { ok: false, error: "missing asset_id in upload response" };
  }
  if (json.version == null || typeof json.version !== "number") {
    return { ok: false, error: "missing/invalid version in upload response" };
  }
  return {
    ok: true,
    publicId: json.public_id,
    bytes: json.bytes,
    assetId: json.asset_id,
    version: json.version,
  };
}

/**
 * Poll a Supabase client for the webhook-written assets + cloudinary_assets rows
 * matching `publicId`. Returns only when BOTH rows exist and `cloudinary_assets`
 * has `status = ready`. Returns null on timeout. `now` and `sleep` are injected
 * for deterministic testing.
 *
 * @param {object} args
 * @param {object} args.supabase   - Supabase client (admin or scoped).
 * @param {string} args.publicId   - Cloudinary public_id to match.
 * @param {number} args.intervalMs - Poll interval (default 1000).
 * @param {number} args.timeoutMs  - Hard timeout (default 30000).
 * @param {() => number} args.now  - Timestamp source (default Date.now).
 * @param {(ms: number) => Promise<void>} args.sleep - Sleeper (default setTimeout).
 * @returns {Promise<{asset: object, cloudinaryAsset: object} | null>}
 */
export async function pollForWebhookRow({
  supabase,
  publicId,
  intervalMs = 1000,
  timeoutMs = 30_000,
  now = Date.now,
  sleep = (ms) => new Promise((r) => setTimeout(r, ms)),
}) {
  const start = now();
  const deadline = start + timeoutMs;
  while (now() < deadline) {
    const { data: asset, error } = await supabase
      .from("assets")
      .select("id, brand_id, cloudinary_public_id, dna_status, dna_score")
      .eq("cloudinary_public_id", publicId)
      .maybeSingle();
    if (error) throw error;
    if (!asset?.id) {
      await sleep(intervalMs);
      continue;
    }
    const { data: cloudinaryAsset, error: caError } = await supabase
      .from("cloudinary_assets")
      .select("id, asset_id, status, brand_id, secure_url, public_id, cloudinary_asset_id, version")
      .eq("public_id", publicId)
      .maybeSingle();
    if (caError) throw caError;
    if (cloudinaryAsset?.id && cloudinaryAsset.status === "ready") {
      return { asset, cloudinaryAsset };
    }
    await sleep(intervalMs);
  }
  return null;
}

/**
 * Poll a Supabase client for the DNA state of an asset. Returns as soon as
 * the row has a non-null dna_status or a numeric dna_score. Separate from
 * pollForWebhookRow so the DNA audit (triggered asynchronously via after())
 * has its own deadline independent of the webhook row timeout.
 *
 * @param {object} args
 * @param {object} args.supabase   - Supabase client (admin or scoped).
 * @param {string} args.assetId    - assets.id to poll.
 * @param {number} args.intervalMs - Poll interval (default 2000).
 * @param {number} args.timeoutMs  - Hard timeout (default 90000).
 * @param {() => number} args.now  - Timestamp source (default Date.now).
 * @param {(ms: number) => Promise<void>} args.sleep - Sleeper (default setTimeout).
 * @returns {Promise<{status: "populated" | "pending" | "absent", detail: string, score?: number}>}
 */
export async function pollForDnaState({
  supabase,
  assetId,
  intervalMs = 2000,
  timeoutMs = 90_000,
  now = Date.now,
  sleep = (ms) => new Promise((r) => setTimeout(r, ms)),
}) {
  const deadline = now() + timeoutMs;
  while (now() < deadline) {
    const { data: asset, error } = await supabase
      .from("assets")
      .select("dna_status, dna_score")
      .eq("id", assetId)
      .maybeSingle();
    if (error) throw error;
    const state = interpretDnaState(asset);
    if (state.status !== "absent") return state;
    await sleep(intervalMs);
  }
  const { data: asset } = await supabase
    .from("assets")
    .select("dna_status, dna_score")
    .eq("id", assetId)
    .maybeSingle();
  return interpretDnaState(asset);
}

/**
 * Interpret the DNA state of an assets row. CLD-DATA-001 / audit-asset-dna writes
 * either a populated score or a documented pending state. The smoke test accepts
 * either, but flags a hard null (no DNA write at all) for review.
 *
 * @returns {{ status: "populated" | "pending" | "absent", detail: string, score?: number }}
 */
export function interpretDnaState(asset) {
  if (!asset) return { status: "absent", detail: "asset row missing" };
  const { dna_status, dna_score } = asset;
  if (dna_status && /^(pending|processing|queued|running)$/i.test(dna_status)) {
    return { status: "pending", detail: `dna_status=${dna_status}` };
  }
  if (typeof dna_score === "number" && dna_score >= 0) {
    return { status: "populated", detail: `dna_score=${dna_score}`, score: dna_score };
  }
  if (dna_status && /^(complete|done|approved|scored)$/i.test(dna_status)) {
    return { status: "populated", detail: `dna_status=${dna_status}` };
  }
  return { status: "absent", detail: `dna_status=${dna_status ?? "null"}, dna_score=${dna_score ?? "null"}` };
}

/**
 * Build a signed authenticated delivery URL for the asset-masonry preset.
 * Mirrors app/src/app/api/_lib/cloudinary-signed-url.ts exactly.
 */
export function buildSignedDeliveryUrl(cloudinary, publicId) {
  return cloudinary.url(publicId, {
    type: "authenticated",
    sign_url: true,
    secure: true,
    raw_transformation: ASSET_MASONRY_TRANSFORM,
  });
}

/**
 * Guard: only public_ids under TEST_FOLDER may be cleaned up by this script.
 * Prevents an accidental call with a production public_id from deleting real
 * assets. Exported so the test suite can verify the guard directly.
 */
export function isTestPublicId(publicId, prefix = TEST_PUBLIC_ID_PREFIX) {
  return typeof publicId === "string" && publicId.startsWith(prefix);
}

/**
 * Record a successful asset_id sweep without masking a prior primary-path status.
 * - already "ok" → leave ("ok")
 * - prior "error:…" → "ok-fallback (primary: …)" so the first failure stays visible
 * - skipped / other → "ok-fallback"
 */
function markAssetIdFallbackOk(summary, key) {
  const prev = summary[key];
  if (prev === "ok") return;
  if (String(prev).startsWith("error")) {
    summary[key] = `ok-fallback (primary: ${prev})`;
    return;
  }
  summary[key] = "ok-fallback";
}

function alreadyDeletedOk(status) {
  return status === "ok" || String(status).startsWith("ok-fallback");
}

/**
 * Idempotent sweep by assets.id / cloudinary_assets.asset_id.
 * Always runs when assetId is present (caller already passed the refuse guard).
 * Does not overwrite a prior successful public_id delete with a redundant sweep error.
 */
async function deleteRowsByAssetId(supabase, assetId, summary) {
  try {
    const { error } = await supabase.from("cloudinary_assets").delete().eq("asset_id", assetId);
    if (error) {
      if (!alreadyDeletedOk(summary.cloudinaryAssets)) {
        summary.cloudinaryAssets = `error: ${error.message}`;
      }
    } else {
      markAssetIdFallbackOk(summary, "cloudinaryAssets");
    }
  } catch (e) {
    if (!alreadyDeletedOk(summary.cloudinaryAssets)) {
      summary.cloudinaryAssets = `error: ${sanitizeError(e)}`;
    }
  }
  try {
    const { error } = await supabase.from("assets").delete().eq("id", assetId);
    if (error) {
      if (!alreadyDeletedOk(summary.assets)) {
        summary.assets = `error: ${error.message}`;
      }
    } else {
      markAssetIdFallbackOk(summary, "assets");
    }
  } catch (e) {
    if (!alreadyDeletedOk(summary.assets)) {
      summary.assets = `error: ${sanitizeError(e)}`;
    }
  }
}

/**
 * Idempotent cleanup of a single test fixture: Cloudinary asset + Supabase rows.
 * Refuses to touch public_ids outside the given testPublicIdPrefix (see isTestPublicId).
 * Returns a summary object; never throws (logs errors into the summary instead) so the
 * `finally` block in main() can't itself crash the report.
 *
 * When assetId is known, always deletes by id after the public_id path (idempotent)
 * so a misleading "ok" summary cannot leave orphaned rows.
 * Pass testPublicIdPrefix from the fixture that created the asset — do not rely on
 * module-level mutation.
 */
export async function cleanup({
  cloudinary,
  supabase,
  publicId,
  assetId,
  resourceType = "image",
  testPublicIdPrefix = TEST_PUBLIC_ID_PREFIX,
}) {
  const summary = { cloudinary: "skipped", assets: "skipped", cloudinaryAssets: "skipped" };
  const isTest = Boolean(publicId && isTestPublicId(publicId, testPublicIdPrefix));
  if (publicId && !isTest) {
    const refused = "refused: public_id not under test folder";
    summary.cloudinary = refused;
    summary.assets = refused;
    summary.cloudinaryAssets = refused;
    return summary;
  }
  if (isTest) {
    try {
      const r = await cloudinary.uploader.destroy(publicId, {
        resource_type: resourceType,
        type: "authenticated",
        invalidate: true,
      });
      summary.cloudinary = r?.result ?? "unknown";
    } catch (e) {
      summary.cloudinary = `error: ${sanitizeError(e)}`;
    }
    try {
      const { error } = await supabase.from("cloudinary_assets").delete().eq("public_id", publicId);
      summary.cloudinaryAssets = error ? `error: ${error.message}` : "ok";
    } catch (e) {
      summary.cloudinaryAssets = `error: ${sanitizeError(e)}`;
    }
    try {
      const { error } = await supabase.from("assets").delete().eq("cloudinary_public_id", publicId);
      summary.assets = error ? `error: ${error.message}` : "ok";
    } catch (e) {
      summary.assets = `error: ${sanitizeError(e)}`;
    }
  }
  if (assetId) await deleteRowsByAssetId(supabase, assetId, summary);
  return summary;
}

/** Fetch with an AbortController timeout. */
async function timedFetch(url, opts = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), opts.timeout ?? REQUEST_TIMEOUT_MS);
  try {
    return await fetch(url, { ...opts, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

/** Strip secrets and stack traces from an error for safe reporting. */
export function sanitizeError(e) {
  const msg = e?.message ?? String(e);
  // Never echo api_secret / service-role tokens back to stdout.
  return msg
    .replace(/(api_secret|service_role|service_role_key|password|token)=?[^\s&"]+/gi, "$1=<redacted>")
    .slice(0, 300);
}

// --- Runner --------------------------------------------------------------------

/** QA brand owned by qa@ipix.test (org member) — used when CLD105_BRAND_ID unset. */
export const DEFAULT_QA_BRAND_ID = "db1f728d-bee1-430e-a3e7-0c601da74ce7";

function required(name, value) {
  if (!value) {
    const msg = `Missing required env var: ${name}`;
    console.error(msg);
    throw new Error(msg);
  }
  return value;
}

/** Only attach notificationUrl when the base is https (upload-sign requirement). */
function resolveNotificationUrl(appBaseUrl) {
  const notificationBaseUrl = (process.env.CLD105_NOTIFICATION_BASE_URL ?? "").replace(/\/$/, "");
  if (notificationBaseUrl.startsWith("https:")) {
    return `${notificationBaseUrl}/api/assets/cloudinary/webhook`;
  }
  if (appBaseUrl.startsWith("https:")) {
    return `${appBaseUrl}/api/assets/cloudinary/webhook`;
  }
  return undefined;
}

/** Post a synthetically signed upload notification to the local webhook route. */
async function postSyntheticUploadWebhook({ appBaseUrl, upJson, testFolder }) {
  // Same identity fields as genuine Cloudinary notifications (IPI-641).
  const notifBody = JSON.stringify({
    notification_type: "upload",
    public_id: upJson.public_id,
    secure_url: upJson.secure_url,
    resource_type: upJson.resource_type,
    format: upJson.format,
    bytes: upJson.bytes,
    width: upJson.width,
    height: upJson.height,
    version: upJson.version,
    asset_id: upJson.asset_id,
    folder: testFolder,
    asset_folder: testFolder,
  });
  const notifTimestamp = Math.floor(Date.now() / 1000);
  const notifSecret =
    process.env.CLOUDINARY_NOTIFICATION_API_SECRET?.trim() || CLOUDINARY_API_SECRET;
  const sigPayload = notifBody + notifTimestamp + notifSecret;
  const notifSignature = requireDep("crypto").createHash("sha1").update(sigPayload).digest("hex");
  return timedFetch(`${appBaseUrl}/api/assets/cloudinary/webhook`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-cld-timestamp": String(notifTimestamp),
      "x-cld-signature": notifSignature,
    },
    body: notifBody,
  });
}

function stage(name, ok, detail, { setExitCode = true } = {}) {
  const line = `${ok ? "PASS" : "FAIL"} ${name}${detail ? ` — ${detail}` : ""}`;
  console.log(line);
  if (!ok && setExitCode) process.exitCode = 1;
  return { name, ok, detail };
}

function requireDep(name) {
  const candidates = [
    resolve(appRoot, "node_modules", name),
    resolve(repoRoot, "node_modules", name),
  ];
  for (const p of candidates) {
    if (existsSync(p)) {
      const req = createRequire(resolve(p, "package.json"));
      return req(name);
    }
  }
  return createRequire(resolve(appRoot, "package.json"))(name);
}

function parseCliArgs(argv = process.argv.slice(2)) {
  const out = {
    mode: "smoke",
    keepFixture: false,
    reportFile: null,
  };
  for (const arg of argv) {
    if (arg.startsWith("--mode=")) out.mode = arg.slice("--mode=".length);
    else if (arg === "--keep-fixture") out.keepFixture = true;
    else if (arg.startsWith("--report-file=")) out.reportFile = arg.slice("--report-file=".length);
  }
  if (out.mode !== "smoke" && out.mode !== "fixture") {
    throw new Error(`Unsupported --mode=${out.mode} (expected smoke|fixture)`);
  }
  if (out.mode === "fixture") out.keepFixture = true;
  return out;
}

async function resolveOperatorAuth(supabaseFactory) {
  const token = process.env.CLD105_OPERATOR_TOKEN;
  if (token) {
    console.log(`PASS operator-auth — using CLD105_OPERATOR_TOKEN (${token.length} chars)`);
    return token === "dev" ? null : `Bearer ${token}`;
  }
  const email = process.env.CLD105_OPERATOR_EMAIL;
  const password = process.env.CLD105_OPERATOR_PASSWORD;
  if (!email || !password) {
    console.log("PASS operator-auth — dev bypass (no creds, OPERATOR_AUTH_ENABLED=false expected)");
    return null;
  }
  const publishableKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const auth = supabaseFactory(
    required("NEXT_PUBLIC_SUPABASE_URL", process.env.NEXT_PUBLIC_SUPABASE_URL),
    required("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", publishableKey),
    { auth: { persistSession: false } },
  );
  const { data, error } = await auth.auth.signInWithPassword({ email, password });
  if (error || !data.session) {
    throw new Error(`operator sign-in failed: ${sanitizeError(error ?? new Error("no session"))}`);
  }
  console.log(`PASS operator-auth — signed in as ${email}`);
  return `Bearer ${data.session.access_token}`;
}

/**
 * Keep fixture when --keep-fixture / mode=fixture, independent of exitCode.
 * Any publicId or assetId means there is something worth preserving for debug.
 */
export function shouldKeepFixture({ keepFixture, publicId, assetId }) {
  return Boolean(keepFixture && (publicId || assetId));
}

function envPositiveMs(name, fallback) {
  const n = Number(process.env[name] ?? fallback);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

function ensureWsPolyfill() {
  if (typeof globalThis.WebSocket !== "undefined") return;
  try {
    const { WebSocket: WS } = requireDep("ws");
    globalThis.WebSocket = WS;
  } catch {
    /* REST-only */
  }
}

async function signAndUploadTestPng({
  appBaseUrl,
  authHeader,
  brandId,
  workType,
  testFolder,
  testPublicIdPrefix,
  runId,
  imageBytes,
  notificationUrl,
  push,
}) {
  // upload-sign ignores client folder; workType drives taxonomy asset_folder.
  const signBody = {
    brandId,
    resourceType: "image",
    filename: `${runId}.png`,
    workType: workType ?? FIXTURE_WORK_TYPE,
    ...(notificationUrl ? { notificationUrl } : {}),
  };
  const signRes = await timedFetch(`${appBaseUrl}/api/assets/upload-sign`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(authHeader ? { Authorization: authHeader } : {}),
    },
    body: JSON.stringify(signBody),
  });
  if (!signRes.ok) {
    const t = await signRes.text().catch(() => "");
    push("upload-signature", false, `HTTP ${signRes.status} ${t.slice(0, 200)}`);
    throw new Error("upload-signature failed");
  }
  const signed = await signRes.json();
  // Guard: signed folder must match our fixture scope (taxonomy path).
  if (signed.assetFolder && signed.assetFolder !== testFolder) {
    push(
      "upload-signature",
      false,
      `assetFolder=${signed.assetFolder} !== expected ${testFolder}`,
    );
    throw new Error("upload-signature folder mismatch");
  }
  push("upload-signature", true, `folder=${signed.assetFolder}`);

  const form = new FormData();
  form.append("file", new Blob([imageBytes], { type: "image/png" }), `${runId}.png`);
  form.append("api_key", signed.apiKey);
  form.append("timestamp", String(signed.timestamp));
  form.append("signature", signed.signature);
  if (signed.filename) form.append("filename", signed.filename);
  for (const [k, v] of Object.entries(signed.params)) form.append(k, String(v));
  const upRes = await timedFetch(signed.uploadUrl, { method: "POST", body: form, timeout: 30_000 });
  const upText = await upRes.text();
  let upJson;
  try {
    upJson = JSON.parse(upText);
  } catch {
    upJson = null;
  }
  const validated = validateUploadResponse(upJson);
  if (!validated.ok || !upRes.ok) {
    push("cloudinary-upload", false, `HTTP ${upRes.status} ${validated.error ?? upText.slice(0, 400)}`);
    throw new Error("cloudinary-upload failed");
  }
  if (!isTestPublicId(validated.publicId, testPublicIdPrefix)) {
    push(
      "cloudinary-upload",
      false,
      `public_id=${validated.publicId} is not under ${testPublicIdPrefix}`,
    );
    throw new Error("cloudinary-upload public_id outside test folder");
  }
  push("cloudinary-upload", true, `public_id=${validated.publicId} bytes=${validated.bytes}`);
  return { publicId: validated.publicId, upJson };
}

async function ingestViaSyntheticWebhook({ appBaseUrl, admin, upJson, testFolder, publicId, brandId, push }) {
  const notifRes = await postSyntheticUploadWebhook({ appBaseUrl, upJson, testFolder });
  if (!notifRes.ok) {
    const t = await notifRes.text().catch(() => "");
    push("synthetic-webhook-processed", false, `HTTP ${notifRes.status} ${t.slice(0, 200)}`);
    throw new Error("webhook endpoint rejected notification");
  }

  let rows;
  try {
    rows = await pollForWebhookRow({
      supabase: admin,
      publicId,
      intervalMs: envPositiveMs("CLD105_POLL_INTERVAL_MS", 1000),
      timeoutMs: envPositiveMs("CLD105_POLL_TIMEOUT_MS", 30_000),
    });
  } catch (e) {
    push("synthetic-webhook-processed", false, sanitizeError(e));
    throw e;
  }
  if (!rows?.asset?.id) {
    push("synthetic-webhook-processed", false, "timed out waiting for assets row after notification");
    push("supabase-row", false, "no row written by webhook");
    throw new Error("webhook did not write rows");
  }
  if (rows.asset.brand_id !== brandId) {
    push("supabase-row", false, `assets.brand_id=${rows.asset.brand_id} does not match test brand ${brandId}`);
    throw new Error("brand_id mismatch on assets row");
  }
  if (rows.cloudinaryAsset.brand_id !== brandId) {
    push(
      "supabase-row",
      false,
      `cloudinary_assets.brand_id=${rows.cloudinaryAsset.brand_id} does not match test brand ${brandId}`,
    );
    throw new Error("brand_id mismatch on cloudinary_assets row");
  }
  // IPI-641: fresh-upload path requires identity (validateUploadResponse already enforces upJson).
  if (rows.cloudinaryAsset.cloudinary_asset_id !== upJson.asset_id) {
    push(
      "supabase-row",
      false,
      `cloudinary_asset_id=${rows.cloudinaryAsset.cloudinary_asset_id} expected ${upJson.asset_id}`,
    );
    throw new Error("cloudinary_asset_id not persisted from upload response");
  }
  if (Number(rows.cloudinaryAsset.version) !== Number(upJson.version)) {
    push(
      "supabase-row",
      false,
      `version=${rows.cloudinaryAsset.version} expected ${upJson.version}`,
    );
    throw new Error("version not persisted from upload response");
  }
  push("synthetic-webhook-processed", true, `assets.id=${rows.asset.id}`);
  push(
    "supabase-row",
    true,
    `status=${rows.cloudinaryAsset.status}, brand_id=${rows.asset.brand_id}, cloudinary_asset_id=${rows.cloudinaryAsset.cloudinary_asset_id}, version=${rows.cloudinaryAsset.version}`,
  );
  return rows;
}

/**
 * Create one disposable Cloudinary + Supabase fixture via the real upload-sign
 * route and a synthetic signed webhook (deterministic CI path).
 *
 * Shared by CLD-105 smoke and IPI-512 fixture mode / Playwright.
 *
 * Optional `progress` object is mutated as soon as Cloudinary/Supabase clients
 * (and later publicId/assetId) exist, so callers can cleanup() even when this
 * function throws mid-pipeline.
 */
export async function createDisposableFixture({ skipDna = false, log = true, progress } = {}) {
  const stages = [];
  const push = (name, ok, detail) => {
    const s = stage(name, ok, detail, { setExitCode: false });
    stages.push(s);
    return s;
  };

  const cloudName = required("CLOUDINARY_CLOUD_NAME", CLOUDINARY_CLOUD_NAME);
  required("CLOUDINARY_API_KEY", CLOUDINARY_API_KEY);
  required("CLOUDINARY_API_SECRET", CLOUDINARY_API_SECRET);
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.NEXT_SUPABASE_URL;
  required("NEXT_PUBLIC_SUPABASE_URL", supabaseUrl);
  const serviceRoleKey = required("SUPABASE_SERVICE_ROLE_KEY", process.env.SUPABASE_SERVICE_ROLE_KEY);
  const brandId = required(
    "CLD105_BRAND_ID",
    process.env.CLD105_BRAND_ID || DEFAULT_QA_BRAND_ID,
  );

  const { v2: cloudinary } = requireDep("cloudinary");
  cloudinary.config({
    cloud_name: cloudName,
    api_key: CLOUDINARY_API_KEY,
    api_secret: CLOUDINARY_API_SECRET,
    secure: true,
  });
  ensureWsPolyfill();
  const { createClient } = requireDep("@supabase/supabase-js");
  const supabaseFactory = (url, key, opts) =>
    createClient(url, key, { auth: { persistSession: false }, ...opts });
  const admin = supabaseFactory(supabaseUrl, serviceRoleKey, {});

  // Taxonomy folder needs orgId. Prefer CLD105_ORG_ID; else brands.org_id for this brand.
  let orgId = process.env.CLD105_ORG_ID?.trim() || "";
  if (!orgId) {
    const { data: brandRow, error: brandErr } = await admin
      .from("brands")
      .select("org_id")
      .eq("id", brandId)
      .maybeSingle();
    if (brandErr) throw new Error(`resolve org_id for brand: ${brandErr.message}`);
    orgId = brandRow?.org_id ?? "";
  }
  if (!orgId) {
    throw new Error(
      "CLD105_ORG_ID unset and brands.org_id missing — set CLD105_ORG_ID for live taxonomy fixtures",
    );
  }
  const { testFolder, testPublicIdPrefix, workType } = testScopeForBrand(brandId, orgId);

  let publicId;
  let assetId;
  const syncProgress = () => {
    if (!progress) return;
    Object.assign(progress, {
      brandId,
      testFolder,
      testPublicIdPrefix,
      cloudinary,
      supabase: admin,
      publicId,
      assetId,
      stages,
      cleanup: () =>
        cleanup({ cloudinary, supabase: admin, publicId, assetId, testPublicIdPrefix }),
    });
  };
  syncProgress();

  const appBaseUrl = (process.env.CLD105_APP_BASE_URL ?? "http://localhost:3002").replace(/\/$/, "");
  // upload-sign requires https for notificationUrl. This fixture posts a
  // synthetic signed webhook itself (Cloudinary async delivery is not proven),
  // so only attach notificationUrl when an explicit https base is provided.
  const notificationUrl = resolveNotificationUrl(appBaseUrl);
  const RUN_ID = `cld105-${Date.now()}-${randomUUID().slice(0, 8)}`;
  if (progress) progress.runId = RUN_ID;
  if (log) {
    console.log(`\nCloudinary disposable fixture — run ${RUN_ID}`);
    console.log(`  app:        ${appBaseUrl}`);
    console.log(`  brand:      ${brandId}`);
    console.log(`  notifyUrl:  ${notificationUrl ?? "(omitted — synthetic webhook path)"}\n`);
  }

  const imageBytes = generateTestImage(RUN_ID);
  push("image-created", true, `${imageBytes.length} bytes`);
  const authHeader = await resolveOperatorAuth(supabaseFactory);
  const uploaded = await signAndUploadTestPng({
    appBaseUrl,
    authHeader,
    brandId,
    workType,
    testFolder,
    testPublicIdPrefix,
    runId: RUN_ID,
    imageBytes,
    notificationUrl,
    push,
  });
  publicId = uploaded.publicId;
  syncProgress();

  const rows = await ingestViaSyntheticWebhook({
    appBaseUrl,
    admin,
    upJson: uploaded.upJson,
    testFolder,
    publicId,
    brandId,
    push,
  });
  assetId = rows.asset.id;
  syncProgress();

  if (!skipDna) {
    const dna = await pollForDnaState({
      supabase: admin,
      assetId,
      intervalMs: 2000,
      timeoutMs: envPositiveMs("CLD105_DNA_TIMEOUT_MS", 90_000),
    });
    push("dna-status", dna.status !== "absent", `${dna.status} (${dna.detail})`);
    if (dna.status === "absent") throw new Error("dna-status not populated after poll");
  }

  return {
    runId: RUN_ID,
    brandId,
    publicId,
    assetId,
    testFolder,
    testPublicIdPrefix,
    asset: rows.asset,
    cloudinaryAsset: rows.cloudinaryAsset,
    cloudinary,
    supabase: admin,
    stages,
    cleanup: () =>
      cleanup({ cloudinary, supabase: admin, publicId, assetId, testPublicIdPrefix }),
  };
}

async function main() {
  const cli = parseCliArgs();
  const startedAt = Date.now();
  const report = {
    mode: cli.mode,
    startedAt: new Date(startedAt).toISOString(),
    stages: [],
  };

  let fixture;
  /** Partial handle updated during create — used for cleanup if create throws. */
  const progress = {};
  let stages = [];
  try {
    fixture = await createDisposableFixture({
      skipDna: cli.mode === "fixture",
      log: true,
      progress,
    });
    stages = [...fixture.stages];
    report.runId = fixture.runId;
    report.assetId = fixture.assetId;
    report.publicId = fixture.publicId;
    report.brandId = fixture.brandId;

    if (cli.mode === "smoke") {
      const deliveryUrl = buildSignedDeliveryUrl(fixture.cloudinary, fixture.publicId);
      stages.push(stage("signed-delivery", true, "URL generated"));
      const dRes = await timedFetch(deliveryUrl);
      const ct = dRes.headers.get("content-type") ?? "";
      stages.push(
        stage("delivery-http-200", dRes.ok && ct.startsWith("image/"), `HTTP ${dRes.status} ${ct}`),
      );
      if (!dRes.ok || !ct.startsWith("image/")) throw new Error("delivery-http-200 failed");
    } else {
      stages.push(
        stage(
          "fixture-kept",
          true,
          `assetId=${fixture.assetId} publicId=${fixture.publicId}`,
        ),
      );
      const reportPath = resolve(
        __dirname,
        cli.reportFile ?? ".ipi512-fixture.json",
      );
      writeFileSync(
        reportPath,
        JSON.stringify(
          {
            runId: fixture.runId,
            assetId: fixture.assetId,
            publicId: fixture.publicId,
            brandId: fixture.brandId,
            kept: true,
            createdAt: report.startedAt,
          },
          null,
          2,
        ),
      );
      console.log(`Fixture manifest: ${reportPath}`);
    }
  } catch (e) {
    if (progress.stages?.length && stages.length === 0) stages = [...progress.stages];
    report.runId ??= progress.runId;
    report.assetId ??= progress.assetId;
    report.publicId ??= progress.publicId;
    report.brandId ??= progress.brandId;
    if (stages.length === 0 || stages[stages.length - 1].name !== "pipeline-error") {
      stages.push(stage("pipeline-error", false, sanitizeError(e)));
    }
  } finally {
    const publicId = fixture?.publicId ?? progress.publicId;
    const assetId = fixture?.assetId ?? progress.assetId;
    if (shouldKeepFixture({ keepFixture: cli.keepFixture, publicId, assetId })) {
      stages.push(stage("cleanup", true, "skipped (--keep-fixture / mode=fixture)"));
    } else {
      await new Promise((r) => setTimeout(r, 2000));
      const runCleanup = fixture?.cleanup ?? progress.cleanup;
      const cleanupSummary = runCleanup
        ? await runCleanup()
        : { cloudinary: "skipped", assets: "skipped", cloudinaryAssets: "skipped" };
      const cleanupOk = Object.values(cleanupSummary).every(
        (v) =>
          v === "ok" ||
          v === "ok-fallback" ||
          String(v).startsWith("ok-fallback") ||
          v === "skipped" ||
          v === "not found" ||
          (!String(v).startsWith("error") && !String(v).startsWith("refused")),
      );
      stages.push(
        stage(
          "cleanup",
          cleanupOk,
          `cld=${cleanupSummary.cloudinary} assets=${cleanupSummary.assets} cloudinary_assets=${cleanupSummary.cloudinaryAssets}`,
        ),
      );
    }
  }

  const durationMs = Date.now() - startedAt;
  const pipelinePass = process.exitCode !== 1;
  report.stages = stages;
  report.durationMs = durationMs;
  report.pipeline = pipelinePass ? "PASS" : "FAIL";

  writeFileSync(resolve(__dirname, ".cld105-report.json"), JSON.stringify(report, null, 2));

  console.log(`\nCloudinary pipeline (${cli.mode}): ${report.pipeline}`);
  console.log(`Duration: ${(durationMs / 1000).toFixed(1)}s\n`);
  process.exit(pipelinePass ? 0 : 1);
}

const isMain =
  import.meta.url === `file://${process.argv[1]}` ||
  process.argv[1]?.endsWith("verify-cloudinary-pipeline.mjs");
if (isMain) {
  main().catch((e) => {
    console.error(sanitizeError(e));
    process.exit(2);
  });
}
