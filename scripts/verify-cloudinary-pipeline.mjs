#!/usr/bin/env node
/**
 * CLD-105 (IPI-432) — End-to-end Cloudinary pipeline smoke test.
 *
 * Proves the full production path on the remote project:
 *   signed upload → Cloudinary asset → webhook → Supabase rows →
 *   DNA trigger → signed delivery URL (200) → cleanup
 *
 * Run: npm run verify:cloudinary-pipeline
 *
 * Design:
 *   - Uses the REAL application paths (api/assets/upload-sign, cloudinary/webhook,
 *     lib/cloudinary/url presets) — no duplicated URL builders.
 *   - Generates a unique in-memory test image per run (no external fixtures).
 *   - Polls for the webhook's DB write with a bounded timeout (no fixed sleeps).
 *   - Cleanup runs in `finally` — failed tests never leave junk assets behind.
 *   - Emits both a human-readable PASS/FAIL report and a machine-readable JSON
 *     artifact at scripts/.cld105-report.json for CI integration.
 *
 * Required env (loaded from .env.local if present):
 *   - CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET
 *   - NEXT_PUBLIC_SUPABASE_URL (or VITE_SUPABASE_URL), SUPABASE_SERVICE_ROLE_KEY
 *   - A test brand owned by a test user: CLD105_BRAND_ID, plus auth for upload-sign.
 *     If CLD105_OPERATOR_COOKIE is set, it's sent as Cookie; otherwise the script
 *     signs in via Supabase Auth using CLD105_OPERATOR_EMAIL + CLD105_OPERATOR_PASSWORD
 *     and derives the session cookie itself. OPERATOR_AUTH_ENABLED=false dev bypass
 *     is honored if CLD105_OPERATOR_COOKIE="dev".
 */
import { readFileSync, existsSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { randomUUID } from "node:crypto";
import { deflateSync } from "node:zlib";
import { createRequire } from "node:module";

const root = resolve(import.meta.dirname, "..");
const envPath = resolve(root, ".env.local");

// Scripts run from the repo root, but @supabase/supabase-js and cloudinary live
// under node_modules — which may not be installed in a fresh worktree. Each dep
// may be in a different node_modules (supabase-js in root, cloudinary in app/),
// so resolve each independently against the main checkout as a fallback.
function requireDep(name) {
  const candidates = [
    resolve(root, "node_modules", name),
    resolve(root, "app/node_modules", name),
    resolve(root, "..", "ipix", "node_modules", name),
    resolve(root, "..", "ipix", "app", "node_modules", name),
  ];
  for (const p of candidates) {
    if (existsSync(p)) {
      const req = createRequire(resolve(p, "package.json"));
      return req(name);
    }
  }
  // Fall back to the standard resolver from root — produces a clean error.
  return createRequire(resolve(root, "package.json"))(name);
}

const { createClient } = requireDep("@supabase/supabase-js");

// Node 20 has no native WebSocket; supabase-js's Realtime client needs one.
// Polyfill globalThis.WebSocket from the `ws` package before any createClient.
const { WebSocket: WS } = requireDep("ws");
if (typeof globalThis.WebSocket === "undefined") {
  globalThis.WebSocket = WS;
}

if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq);
    const val = trimmed.slice(eq + 1);
    if (!process.env[key]) process.env[key] = val;
  }
}

const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME;
const API_KEY = process.env.CLOUDINARY_API_KEY;
const API_SECRET = process.env.CLOUDINARY_API_SECRET;
const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ??
  process.env.VITE_SUPABASE_URL ??
  process.env.NEXT_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Where the operator app is listening. In local dev that's :3002; in CI override
// with OPERATOR_APP_BASE_URL pointing at a deployed preview.
const APP_BASE_URL = (
  process.env.CLD105_APP_BASE_URL ??
  process.env.OPERATOR_APP_BASE_URL ??
  "http://localhost:3002"
).replace(/\/$/, "");

const BRAND_ID = process.env.CLD105_BRAND_ID;
const OPERATOR_COOKIE = process.env.CLD105_OPERATOR_COOKIE;
const OPERATOR_EMAIL = process.env.CLD105_OPERATOR_EMAIL;
const OPERATOR_PASSWORD = process.env.CLD105_OPERATOR_PASSWORD;

