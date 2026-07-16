#!/usr/bin/env node
/**
 * IPI-636 · CLD-WEBHOOK-001 — prove genuine Cloudinary → app notification delivery.
 *
 * Does NOT synthesize webhook POSTs. Relies on Cloudinary Admin API triggers
 * (upload + delete, additive:true) targeting the stable production webhook URL.
 *
 * Keep IPI-432 synthetic smoke (`verify-cloudinary-pipeline.mjs`) unchanged for CI.
 *
 * Required env (.env.local):
 *   CLOUDINARY_*, NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY,
 *   CLD105_BRAND_ID, CLD105_APP_BASE_URL (local sign route; default localhost:3002)
 *
 * Optional:
 *   CLD105_WEBHOOK_BASE_URL / CLD105_WEBHOOK_URL (default https://www.ipix.co/.../webhook)
 *   CLD105_OPERATOR_TOKEN | CLD105_OPERATOR_EMAIL + CLD105_OPERATOR_PASSWORD
 *     — required when the sign app enforces operator auth
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

function stripQuotes(s) {
  if (s.length >= 2 && ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'")))) {
    return s.slice(1, -1);
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
loadEnvFile(resolve(appRoot, ".env.local"));

function required(name, value) {
  if (!value) throw new Error(`Missing required env: ${name}`);
  return value;
}

function requireDep(name) {
  for (const p of [resolve(appRoot, "node_modules", name), resolve(repoRoot, "node_modules", name)]) {
    if (existsSync(p)) {
      const req = createRequire(resolve(p, "package.json"));
      return req(name);
    }
  }
  return createRequire(resolve(appRoot, "package.json"))(name);
}

function generateTestImage(runId) {
  const PNG_SIG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const width = 16;
  const height = 16;
  const rgba = Buffer.alloc(width * height * 4);
  let seed = 0x811c9dc5;
  for (let i = 0; i < runId.length; i++) {
    seed ^= runId.charCodeAt(i);
    seed = Math.imul(seed, 0x01000193) >>> 0;
  }
  for (let i = 0; i < width * height; i++) {
    seed = Math.imul(seed ^ i, 0x01000193) >>> 0;
    rgba[i * 4] = seed & 0xff;
    rgba[i * 4 + 1] = (seed >>> 8) & 0xff;
    rgba[i * 4 + 2] = (seed >>> 16) & 0xff;
    rgba[i * 4 + 3] = 255;
  }
  const raw = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (width * 4 + 1)] = 0;
    rgba.copy(raw, y * (width * 4 + 1) + 1, y * width * 4, (y + 1) * width * 4);
  }
  const compressed = deflateSync(raw);
  function chunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length);
    const typeBuf = Buffer.from(type);
    const crc = Buffer.alloc(4);
    const { createHash } = requireDep("crypto");
    // PNG CRC32
    let c = ~0;
    const table = (() => {
      const t = new Uint32Array(256);
      for (let n = 0; n < 256; n++) {
        let cv = n;
        for (let k = 0; k < 8; k++) cv = cv & 1 ? 0xedb88320 ^ (cv >>> 1) : cv >>> 1;
        t[n] = cv;
      }
      return t;
    })();
    const buf = Buffer.concat([typeBuf, data]);
    for (let i = 0; i < buf.length; i++) c = table[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
    crc.writeUInt32BE((~c) >>> 0);
    return Buffer.concat([len, typeBuf, data, crc]);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  return Buffer.concat([PNG_SIG, chunk("IHDR", ihdr), chunk("IDAT", compressed), chunk("IEND", Buffer.alloc(0))]);
}

async function sleep(ms) {
  await new Promise((r) => setTimeout(r, ms));
}

async function poll(label, fn, { timeoutMs = 90_000, intervalMs = 1500 } = {}) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const result = await fn();
    if (result) return result;
    await sleep(intervalMs);
  }
  throw new Error(`${label} timed out after ${timeoutMs}ms`);
}

function stage(name, ok, detail) {
  console.log(`${ok ? "PASS" : "FAIL"} ${name}${detail ? ` — ${detail}` : ""}`);
  if (!ok) process.exitCode = 1;
  return { name, ok, detail };
}

function writeReport(report) {
  report.finishedAt = new Date().toISOString();
  report.ok = (report.stages ?? []).length > 0 && report.stages.every((s) => s.ok);
  const out = resolve(appRoot, "scripts/.cld636-report.json");
  writeFileSync(out, JSON.stringify(report, null, 2));
  console.log(`\nReport → ${out}`);
  console.log(report.ok ? "\nIPI-636 LIVE PROOF: PASS\n" : "\nIPI-636 LIVE PROOF: FAIL\n");
  return out;
}

function normalizeWebhookPath(pathname) {
  return pathname.replace(/\/+$/, "") || "/";
}

function triggerMatchesWebhook(trigger, webhookUrl) {
  if (!trigger?.uri) return false;
  try {
    const expected = new URL(webhookUrl);
    const actual = new URL(trigger.uri);
    return (
      actual.host === expected.host &&
      normalizeWebhookPath(actual.pathname) === normalizeWebhookPath(expected.pathname)
    );
  } catch {
    return false;
  }
}

/** Refuse cleanup outside the brand-scoped ipi636-test folder (mirrors pipeline isTestPublicId). */
function isLiveTestPublicId(publicId, testFolder) {
  return typeof publicId === "string" && typeof testFolder === "string" && publicId.startsWith(`${testFolder}/`);
}

