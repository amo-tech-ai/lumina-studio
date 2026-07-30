#!/usr/bin/env node
/**
 * Safe local probe for Cloudflare AI Gateway admin access + Authenticated
 * Gateway enforcement (ipix-prod).
 *
 * Why this exists (J22 token audit + IPI-595):
 * - `/user/tokens/verify` false-fails Account API tokens (401) while account APIs work.
 * - `TOKEN="$(npx wrangler auth token)"` often captures a multi-line banner → curl (43).
 * - Empty ACCOUNT_ID yields Cloudflare 7003 on a mangled path.
 * - Reading `authentication: true` from the admin API (first probe below) proves the
 *   *setting* exists — it does NOT prove the gateway actually rejects anonymous
 *   inference requests. The second probe below hits the real inference path
 *   (`gateway.ai.cloudflare.com`) once with no auth header and once with
 *   `cf-aig-authorization` to prove enforcement, not just configuration.
 *
 * Run (from app/):
 *   npm run verify:cloudflare-gateway
 *
 * Required env (app/.env.local or process env):
 *   CLOUDFLARE_API_TOKEN, CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_AI_GATEWAY_TOKEN
 * Optional:
 *   CLOUDFLARE_AI_GATEWAY_ID (default: ipix-prod)
 *
 * CLOUDFLARE_API_TOKEN (Account API token) manages the gateway config via
 * api.cloudflare.com. CLOUDFLARE_AI_GATEWAY_TOKEN (AI Gateway Run permission,
 * account-scoped, not per-gateway) authenticates inference calls via
 * gateway.ai.cloudflare.com — these are two different tokens with two
 * different scopes. See tasks/cloudflare/audit/j22-cloudflare-token.md (W2).
 *
 * Never prints secret values — only lengths, hashes, status codes, and
 * sanitized error classifications.
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
    const key = trimmed.slice(0, eq).trim();
    if (!key) continue;
    out[key] = stripQuotes(trimmed.slice(eq + 1).trim());
  }
  return out;
}

export function loadEnvFile(path, env = process.env) {
  if (!existsSync(path)) return;
  const parsed = parseDotenv(readFileSync(path, "utf8"));
  for (const [key, val] of Object.entries(parsed)) {
    // Preserve intentionally empty shell exports (`KEY=` → "").
    if (env[key] === undefined) env[key] = val;
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

/**
 * IPI-595: Authenticated Gateway enforcement probe (provider-native path).
 *
 * The admin probe above (`probeGatewayAdmin`) only proves the *management*
 * API can read the gateway's `authentication: true` flag — it never sends a
 * request through the gateway itself. This probes the actual inference path
 * that a real client (or an attacker) would hit.
 *
 * Cloudflare's authentication docs (verified 2026-07-24) do not commit to a
 * specific status code for a missing `cf-aig-authorization` header — only
 * that the request "fails due to missing authorization". Do not hard-code
 * 401 here; classify what actually comes back instead.
 */
export const GATEWAY_HOST = "https://gateway.ai.cloudflare.com/v1";
export const DEFAULT_INFERENCE_MODEL = "@cf/meta/llama-3.2-3b-instruct";

export function gatewayInferenceUrl(
  accountId,
  gatewayId = DEFAULT_GATEWAY_ID,
  model = DEFAULT_INFERENCE_MODEL,
) {
  const acct = assertSafeBearerToken(accountId, "CLOUDFLARE_ACCOUNT_ID");
  const gw = assertSafeBearerToken(gatewayId, "gateway id");
  return `${GATEWAY_HOST}/${encodeURIComponent(acct)}/${encodeURIComponent(gw)}/workers-ai/${model}`;
}

/** Sanitized classification only — never return the full response body. */
export function classifyGatewayAuthResponse({ status, body }) {
  const firstError = Array.isArray(body?.errors) ? body.errors[0] : null;
  return {
    status,
    ok2xx: status >= 200 && status < 300,
    errorCode: firstError?.code ?? null,
    errorMessageSnippet:
      typeof firstError?.message === "string"
        ? firstError.message.slice(0, 120)
        : null,
  };
}