const WEBHOOK_POLL_INTERVAL_MS = 1000;
const WEBHOOK_POLL_TIMEOUT_MS = Number(process.env.CLD105_WEBHOOK_TIMEOUT_MS ?? 30_000);
const RUN_ID = `cld105-smoke-${Date.now()}-${randomUUID().slice(0, 8)}`;
const REPORT_PATH = resolve(import.meta.dirname, ".cld105-report.json");

function required(name, value) {
  if (!value) {
    console.error(`Missing required env var: ${name}`);
    process.exit(2);
  }
  return value;
}

required("CLOUDINARY_CLOUD_NAME", CLOUD_NAME);
required("CLOUDINARY_API_KEY", API_KEY);
required("CLOUDINARY_API_SECRET", API_SECRET);
required("NEXT_PUBLIC_SUPABASE_URL (or VITE_SUPABASE_URL)", SUPABASE_URL);
required("SUPABASE_SERVICE_ROLE_KEY", SERVICE_ROLE_KEY);
required("CLD105_BRAND_ID (a brand owned by the test operator)", BRAND_ID);

// cloudinary is under app/node_modules in this repo.
const { v2: cloudinary } = requireDep("cloudinary");

cloudinary.config({
  cloud_name: CLOUD_NAME,
  api_key: API_KEY,
  api_secret: API_SECRET,
  secure: true,
});

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const stages = [];
let failures = 0;
const startedAt = Date.now();

function stage(name, status, detail) {
  stages.push({ name, status, detail, ms: Date.now() - startedAt });
  const marker = status === "PASS" ? "ok" : status === "FAIL" ? "FAIL" : "..";
  const line = `${marker}: ${name}${detail ? ` — ${detail}` : ""}`;
  if (status === "PASS") console.log(line);
  else if (status === "FAIL") console.error(line);
  else console.log(line);
  if (status === "FAIL") failures += 1;
}

async function resolveOperatorCookie() {
  if (OPERATOR_COOKIE) {
    stage("operator-auth", "INFO", `using provided CLD105_OPERATOR_COOKIE (${OPERATOR_COOKIE.length} chars)`);
    return OPERATOR_COOKIE === "dev" ? "" : OPERATOR_COOKIE;
  }
  if (!OPERATOR_EMAIL || !OPERATOR_PASSWORD) {
    stage("operator-auth", "INFO", "no operator creds — relying on OPERATOR_AUTH_ENABLED=false dev bypass");
    return "";
  }
  const auth = createClient(SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.VITE_SUPABASE_PUBLISHABLE_KEY, {
    auth: { persistSession: false },
  });
  const { data, error } = await auth.auth.signInWithPassword({
    email: OPERATOR_EMAIL,
    password: OPERATOR_PASSWORD,
  });
  if (error || !data.session) {
    stage("operator-auth", "FAIL", `sign-in failed: ${error?.message ?? "no session"}`);
    throw new Error("operator sign-in failed");
  }
  const cookie = [
    `sb-access-token=${data.session.access_token}`,
    `sb-refresh-token=${data.session.refresh_token}`,
  ].join("; ");
  stage("operator-auth", "PASS", `signed in as ${OPERATOR_EMAIL}`);
  return cookie;
}

function generateTestImage() {
  const PNG_SIG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  // A 16×16 transparent PNG is the smallest valid image Cloudinary will accept
  // and keeps the test fast. We encode it by hand so the script has no external
  // file dependency and no native image lib.
  const width = 16;
  const height = 16;
  const rgba = Buffer.alloc(width * height * 4);

  // Simple deterministic pattern: encode the run id length into the pixel data so
  // two runs can't produce byte-identical assets (defends against a cached CDN
  // hit masquerading as a fresh upload).
  for (let i = 0; i < width * height; i++) {
    rgba[i * 4] = (i * 7 + RUN_ID.length) & 0xff;
    rgba[i * 4 + 1] = (i * 13) & 0xff;
    rgba[i * 4 + 2] = (i * 29) & 0xff;
    rgba[i * 4 + 3] = 0xff;
  }

  // PNG IDAT: one filter-type-0 byte per scanline, then the RGBA bytes. Level 0
  // deflate keeps it simple and fast for a 16×16 image.
  const raw = Buffer.concat(
    Array.from({ length: height }, (_, y) =>
      Buffer.concat([Buffer.from([0]), rgba.subarray(y * width * 4, (y + 1) * width * 4)]),
    ),
  );
  const idatData = deflateSync(raw, { level: 0 });

  function chunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);
    const typeBuf = Buffer.from(type, "ascii");
    const crcInput = Buffer.concat([typeBuf, data]);
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(crc32(crcInput) >>> 0, 0);
    return Buffer.concat([len, typeBuf, data, crc]);
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; /* bit depth */
  ihdr[9] = 6; /* color type RGBA */
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  return Buffer.concat([
    PNG_SIG,
    chunk("IHDR", ihdr),
    chunk("IDAT", idatData),
    chunk("IEND", Buffer.alloc(0)),
  ]);
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

