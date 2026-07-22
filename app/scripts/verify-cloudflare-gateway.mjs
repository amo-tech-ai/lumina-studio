#!/usr/bin/env node
/**
 * Safe local probe for Cloudflare AI Gateway admin access (ipix-prod).
 *
 * Why this exists (J22 token audit):
 * - `/user/tokens/verify` false-fails Account API tokens (401) while account APIs work.
 * - `TOKEN="$(npx wrangler auth token)"` often captures a multi-line banner → curl (43).
 * - Empty ACCOUNT_ID yields Cloudflare 7003 on a mangled path.
 *
 * Run (from app/):
 *   npm run verify:cloudflare-gateway
 *
 * Required env (app/.env.local or process env):
 *   CLOUDFLARE_API_TOKEN, CLOUDFLARE_ACCOUNT_ID
 * Optional:
 *   CLOUDFLARE_AI_GATEWAY_ID (default: ipix-prod)
 *
 * Never prints secret values — only lengths, success flags, and gateway metadata.
 */
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const appRoot = resolve(__dirname, "..");

export const DEFAULT_GATEWAY_ID = "ipix-prod";
export const CF_API = "https://api.cloudflare.com/client/v4";

export function stripQuotes(s) {
  if (s.length >= 2) {
    if (
      (s.startsWith('"') && s.endsWith('"')) ||
      (s.startsWith("'") && s.endsWith("'"))
    ) {
      return s.slice(1, -1);
    }
  }
  return s;
}

/** Parse dotenv text into a flat key→value map (no expansion). */
export function parseDotenv(text) {
  const out = {};
  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq);
    out[key] = stripQuotes(trimmed.slice(eq + 1));
  }
  return out;
}

export function loadEnvFile(path, env = process.env) {
  if (!existsSync(path)) return;
  const parsed = parseDotenv(readFileSync(path, "utf8"));
  for (const [key, val] of Object.entries(parsed)) {
    if (!env[key]) env[key] = val;
  }
}

export function sha12(value) {
  return createHash("sha256").update(value, "utf8").digest("hex").slice(0, 12);
}

/**
 * Reject empty / newline-contaminated tokens before building Authorization.
 * Newlines → curl (43) "Failed sending HTTP request".
 */
export function assertSafeBearerToken(token, label = "token") {
  if (typeof token !== "string" || !token.trim()) {
    throw new Error(`${label} is missing`);
  }
  if (token.includes("\n") || token.includes("\r")) {
    throw new Error(
      `${label} contains a newline — refuse to send (curl would fail with error 43). ` +
        `Do not capture Wrangler banner output; use .env.local or wrangler auth token --json | jq -r .token`,
    );
  }
  return token.trim();
}

export function gatewayUrl(accountId, gatewayId = DEFAULT_GATEWAY_ID) {
  const acct = assertSafeBearerToken(accountId, "CLOUDFLARE_ACCOUNT_ID");
  const gw = assertSafeBearerToken(gatewayId, "gateway id");
  return `${CF_API}/accounts/${encodeURIComponent(acct)}/ai-gateway/gateways/${encodeURIComponent(gw)}`;
}

/** Classify /user/tokens/verify vs account API — Account tokens often 401 verify. */
export function interpretTokenHealth({ verifyStatus, gatewayOk }) {
  if (gatewayOk) {
    return {
      ok: true,
      kind: verifyStatus === 200 ? "user_token_ok" : "account_token_likely",
      note:
        verifyStatus === 200
          ? "User token verify passed and gateway admin works."
          : "Gateway admin works. Ignore /user/tokens/verify failures for Account API tokens.",
    };
  }
  return {
    ok: false,
    kind: "gateway_admin_failed",
    note: "Cannot read AI Gateway with this token — check permissions or ACCOUNT_ID.",
  };
}

export async function fetchJson(url, { token, fetchImpl = fetch } = {}) {
  const safe = assertSafeBearerToken(token, "Authorization token");
  const res = await fetchImpl(url, {
    headers: {
      Authorization: `Bearer ${safe}`,
      "Content-Type": "application/json",
    },
  });
  let body = null;
  try {
    body = await res.json();
  } catch {
    body = null;
  }
  return { status: res.status, body };
}

export async function probeGatewayAdmin({
  accountId,
  apiToken,
  gatewayId = DEFAULT_GATEWAY_ID,
  fetchImpl = fetch,
}) {
  const url = gatewayUrl(accountId, gatewayId);
  const { status, body } = await fetchJson(url, { token: apiToken, fetchImpl });
  const success = Boolean(body?.success) && status === 200;
  const result = body?.result ?? null;
  return {
    status,
    success,
    gatewayId: result?.id ?? null,
    authentication: result?.authentication ?? null,
    errors: body?.errors ?? null,
  };
}

export async function probeUserTokenVerify({ apiToken, fetchImpl = fetch }) {
  const { status, body } = await fetchJson(`${CF_API}/user/tokens/verify`, {
    token: apiToken,
    fetchImpl,
  });
  return {
    status,
    success: Boolean(body?.success) && status === 200,
    tokenStatus: body?.result?.status ?? null,
  };
}

async function main() {
  loadEnvFile(resolve(appRoot, ".env.local"));

  const apiToken = process.env.CLOUDFLARE_API_TOKEN;
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const gatewayId = process.env.CLOUDFLARE_AI_GATEWAY_ID || DEFAULT_GATEWAY_ID;

  try {
    assertSafeBearerToken(apiToken, "CLOUDFLARE_API_TOKEN");
    assertSafeBearerToken(accountId, "CLOUDFLARE_ACCOUNT_ID");
  } catch (err) {
    console.error(`❌ ${err.message}`);
    process.exit(1);
  }

  console.log("Cloudflare AI Gateway admin probe");
  console.log(
    JSON.stringify(
      {
        account_id_len: accountId.length,
        account_id_sha12: sha12(accountId),
        api_token_len: apiToken.length,
        api_token_sha12: sha12(apiToken),
        gateway_id: gatewayId,
      },
      null,
      2,
    ),
  );

  const [gateway, verify] = await Promise.all([
    probeGatewayAdmin({ accountId, apiToken, gatewayId }),
    probeUserTokenVerify({ apiToken }),
  ]);

  const health = interpretTokenHealth({
    verifyStatus: verify.status,
    gatewayOk: gateway.success,
  });

  console.log(
    JSON.stringify(
      {
        gateway_admin: {
          http_status: gateway.status,
          success: gateway.success,
          id: gateway.gatewayId,
          authentication: gateway.authentication,
          errors: gateway.errors,
        },
        user_tokens_verify: {
          http_status: verify.status,
          success: verify.success,
          token_status: verify.tokenStatus,
          note: "Do not treat 401 here as revoked for Account API tokens.",
        },
        interpretation: health,
      },
      null,
      2,
    ),
  );

  if (!health.ok) {
    console.error("❌ Gateway admin probe failed");
    process.exit(1);
  }
  console.log(`✅ ${health.note}`);
}

const isMain =
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isMain) {
  main().catch((err) => {
    console.error(`❌ ${err?.message || err}`);
    process.exit(1);
  });
}