async function postJson(url, { headers = {}, body, fetchImpl = fetch } = {}) {
  const res = await fetchImpl(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(body ?? {}),
  });
  let parsed = null;
  try {
    parsed = await res.json();
  } catch {
    parsed = null;
  }
  return { status: res.status, body: parsed };
}

/** No auth header at all — this is the request Authenticated Gateway must reject. */
export async function probeAnonymousGatewayRejection({
  accountId,
  gatewayId = DEFAULT_GATEWAY_ID,
  model = DEFAULT_INFERENCE_MODEL,
  fetchImpl = fetch,
}) {
  const url = gatewayInferenceUrl(accountId, gatewayId, model);
  const { status, body } = await postJson(url, {
    body: { prompt: "ping" },
    fetchImpl,
  });
  return classifyGatewayAuthResponse({ status, body });
}

/**
 * Empirically verified 2026-07-24 (Cloudflare's own docs do not document this):
 * calling Workers AI through gateway.ai.cloudflare.com needs BOTH headers —
 * the standard `Authorization: Bearer <account API token>` (this authenticates
 * the Workers AI call itself, same as any direct Workers AI REST call) AND
 * `cf-aig-authorization: Bearer <gateway-run token>` (this is the Authenticated
 * Gateway feature specifically). Sending only `cf-aig-authorization` — with no
 * `Authorization` header — returns the same 401 as a fully anonymous request;
 * that is a *stronger* proof that Authenticated Gateway itself is the thing
 * doing the rejecting, since valid Cloudflare account auth alone is not enough.
 */
export async function probeAuthenticatedGatewayAccess({
  accountId,
  gatewayId = DEFAULT_GATEWAY_ID,
  apiToken,
  gatewayToken,
  model = DEFAULT_INFERENCE_MODEL,
  fetchImpl = fetch,
}) {
  const safeApiToken = assertSafeBearerToken(apiToken, "CLOUDFLARE_API_TOKEN");
  const safeGatewayToken = assertSafeBearerToken(
    gatewayToken,
    "CLOUDFLARE_AI_GATEWAY_TOKEN",
  );
  const url = gatewayInferenceUrl(accountId, gatewayId, model);
  const { status, body } = await postJson(url, {
    headers: {
      Authorization: `Bearer ${safeApiToken}`,
      "cf-aig-authorization": `Bearer ${safeGatewayToken}`,
    },
    body: { prompt: "ping" },
    fetchImpl,
  });
  return classifyGatewayAuthResponse({ status, body });
}

/**
 * Isolates the Authenticated Gateway toggle from baseline Cloudflare auth:
 * valid account token (so the Workers AI call itself is authorized) but no
 * `cf-aig-authorization`. If Authenticated Gateway is enforcing anything,
 * THIS is the request it must reject — a fully anonymous request conflates
 * "no gateway auth" with "no Cloudflare account auth at all."
 */
export async function probeAccountAuthWithoutGatewayAuth({
  accountId,
  gatewayId = DEFAULT_GATEWAY_ID,
  apiToken,
  model = DEFAULT_INFERENCE_MODEL,
  fetchImpl = fetch,
}) {
  const safeApiToken = assertSafeBearerToken(apiToken, "CLOUDFLARE_API_TOKEN");
  const url = gatewayInferenceUrl(accountId, gatewayId, model);
  const { status, body } = await postJson(url, {
    headers: { Authorization: `Bearer ${safeApiToken}` },
    body: { prompt: "ping" },
    fetchImpl,
  });
  return classifyGatewayAuthResponse({ status, body });
}

/**
 * Require non-2xx anonymous AND non-2xx account-auth-without-gateway-auth
 * AND 2xx fully authenticated — never assert one exact status code.
 * `accountAuthRejected` is the stronger signal (isolates the gateway toggle
 * from baseline Cloudflare auth); `anonymousRejected` is the literal AC text.
 */