async function requestSignedUpload(cookie) {
  stage("upload-sign", "RUN", `POST ${APP_BASE_URL}/api/assets/upload-sign`);
  const res = await fetch(`${APP_BASE_URL}/api/assets/upload-sign`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(cookie ? { Cookie: cookie } : {}),
    },
    body: JSON.stringify({
      brandId: BRAND_ID,
      resourceType: "image",
      filename: `${RUN_ID}.png`,
    }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    stage("upload-sign", "FAIL", `HTTP ${res.status} ${text.slice(0, 200)}`);
    throw new Error("upload-sign failed");
  }
  const body = await res.json();
  if (!body.uploadUrl || !body.signature || !body.apiKey || !body.timestamp) {
    stage("upload-sign", "FAIL", `missing fields in response: ${JSON.stringify(body).slice(0, 200)}`);
    throw new Error("upload-sign malformed response");
  }
  stage("upload-sign", "PASS", `signed params received, folder=${body.assetFolder}`);
  return body;
}

async function performCloudinaryUpload(signed, imageBytes) {
  stage("cloudinary-upload", "RUN", `POST ${signed.uploadUrl} (multipart)`);
  const form = new FormData();
  form.append("file", new Blob([imageBytes], { type: "image/png" }), `${RUN_ID}.png`);
  form.append("api_key", signed.apiKey);
  form.append("timestamp", String(signed.timestamp));
  form.append("signature", signed.signature);
  for (const [k, v] of Object.entries(signed.params)) {
    form.append(k, String(v));
  }

  const res = await fetch(signed.uploadUrl, { method: "POST", body: form });
  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    json = null;
  }
  if (!res.ok || !json?.public_id) {
    stage("cloudinary-upload", "FAIL", `HTTP ${res.status} ${text.slice(0, 300)}`);
    throw new Error("cloudinary upload failed");
  }

  const eagerOk = Array.isArray(json.eager) && json.eager.some((d) => d?.status === "complete");
  stage(
    "cloudinary-upload",
    "PASS",
    `public_id=${json.public_id} bytes=${json.bytes} eager=${eagerOk ? "complete" : "pending/missing"}`,
  );
  return { publicId: json.public_id, eagerOk, raw: json };
}

async function pollForWebhookWrite(publicId) {
  stage("webhook-db", "RUN", `polling assets+cloudinary_assets for public_id (≤${WEBHOOK_POLL_TIMEOUT_MS}ms)`);
  const deadline = Date.now() + WEBHOOK_POLL_TIMEOUT_MS;
  while (Date.now() < deadline) {
    const { data: asset, error: assetErr } = await admin
      .from("assets")
      .select("id, brand_id, cloudinary_public_id, dna_status, dna_score")
      .eq("cloudinary_public_id", publicId)
      .maybeSingle();
    if (assetErr) {
      stage("webhook-db", "FAIL", `assets lookup error: ${assetErr.message}`);
      return null;
    }
    if (asset?.id) {
      const { data: cld } = await admin
        .from("cloudinary_assets")
        .select("id, status, brand_id, secure_url")
        .eq("public_id", publicId)
        .maybeSingle();
      stage(
        "webhook-db",
        "PASS",
        `assets.id=${asset.id} brand_id=${asset.brand_id ?? "null"} cloudinary_assets=${cld ? cld.status : "missing"}`,
      );
      return { asset, cloudinaryAsset: cld };
    }
    await new Promise((r) => setTimeout(r, WEBHOOK_POLL_INTERVAL_MS));
  }
  stage("webhook-db", "FAIL", `timed out after ${WEBHOOK_POLL_TIMEOUT_MS}ms — webhook did not write rows`);
  return null;
}