/** Sign a Cloudinary notification body the same way the webhook route verifies. */
function signNotificationBody(body, apiSecret) {
  const notifSecret = process.env.CLOUDINARY_NOTIFICATION_API_SECRET?.trim() || apiSecret;
  const timestamp = Math.floor(Date.now() / 1000);
  const signature = requireDep("crypto")
    .createHash("sha1")
    .update(body + timestamp + notifSecret)
    .digest("hex");
  return { timestamp, signature };
}

async function resolveOperatorAuth(createClient) {
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
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const auth = createClient(
    required("NEXT_PUBLIC_SUPABASE_URL", process.env.NEXT_PUBLIC_SUPABASE_URL),
    required("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", publishableKey),
    { auth: { persistSession: false } },
  );
  const { data, error } = await auth.auth.signInWithPassword({ email, password });
  if (error || !data.session) {
    throw new Error(`operator sign-in failed: ${error?.message ?? "no session"}`);
  }
  console.log(`PASS operator-auth — signed in as ${email}`);
  return `Bearer ${data.session.access_token}`;
}

async function main() {
  const runId = `ipi636-${Date.now()}-${randomUUID().slice(0, 8)}`;
  const webhookUrl =
    process.env.CLD105_WEBHOOK_URL ??
    `${(process.env.CLD105_WEBHOOK_BASE_URL ?? "https://www.ipix.co").replace(/\/$/, "")}/api/assets/cloudinary/webhook`;
  const report = {
    runId,
    startedAt: new Date().toISOString(),
    webhookUrl,
    stages: [],
    notes: [
      "No per-upload notification_url (global triggers must fire).",
      "Upload + first delete rows prove genuine Cloudinary delivery.",
      "delete-idempotent posts one signed duplicate delete after the genuine archive.",
      "Cleanup refuses public_ids outside ipix/brands/<brand>/ipi636-test/.",
      "Secrets and full signatures are not logged.",
    ],
  };

  let publicId;
  let assetId;
  let cloudinary;
  let admin;
  let testFolder;
  let apiSecret;

  try {
    const cloudName = required("CLOUDINARY_CLOUD_NAME", process.env.CLOUDINARY_CLOUD_NAME);
    const apiKey = required("CLOUDINARY_API_KEY", process.env.CLOUDINARY_API_KEY);
    apiSecret = required("CLOUDINARY_API_SECRET", process.env.CLOUDINARY_API_SECRET);
    const supabaseUrl = required("NEXT_PUBLIC_SUPABASE_URL", process.env.NEXT_PUBLIC_SUPABASE_URL);
    const serviceRoleKey = required("SUPABASE_SERVICE_ROLE_KEY", process.env.SUPABASE_SERVICE_ROLE_KEY);
    const brandId = required("CLD105_BRAND_ID", process.env.CLD105_BRAND_ID);
    const appBaseUrl = (process.env.CLD105_APP_BASE_URL ?? "http://localhost:3002").replace(/\/$/, "");
    testFolder = `ipix/brands/${brandId}/ipi636-test`;
    const folder = testFolder;
    const expectAppAuthReject = /\/api\/assets\/cloudinary\/webhook\/?$/.test(new URL(webhookUrl).pathname);

    const { v2: cloudinarySdk } = requireDep("cloudinary");
    cloudinary = cloudinarySdk;
    cloudinary.config({ cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret, secure: true });
    const { createClient } = requireDep("@supabase/supabase-js");
    admin = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });

    console.log(`\nIPI-636 live webhook proof — ${runId}`);
    console.log(`  sign app:     ${appBaseUrl}`);
    console.log(`  webhook:      ${webhookUrl}`);
    console.log(`  cloud:        ${cloudName}`);
    console.log(`  brand:        ${brandId}`);
    console.log(`  folder:       ${folder}\n`);

    // Preflight: app webhook must reject bad signatures; probe workers may ack 200.
    {
      const probe = await fetch(webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Cld-Timestamp": "1",
          "X-Cld-Signature": "deadbeef",
        },
        body: JSON.stringify({ notification_type: "upload" }),
      });
      const text = await probe.text();
      const ok = expectAppAuthReject
        ? probe.status === 401 && /Signature|signature|expired|Invalid/i.test(text)
        : probe.status >= 200 && probe.status < 500;
      report.stages.push(stage("webhook-preflight", ok, `HTTP ${probe.status}`));
      if (!ok) throw new Error("webhook preflight failed — missing Cloudinary env on target?");
    }

    // Confirm triggers target the exact webhook path (not just the host).
    {
      const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/triggers`, {
        headers: {
          Authorization: `Basic ${Buffer.from(`${apiKey}:${apiSecret}`).toString("base64")}`,
        },
      });
      const json = await res.json();
      const triggers = json.triggers ?? [];
      const upload = triggers.find((t) => t.event_type === "upload" && triggerMatchesWebhook(t, webhookUrl));
      const del = triggers.find((t) => t.event_type === "delete" && triggerMatchesWebhook(t, webhookUrl));
      const ok =
        !!upload &&
        !!del &&
        upload.additive === true &&
        del.additive === true &&
        (upload.auth_scheme === "default" || upload.auth_scheme === "legacy_hmac") &&
        (del.auth_scheme === "default" || del.auth_scheme === "legacy_hmac");
      report.triggers = {
        upload: upload
          ? {
              id: upload.id.slice(0, 12) + "…",
              additive: upload.additive,
              auth_scheme: upload.auth_scheme,
              uri_path: new URL(upload.uri).pathname,
            }
          : null,
        delete: del
          ? {
              id: del.id.slice(0, 12) + "…",
              additive: del.additive,
              auth_scheme: del.auth_scheme,
              uri_path: new URL(del.uri).pathname,
            }
          : null,
      };
      report.stages.push(
        stage(
          "triggers-configured",
          ok,
          `upload additive=${upload?.additive} auth=${upload?.auth_scheme} path=${upload ? new URL(upload.uri).pathname : "missing"}; delete additive=${del?.additive} auth=${del?.auth_scheme} path=${del ? new URL(del.uri).pathname : "missing"}`,
        ),
      );
      if (!ok) throw new Error("upload/delete additive triggers not configured for webhook path");
    }

    const authHeader = await resolveOperatorAuth(createClient);
    report.stages.push(
      stage("operator-auth", true, authHeader ? "Authorization header attached" : "dev bypass (no Authorization)"),
    );

    // Signed upload via existing route — no notificationUrl
    const imageBytes = generateTestImage(runId);
    const signRes = await fetch(`${appBaseUrl}/api/assets/upload-sign`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(authHeader ? { Authorization: authHeader } : {}),
      },
      body: JSON.stringify({
        brandId,
        resourceType: "image",
        filename: `${runId}.png`,
        folder,
        // intentionally omit notificationUrl so global triggers fire alone
      }),
    });
    if (!signRes.ok) {
      report.stages.push(stage("upload-signature", false, `HTTP ${signRes.status}`));
      throw new Error("upload-sign failed");
    }
    const signed = await signRes.json();
    if (signed.params?.notification_url) {
      report.stages.push(stage("upload-signature", false, "notification_url unexpectedly present on signed params"));
      throw new Error("notification_url must not be signed for this proof");
    }
    report.stages.push(stage("upload-signature", true, "no notification_url in signed params"));

    const form = new FormData();
    form.append("file", new Blob([imageBytes], { type: "image/png" }), `${runId}.png`);
    form.append("api_key", signed.apiKey);
    form.append("timestamp", String(signed.timestamp));
    form.append("signature", signed.signature);
    for (const [k, v] of Object.entries(signed.params)) form.append(k, String(v));
    const upRes = await fetch(signed.uploadUrl, { method: "POST", body: form });
    const upJson = await upRes.json();
    if (!upRes.ok || !upJson.public_id) {
      report.stages.push(stage("cloudinary-upload", false, `HTTP ${upRes.status}`));
      throw new Error("cloudinary upload failed");
    }
    publicId = upJson.public_id;
    report.stages.push(
      stage("cloudinary-upload", true, `public_id=${publicId} version=${upJson.version} type=${upJson.type}`),
    );

    // Wait for genuine upload webhook → Supabase rows
    const uploadRow = await poll("genuine-upload-webhook", async () => {
      const { data: asset } = await admin
        .from("assets")
        .select("id, brand_id, cloudinary_public_id")
        .eq("cloudinary_public_id", publicId)
        .maybeSingle();
      if (!asset) return null;
      const { data: ca } = await admin
        .from("cloudinary_assets")
        .select("public_id, status, version, brand_id, resource_type, delivery_type")
        .eq("public_id", publicId)
        .maybeSingle();
      if (!ca || ca.status !== "ready") return null;
      return { asset, ca };
    });
    assetId = uploadRow.asset.id;
    report.upload = {
      asset_id: assetId,
      brand_id: uploadRow.asset.brand_id,
      cloudinary_status: uploadRow.ca.status,
      version: uploadRow.ca.version,
      delivery_type: uploadRow.ca.delivery_type,
    };
    report.stages.push(
      stage(
        "genuine-upload-webhook",
        uploadRow.asset.brand_id === brandId && uploadRow.ca.status === "ready",
        `asset=${assetId} brand=${uploadRow.asset.brand_id} version=${uploadRow.ca.version}`,
      ),
    );

    const { count } = await admin
      .from("cloudinary_assets")
      .select("id", { count: "exact", head: true })
      .eq("public_id", publicId);
    report.stages.push(stage("upload-idempotent-row", count === 1, `cloudinary_assets count=${count}`));

    const destroyRes = await cloudinary.uploader.destroy(publicId, {
      resource_type: "image",
      type: "authenticated",
      invalidate: true,
    });
    report.stages.push(
      stage("cloudinary-destroy", destroyRes.result === "ok" || destroyRes.result === "not found", `result=${destroyRes.result}`),
    );

    const deleteRow = await poll("genuine-delete-webhook", async () => {
      const { data: ca } = await admin
        .from("cloudinary_assets")
        .select("public_id, status")
        .eq("public_id", publicId)
        .maybeSingle();
      if (!ca || ca.status !== "archived") return null;
      return ca;
    });
    report.delete = { public_id: publicId, status: deleteRow.status };
    report.stages.push(stage("genuine-delete-webhook", deleteRow.status === "archived", `status=${deleteRow.status}`));

    // After a genuine delete archived the row, POST a second signed delete
    // notification to prove the webhook handler is idempotent (duplicate notify).
    const deleteBody = JSON.stringify({
      notification_type: "delete",
      resources: [{ public_id: publicId }],
    });
    const { timestamp: delTs, signature: delSig } = signNotificationBody(deleteBody, apiSecret);
    const dupRes = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-cld-timestamp": String(delTs),
        "x-cld-signature": delSig,
      },
      body: deleteBody,
    });
    const { data: still } = await admin
      .from("cloudinary_assets")
      .select("status")
      .eq("public_id", publicId)
      .maybeSingle();
    report.stages.push(
      stage(
        "delete-idempotent",
        dupRes.ok && still?.status === "archived",
        `webhook=${dupRes.status} status=${still?.status}`,
      ),
    );
  } catch (e) {
    report.error = e instanceof Error ? e.message : String(e);
    console.error("FATAL", report.error);
    process.exitCode = 1;
  } finally {
    // Settle before deletes so a late/retried Cloudinary webhook cannot
    // recreate rows after cleanup (same window as verify-cloudinary-pipeline).
    await new Promise((r) => setTimeout(r, 2000));
    // Best-effort cleanup whenever publicId is known (even if assetId never arrived).
    // Refuse public_ids outside the ipi636-test folder (same safety as pipeline cleanup).
    if (publicId && cloudinary && admin) {
      if (!isLiveTestPublicId(publicId, testFolder)) {
        console.error(`REFUSED cleanup — public_id not under ${testFolder}: ${publicId}`);
        report.stages.push(
          stage("cleanup", false, `refused: public_id not under test folder`),
        );
      } else {
        try {
          await cloudinary.uploader.destroy(publicId, {
            resource_type: "image",
            type: "authenticated",
            invalidate: true,
          });
        } catch {
          /* already gone */
        }
        await admin.from("cloudinary_assets").delete().eq("public_id", publicId);
        await admin.from("assets").delete().eq("cloudinary_public_id", publicId);
        if (assetId) {
          await admin.from("assets").delete().eq("id", assetId);
        }
      }
    }
    writeReport(report);
  }

  if (!report.ok) process.exit(1);
}

main().catch((e) => {
  console.error("FATAL", e.message);
  try {
    writeReport({
      runId: `ipi636-fatal-${Date.now()}`,
      startedAt: new Date().toISOString(),
      stages: [],
      error: e.message,
      notes: ["Fatal before report context was available."],
    });
  } catch {
    /* ignore secondary write failures */
  }
  process.exit(1);
});
