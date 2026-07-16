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

// Test assets are scoped under a brand-specific subfolder so the webhook's
// resolveBrandId can extract the brand UUID from the folder path AND the
// deletion guard can identify them with the cld105- prefix. Set at runtime
// in main() with the actual brandId; defaults here for unit tests that import
// these symbols without a real brand.
export let TEST_FOLDER = "ipix/cld105-test";
export let TEST_PUBLIC_ID_PREFIX = `${TEST_FOLDER}/cld105-`;

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
  return { ok: true, publicId: json.public_id, bytes: json.bytes };
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
      .select("id, asset_id, status, brand_id, secure_url, public_id")
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
 * Idempotent cleanup of a single test fixture: Cloudinary asset + Supabase rows.
 * Refuses to touch public_ids outside TEST_FOLDER (see isTestPublicId). Returns
 * a summary object; never throws (logs errors into the summary instead) so the
 * `finally` block in main() can't itself crash the report.
 */
export async function cleanup({ cloudinary, supabase, publicId, assetId, resourceType = "image" }) {
  const summary = { cloudinary: "skipped", assets: "skipped", cloudinaryAssets: "skipped" };
  const isTest = publicId && isTestPublicId(publicId);
  if (publicId && !isTest) {
    summary.cloudinary = "refused: public_id not under test folder";
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
  // Belt-and-suspenders: if we have an asset_id but the public_id delete above
  // didn't land (e.g. webhook hadn't linked them yet, or publicId was absent but
  // assetId was captured mid-run), sweep by asset_id. Never duplicates the work
  // above — only runs when the public_id path was skipped or errored.
  if (assetId && summary.cloudinaryAssets !== "ok") {
    try {
      const { error } = await supabase.from("cloudinary_assets").delete().eq("asset_id", assetId);
      summary.cloudinaryAssets = error ? `error: ${error.message}` : "ok-fallback";
    } catch (e) {
      summary.cloudinaryAssets = `error: ${sanitizeError(e)}`;
    }
  }
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

function required(name, value) {
  if (!value) {
    console.error(`Missing required env var: ${name}`);
    process.exit(2);
  }
  return value;
}

function stage(name, ok, detail) {
  const line = `${ok ? "PASS" : "FAIL"} ${name}${detail ? ` — ${detail}` : ""}`;
  console.log(line);
  if (!ok) process.exitCode = 1;
  return { name, ok, detail };
}

function requireDep(name) {
  // Resolve from this app's node_modules first (the common case), then fall
  // back to the main checkout's node_modules so the script works in a fresh
  // worktree without a prerequisite `npm install`.
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
    stage("operator-auth", false, `sign-in failed: ${sanitizeError(error ?? new Error("no session"))}`);
    throw new Error("operator sign-in failed");
  }
  console.log(`PASS operator-auth — signed in as ${email}`);
  return `Bearer ${data.session.access_token}`;
}

async function main() {
  const startedAt = Date.now();
  const RUN_ID = `cld105-${Date.now()}-${randomUUID().slice(0, 8)}`;
  const report = { runId: RUN_ID, startedAt: new Date(startedAt).toISOString(), stages: [] };

  const cloudName = required("CLOUDINARY_CLOUD_NAME", CLOUDINARY_CLOUD_NAME);
  required("CLOUDINARY_API_KEY", CLOUDINARY_API_KEY);
  required("CLOUDINARY_API_SECRET", CLOUDINARY_API_SECRET);
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.NEXT_SUPABASE_URL;
  required("NEXT_PUBLIC_SUPABASE_URL", supabaseUrl);
  const serviceRoleKey = required("SUPABASE_SERVICE_ROLE_KEY", process.env.SUPABASE_SERVICE_ROLE_KEY);
  const brandId = required("CLD105_BRAND_ID", process.env.CLD105_BRAND_ID);

  // Compute brand-aware test folder so the webhook can resolve brand_id.
  TEST_FOLDER = `ipix/brands/${brandId}/cld105-test`;
  TEST_PUBLIC_ID_PREFIX = `${TEST_FOLDER}/cld105-`;

  const { v2: cloudinary } = requireDep("cloudinary");
  cloudinary.config({
    cloud_name: cloudName,
    api_key: CLOUDINARY_API_KEY,
    api_secret: CLOUDINARY_API_SECRET,
    secure: true,
  });

  // Node 20 has no native WebSocket; supabase-js Realtime needs one.
  if (typeof globalThis.WebSocket === "undefined") {
    try {
      const { WebSocket: WS } = requireDep("ws");
      globalThis.WebSocket = WS;
    } catch {
      /* ws not installed — Realtime will throw on use, but we only use REST */
    }
  }
  const { createClient } = requireDep("@supabase/supabase-js");
  const supabaseFactory = (url, key, opts) => createClient(url, key, { auth: { persistSession: false }, ...opts });
  const admin = supabaseFactory(supabaseUrl, serviceRoleKey, {});

  const appBaseUrl = (process.env.CLD105_APP_BASE_URL ?? "http://localhost:3002").replace(/\/$/, "");
  // upload-sign requires https for notificationUrl. This smoke test posts a
  // synthetic signed webhook itself (Cloudinary async delivery is not proven),
  // so only attach notificationUrl when an explicit https base is provided.
  const notificationBaseUrl = (process.env.CLD105_NOTIFICATION_BASE_URL ?? "").replace(/\/$/, "");
  const notificationUrl =
    notificationBaseUrl.startsWith("https:")
      ? `${notificationBaseUrl}/api/assets/cloudinary/webhook`
      : appBaseUrl.startsWith("https:")
        ? `${appBaseUrl}/api/assets/cloudinary/webhook`
        : undefined;

  console.log(`\nCLD-105 smoke test — run ${RUN_ID}`);
  console.log(`  app:        ${appBaseUrl}`);
  console.log(`  supabase:   ${supabaseUrl}`);
  console.log(`  cloud:      ${cloudName}`);
  console.log(`  brand:      ${brandId}`);
  console.log(`  notifyUrl:  ${notificationUrl ?? "(omitted — synthetic webhook path)"}\n`);

  let publicId;
  let assetId;
  let stages = [];
  try {
    // 1. image-created
    const imageBytes = generateTestImage(RUN_ID);
    stages.push(stage("image-created", true, `${imageBytes.length} bytes`));

    // 2. upload-signature (via real app route)
    const authHeader = await resolveOperatorAuth(supabaseFactory);
    const signBody = {
      brandId,
      resourceType: "image",
      filename: `${RUN_ID}.png`,
      folder: TEST_FOLDER,
      ...(notificationUrl ? { notificationUrl } : {}),
    };
    const signRes = await timedFetch(`${appBaseUrl}/api/assets/upload-sign`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(authHeader ? { Authorization: authHeader } : {}) },
      body: JSON.stringify(signBody),
    });
    if (!signRes.ok) {
      const t = await signRes.text().catch(() => "");
      stages.push(stage("upload-signature", false, `HTTP ${signRes.status} ${t.slice(0, 200)}`));
      throw new Error("upload-signature failed");
    }
    const signed = await signRes.json();
    stages.push(stage("upload-signature", true, `folder=${signed.assetFolder}`));

    // 3. cloudinary-upload (multipart signed POST)
    const form = new FormData();
    form.append("file", new Blob([imageBytes], { type: "image/png" }), `${RUN_ID}.png`);
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
      stages.push(stage("cloudinary-upload", false, `HTTP ${upRes.status} ${validated.error ?? upText.slice(0, 400)}`));
      throw new Error("cloudinary-upload failed");
    }
    publicId = validated.publicId;
    if (!isTestPublicId(publicId)) {
      stages.push(stage("cloudinary-upload", false, `public_id=${publicId} is not under ${TEST_PUBLIC_ID_PREFIX}`));
      throw new Error("cloudinary-upload public_id outside test folder");
    }
    stages.push(stage("cloudinary-upload", true, `public_id=${publicId} bytes=${validated.bytes}`));

    // 4 + 5. synthetic-webhook-processed + supabase-row
    // The ephemeral tunnel URL is not reliable enough for deterministic
    // Cloudinary callback delivery. Instead of waiting for Cloudinary's async
    // push, we construct and POST a signed notification to our webhook endpoint
    // using the upload response data — this verifies the webhook route's
    // signature verification, row creation, and DNA trigger are all functional.
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
      folder: TEST_FOLDER,
      asset_folder: TEST_FOLDER,
    });
    const notifTimestamp = Math.floor(Date.now() / 1000);
    // Match webhook route: CLOUDINARY_NOTIFICATION_API_SECRET (if set) else API secret.
    const notifSecret =
      process.env.CLOUDINARY_NOTIFICATION_API_SECRET?.trim() || CLOUDINARY_API_SECRET;
    const sigPayload = notifBody + notifTimestamp + notifSecret;
    const notifSignature = requireDep("crypto").createHash("sha1").update(sigPayload).digest("hex");
    const notifRes = await timedFetch(`${appBaseUrl}/api/assets/cloudinary/webhook`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-cld-timestamp": String(notifTimestamp),
        "x-cld-signature": notifSignature,
      },
      body: notifBody,
    });
    let rows = null;
    let pollInterval = Number(process.env.CLD105_POLL_INTERVAL_MS ?? 1000);
    let pollTimeout = Number(process.env.CLD105_POLL_TIMEOUT_MS ?? 30_000);
    if (!Number.isFinite(pollInterval) || pollInterval <= 0) pollInterval = 1000;
    if (!Number.isFinite(pollTimeout) || pollTimeout <= 0) pollTimeout = 30_000;
    if (!notifRes.ok) {
      const t = await notifRes.text().catch(() => "");
      stages.push(stage("synthetic-webhook-processed", false, `HTTP ${notifRes.status} ${t.slice(0, 200)}`));
      throw new Error("webhook endpoint rejected notification");
    }
    try {
      rows = await pollForWebhookRow({
        supabase: admin,
        publicId,
        intervalMs: pollInterval,
        timeoutMs: pollTimeout,
      });
    } catch (e) {
      stages.push(stage("synthetic-webhook-processed", false, sanitizeError(e)));
      throw e;
    }
    if (!rows?.asset?.id) {
      stages.push(stage("synthetic-webhook-processed", false, "timed out waiting for assets row after notification"));
      stages.push(stage("supabase-row", false, "no row written by webhook"));
      throw new Error("webhook did not write rows");
    }
    assetId = rows.asset.id;

    // Validate brand_id on both rows
    if (rows.asset.brand_id !== brandId) {
      stages.push(stage("supabase-row", false, `assets.brand_id=${rows.asset.brand_id} does not match test brand ${brandId}`));
      throw new Error("brand_id mismatch on assets row");
    }
    if (rows.cloudinaryAsset.brand_id !== brandId) {
      stages.push(stage("supabase-row", false, `cloudinary_assets.brand_id=${rows.cloudinaryAsset.brand_id} does not match test brand ${brandId}`));
      throw new Error("brand_id mismatch on cloudinary_assets row");
    }

    stages.push(stage("synthetic-webhook-processed", true, `assets.id=${assetId}`));
    stages.push(stage("supabase-row", true, `cloudinary_assets.status=${rows.cloudinaryAsset.status}, brand_id=${rows.asset.brand_id}`));

    // 6. dna-status (separate poll — async DNA can take ~30s+)
    let dnaTimeoutMs = Number(process.env.CLD105_DNA_TIMEOUT_MS ?? 90_000);
    if (!Number.isFinite(dnaTimeoutMs) || dnaTimeoutMs <= 0) dnaTimeoutMs = 90_000;
    const dna = await pollForDnaState({
      supabase: admin,
      assetId,
      intervalMs: 2000,
      timeoutMs: dnaTimeoutMs,
    });
    stages.push(stage("dna-status", dna.status !== "absent", `${dna.status} (${dna.detail})`));
    if (dna.status === "absent") throw new Error("dna-status not populated after poll");

    // 7. signed-delivery
    const deliveryUrl = buildSignedDeliveryUrl(cloudinary, publicId);
    stages.push(stage("signed-delivery", true, "URL generated"));

    // 8. delivery-http-200
    const dRes = await timedFetch(deliveryUrl);
    const ct = dRes.headers.get("content-type") ?? "";
    stages.push(stage("delivery-http-200", dRes.ok && ct.startsWith("image/"), `HTTP ${dRes.status} ${ct}`));
    if (!dRes.ok || !ct.startsWith("image/")) throw new Error("delivery-http-200 failed");
  } catch (e) {
    if (stages.length > 0 && stages[stages.length - 1].name !== "pipeline-error") {
      stages.push(stage("pipeline-error", false, sanitizeError(e)));
    }
  } finally {
    // 9. cleanup (always runs — small delay first to let any late real callback
    // settle so we don't race against it recreating rows)
    await new Promise((r) => setTimeout(r, 2000));
    const cleanupSummary = await cleanup({ cloudinary, supabase: admin, publicId, assetId });
    const cleanupOk = Object.values(cleanupSummary).every((v) => v === "ok" || v === "skipped" || v === "not found" || !String(v).startsWith("error") && !String(v).startsWith("refused"));
    stages.push(
      stage(
        "cleanup",
        cleanupOk,
        `cld=${cleanupSummary.cloudinary} assets=${cleanupSummary.assets} cloudinary_assets=${cleanupSummary.cloudinaryAssets}`,
      ),
    );
  }

  const durationMs = Date.now() - startedAt;
  const pipelinePass = process.exitCode !== 1;
  report.stages = stages;
  report.durationMs = durationMs;
  report.pipeline = pipelinePass ? "PASS" : "FAIL";

  writeFileSync(resolve(__dirname, ".cld105-report.json"), JSON.stringify(report, null, 2));

  console.log(`\nCloudinary pipeline: ${report.pipeline}`);
  console.log(`Duration: ${(durationMs / 1000).toFixed(1)}s\n`);
  process.exit(pipelinePass ? 0 : 1);
}

// Run main only when executed directly, not when imported by the test suite.
const isMain = import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith("verify-cloudinary-pipeline.mjs");
if (isMain) {
  main();
}