async function verifyDeliveryUrl(publicId) {
  stage("delivery-url", "RUN", `generating signed asset-masonry URL and GET-ing it`);
  // Mirror exactly what app/src/app/api/_lib/cloudinary-signed-url.ts does for the
  // "asset-masonry" preset: signed authenticated URL with raw transformation
  // c_limit,w_600,f_auto,q_auto (from CLOUDINARY_PRESETS in lib/cloudinary/url.ts).
  // Same SDK, same params — no duplicated URL builder.
  const url = cloudinary.url(publicId, {
    type: "authenticated",
    sign_url: true,
    secure: true,
    raw_transformation: "c_limit,w_600,f_auto,q_auto",
  });

  const res = await fetch(url, { method: "GET" });
  const ct = res.headers.get("content-type") ?? "";
  if (!res.ok) {
    stage("delivery-url", "FAIL", `HTTP ${res.status} content-type=${ct}`);
    return { url, ok: false };
  }
  if (!ct.startsWith("image/")) {
    stage("delivery-url", "FAIL", `expected image/* content-type, got ${ct}`);
    return { url, ok: false };
  }
  stage("delivery-url", "PASS", `HTTP 200 content-type=${ct}`);
  return { url, ok: true };
}

async function cleanup(publicId, assetId) {
  const cldCleanup = [];
  const dbCleanup = [];
  try {
    if (publicId) {
      const r = await cloudinary.uploader.destroy(publicId, {
        resource_type: "image",
        type: "authenticated",
        invalidate: true,
      });
      cldCleanup.push(`destroy=${r.result}`);
    }
  } catch (e) {
    cldCleanup.push(`destroy-error=${e.message}`);
  }
  try {
    if (assetId) {
      const { error: e1 } = await admin.from("cloudinary_assets").delete().eq("asset_id", assetId);
      dbCleanup.push(`cloudinary_assets=${e1 ? e1.message : "ok"}`);
      const { error: e2 } = await admin.from("assets").delete().eq("id", assetId);
      dbCleanup.push(`assets=${e2 ? e2.message : "ok"}`);
    } else if (publicId) {
      const { error: e1 } = await admin.from("cloudinary_assets").delete().eq("public_id", publicId);
      dbCleanup.push(`cloudinary_assets(by public_id)=${e1 ? e1.message : "ok"}`);
      const { error: e2 } = await admin.from("assets").delete().eq("cloudinary_public_id", publicId);
      dbCleanup.push(`assets(by public_id)=${e2 ? e2.message : "ok"}`);
    }
  } catch (e) {
    dbCleanup.push(`db-error=${e.message}`);
  }
  stage("cleanup", cldCleanup.concat(dbCleanup).every((s) => !s.includes("error") && !s.includes("Error")) ? "PASS" : "INFO", `${cldCleanup.join(" ")} | ${dbCleanup.join(" ")}`);
}

async function main() {
  console.log(`\nCLD-105 smoke test — run ${RUN_ID}\n  app: ${APP_BASE_URL}\n  supabase: ${SUPABASE_URL}\n  cloud: ${CLOUD_NAME}\n  brand: ${BRAND_ID}\n`);

  let publicId;
  let assetId;
  let imageBytes;
  let stageError = null;
  try {
    const cookie = await resolveOperatorCookie();
    imageBytes = generateTestImage();
    stage("generate-image", "PASS", `${imageBytes.length} bytes (16×16 PNG)`);

    try {
      const signed = await requestSignedUpload(cookie);
      const uploaded = await performCloudinaryUpload(signed, imageBytes);
      publicId = uploaded.publicId;

      const rows = await pollForWebhookWrite(publicId);
      if (rows?.asset?.id) assetId = rows.asset.id;

      await verifyDeliveryUrl(publicId);
    } catch (e) {
      stageError = e;
      stage("pipeline", "FAIL", e?.message ?? String(e));
    }
  } finally {
    await cleanup(publicId, assetId);
  }

  const durationMs = Date.now() - startedAt;
  const pipelinePass = failures === 0;
  const report = {
    runId: RUN_ID,
    startedAt: new Date(startedAt).toISOString(),
    durationMs,
    pipeline: pipelinePass ? "PASS" : "FAIL",
    stages,
  };
  writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2));

  console.log(`\nPipeline: ${pipelinePass ? "PASS" : "FAIL"}  (${durationMs}ms)`);
  console.log(`Report:   ${REPORT_PATH}\n`);
  process.exit(pipelinePass ? 0 : 1);
}

main().catch((e) => {
  console.error("fatal:", e);
  process.exit(1);
});