export function interpretAuthEnforcement({
  anonymous,
  accountAuthOnly,
  authenticated,
}) {
  const anonymousRejected = !anonymous.ok2xx;
  const accountAuthRejected = !accountAuthOnly.ok2xx;
  const authenticatedAccepted = authenticated.ok2xx;
  const ok = anonymousRejected && accountAuthRejected && authenticatedAccepted;
  let note;
  if (!anonymousRejected) {
    note =
      "Anonymous request was NOT rejected — Authenticated Gateway may be disabled or misconfigured.";
  } else if (!accountAuthRejected) {
    note =
      "A request with valid Cloudflare account auth but no cf-aig-authorization succeeded — " +
      "Authenticated Gateway is not actually enforcing the gateway-specific token.";
  } else if (!authenticatedAccepted) {
    note =
      "Both anonymous and account-auth-only requests were correctly rejected, but the fully " +
      "authenticated request also failed — check CLOUDFLARE_AI_GATEWAY_TOKEN scope or model name.";
  } else {
    note =
      "Authenticated Gateway is enforced: anonymous and account-auth-only requests rejected, " +
      "fully authenticated request (Authorization + cf-aig-authorization) succeeded.";
  }
  return { ok, anonymousRejected, accountAuthRejected, authenticatedAccepted, note };
}

async function main() {
  loadEnvFile(resolve(appRoot, ".env.local"));

  let apiToken;
  let accountId;
  const gatewayId = process.env.CLOUDFLARE_AI_GATEWAY_ID || DEFAULT_GATEWAY_ID;

  try {
    // Use trimmed returns for probes + sha12 (not the raw env strings).
    apiToken = assertSafeBearerToken(
      process.env.CLOUDFLARE_API_TOKEN,
      "CLOUDFLARE_API_TOKEN",
    );
    accountId = assertSafeBearerToken(
      process.env.CLOUDFLARE_ACCOUNT_ID,
      "CLOUDFLARE_ACCOUNT_ID",
    );
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

  // IPI-595: prove the gateway itself rejects anonymous inference requests —
  // the admin probe above only proves the management API can read the flag.
  const gatewayToken = process.env.CLOUDFLARE_AI_GATEWAY_TOKEN;
  if (!gatewayToken) {
    console.error(
      "❌ CLOUDFLARE_AI_GATEWAY_TOKEN is missing — cannot prove the authenticated leg. " +
        "This is a separate token from CLOUDFLARE_API_TOKEN (see tasks/cloudflare/audit/j22-cloudflare-token.md, finding W2).",
    );
    process.exit(1);
  }

  let safeGatewayToken;
  try {
    safeGatewayToken = assertSafeBearerToken(
      gatewayToken,
      "CLOUDFLARE_AI_GATEWAY_TOKEN",
    );
  } catch (err) {
    console.error(`❌ ${err.message}`);
    process.exit(1);
  }

  console.log("\nAuthenticated Gateway enforcement probe (inference path)");
  console.log(
    JSON.stringify(
      {
        gateway_token_len: safeGatewayToken.length,
        gateway_token_sha12: sha12(safeGatewayToken),
        model: DEFAULT_INFERENCE_MODEL,
      },
      null,
      2,
    ),
  );

  const [anonymous, accountAuthOnly, authenticated] = await Promise.all([
    probeAnonymousGatewayRejection({ accountId, gatewayId }),
    probeAccountAuthWithoutGatewayAuth({ accountId, gatewayId, apiToken }),
    probeAuthenticatedGatewayAccess({
      accountId,
      gatewayId,
      apiToken,
      gatewayToken: safeGatewayToken,
    }),
  ]);

  const enforcement = interpretAuthEnforcement({
    anonymous,
    accountAuthOnly,
    authenticated,
  });

  console.log(
    JSON.stringify(
      {
        anonymous_request: anonymous,
        account_auth_without_gateway_auth: accountAuthOnly,
        fully_authenticated_request: authenticated,
        interpretation: enforcement,
      },
      null,
      2,
    ),
  );

  if (!enforcement.ok) {
    console.error("❌ Authenticated Gateway enforcement probe failed");
    process.exit(1);
  }
  console.log(`✅ ${enforcement.note}`);
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
