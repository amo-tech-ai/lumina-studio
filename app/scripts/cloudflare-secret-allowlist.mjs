/**
 * IPI-606 · CF-SEC-010 — secret name allowlists for Infisical → Cloudflare routing.
 * Names only — never import or log secret values in this module.
 */

/** @typedef {"build" | "runtime"} SecretSurface */

/** Build-time / CI export — NEXT_PUBLIC_* only (inlined by Next.js / OpenNext). */
export const BUILD_TIME_SECRET_NAMES = Object.freeze([
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME",
  "NEXT_PUBLIC_CLOUDINARY_API_KEY",
  "NEXT_PUBLIC_MARKETING_CHAT_ENABLED",
  "NEXT_PUBLIC_E2E_UPLOAD_POLL_MAX_MS",
]);

/**
 * Non-secret Worker config — plain text at runtime (`process.env`).
 * Committed defaults live in `wrangler.jsonc` (`MASTRA_STORAGE_MODE`, etc.).
 * Environment-specific values (URLs, public ids) are injected at deploy via
 * GitHub environment **variables** → upload script `--var` passthrough — not Dashboard edits.
 */
export const WRANGLER_VAR_NAMES = Object.freeze([
  "INTELLIGENCE_API_URL",
  "INTELLIGENCE_GATEWAY_WS_URL",
  "AI_GATEWAY_URL",
  "CLOUDINARY_CLOUD_NAME",
  "CLOUDINARY_API_KEY",
  // IPI-586 — optional; set GitHub env var to "true" for preview smoke only.
  "ENABLE_CF_AI_SMOKE",
  // IPI-607 · CF-MIG-230-FLAGS — per-agent native|legacy (plain vars, not secrets).
  // Unset → legacy in resolveAgentRoutingOutcome. Do not require on bootstrap.
  "AI_ROUTING_AGENT_PUBLIC_MARKETING",
  "AI_ROUTING_AGENT_PRODUCTION_PLANNER",
  "AI_ROUTING_AGENT_CREATIVE_DIRECTOR",
  "AI_ROUTING_AGENT_VISUAL_IDENTITY",
  "AI_ROUTING_AGENT_SOCIAL_DISCOVERY",
  "AI_ROUTING_AGENT_BRAND_INTELLIGENCE",
  "AI_ROUTING_AGENT_MODEL_MATCH",
  "AI_ROUTING_AGENT_CRM_ASSISTANT",
  "AI_ROUTING_AGENT_BOOKING",
]);

/** Required on live bootstrap upload — CopilotKit Intelligence and smoke routes. */
export const WRANGLER_REQUIRED_VAR_NAMES = Object.freeze([
  "INTELLIGENCE_API_URL",
  "INTELLIGENCE_GATEWAY_WS_URL",
]);

/**
 * Worker runtime secrets synced via `wrangler secret put` / `secret bulk` / `--secrets-file`.
 * Same names in preview and production; values differ per Infisical environment.
 */
export const RUNTIME_SECRET_NAMES = Object.freeze([
  "GEMINI_API_KEY",
  "GROQ_API_KEY",
  "OPENAI_API_KEY",
  "DATABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
  "CLOUDINARY_API_SECRET",
  "CLOUDINARY_NOTIFICATION_API_SECRET",
  "COPILOTKIT_LICENSE_TOKEN",
  "INTELLIGENCE_API_KEY",
  "FIRECRAWL_API_KEY",
  "AI_GATEWAY_API_KEY",
  "INTERNAL_WEBHOOK_SECRET",
  "CAPTURE_LEAD_PROXY_SECRET",
]);

/**
 * CI-only / other deployment surfaces — NOT synced to Worker runtime secrets.
 *
 * - FIRECRAWL_WEBHOOK_SECRET — Supabase edge function only (Infisical `/ipix/edge`)
 * - SENTRY_AUTH_TOKEN — build-time source map upload (Sentry webpack plugin)
 * - CLOUDFLARE_API_TOKEN, CLOUDFLARE_ACCOUNT_ID — GitHub Actions deploy credentials
 * - INFISICAL_CLIENT_ID, INFISICAL_CLIENT_SECRET — bootstrap Universal Auth (rotate after OIDC)
 * - NEXT_PUBLIC_* — OpenNext build inputs from GitHub environment **variables**
 *   (preferred) with secrets fallback in cloudflare-secrets-sync.yml — never Worker secrets
 */
export const CI_ONLY_SECRET_NAMES = Object.freeze([
  "FIRECRAWL_WEBHOOK_SECRET",
  "SENTRY_AUTH_TOKEN",
  "CLOUDFLARE_API_TOKEN",
  "CLOUDFLARE_ACCOUNT_ID",
  "INFISICAL_CLIENT_ID",
  "INFISICAL_CLIENT_SECRET",
]);

/** Per wrangler env — extend when preview/production diverge on secret *names*. */
export const RUNTIME_SECRET_NAMES_BY_WRANGLER_ENV = Object.freeze({
  preview: RUNTIME_SECRET_NAMES,
  production: RUNTIME_SECRET_NAMES,
});

/** Infisical env slug → wrangler `--env` target. */
export const INFISICAL_TO_WRANGLER_ENV = Object.freeze({
  dev: "preview",
  staging: "preview",
  prod: "production",
});

/**
 * Must be present before a non-dry-run sync/upload.
 * Matches `secrets.required` in wrangler.jsonc — fail closed for truly required only.
 * COPILOTKIT_LICENSE_TOKEN stays in RUNTIME_SECRET_NAMES (optional): CopilotKit route
 * warns and runs without thread persistence when absent (SSE mode).
 */
export const RUNTIME_REQUIRED_SECRET_NAMES = Object.freeze([
  "GEMINI_API_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
]);

/** Allowlisted but optional — warn when absent; omit from upload JSON. */
export const RUNTIME_OPTIONAL_SECRET_NAMES = Object.freeze(
  RUNTIME_SECRET_NAMES.filter((n) => !RUNTIME_REQUIRED_SECRET_NAMES.includes(n)),
);

const FORBIDDEN_IN_RUNTIME_PREFIX = "NEXT_PUBLIC_";
const FORBIDDEN_IN_BUILD_SUBSTRINGS = ["SERVICE_ROLE", "API_SECRET", "_SECRET"];

/**
 * @param {string[]} names
 * @param {SecretSurface} surface
 */
export function assertNoForbiddenSecrets(names, surface) {
  const violations = [];

  for (const name of names) {
    if (surface === "runtime") {
      if (name.startsWith(FORBIDDEN_IN_RUNTIME_PREFIX)) {
        violations.push(`${name}: NEXT_PUBLIC_* must not sync to wrangler runtime secrets`);
      }
      if (WRANGLER_VAR_NAMES.includes(name)) {
        violations.push(`${name}: use wrangler.jsonc vars, not runtime secrets`);
      }
    }
    if (surface === "build") {
      if (!name.startsWith("NEXT_PUBLIC_")) {
        violations.push(`${name}: build-time export must be NEXT_PUBLIC_* only`);
      }
      for (const sub of FORBIDDEN_IN_BUILD_SUBSTRINGS) {
        if (name.includes(sub)) {
          violations.push(`${name}: build-time export must not include ${sub}`);
        }
      }
    }
  }

  if (violations.length > 0) {
    throw new Error(`Forbidden secret names for ${surface} surface:\n${violations.map((v) => `  - ${v}`).join("\n")}`);
  }
}

/**
 * @param {string} wranglerEnv
 * @returns {readonly string[]}
 */
export function runtimeSecretNamesForWranglerEnv(wranglerEnv) {
  const names = RUNTIME_SECRET_NAMES_BY_WRANGLER_ENV[wranglerEnv];
  if (!names) {
    throw new Error(
      `Unknown wrangler env "${wranglerEnv}". Expected: ${Object.keys(RUNTIME_SECRET_NAMES_BY_WRANGLER_ENV).join(", ")}`,
    );
  }
  return names;
}

/**
 * Collect runtime secret values from process.env for allowlisted names only.
 * @param {NodeJS.ProcessEnv} env
 * @param {string} wranglerEnv
 * @returns {{ present: Record<string, string>; missing: string[] }}
 */
export function collectRuntimeSecretsFromEnv(env, wranglerEnv) {
  const allowlist = runtimeSecretNamesForWranglerEnv(wranglerEnv);
  assertNoForbiddenSecrets(allowlist, "runtime");

  /** @type {Record<string, string>} */
  const present = {};
  /** @type {string[]} */
  const missing = [];

  for (const name of allowlist) {
    const value = env[name]?.trim();
    if (value) {
      present[name] = value;
    } else {
      missing.push(name);
    }
  }

  return { present, missing };
}

/**
 * Collect wrangler `--var` values from process.env for allowlisted names only.
 * @param {NodeJS.ProcessEnv} env
 * @returns {{ present: Record<string, string>; missing: string[] }}
 */
export function collectWranglerVarsFromEnv(env) {
  /** @type {Record<string, string>} */
  const present = {};
  /** @type {string[]} */
  const missing = [];

  for (const name of WRANGLER_VAR_NAMES) {
    const value = env[name]?.trim();
    if (value) {
      present[name] = value;
    } else {
      missing.push(name);
    }
  }

  return { present, missing };
}

/**
 * Build wrangler CLI `--var KEY:VALUE` args (placed after OpenNext `--` passthrough).
 * @param {Record<string, string>} vars
 * @returns {string[]}
 */
export function buildWranglerVarCliArgs(vars) {
  return Object.keys(vars)
    .sort()
    .flatMap((name) => ["--var", `${name}:${vars[name]}`]);
}

/**
 * Reject Infisical env / wrangler env mismatches (e.g. dev secrets → production Worker).
 * @param {string} infisicalEnv
 * @param {string} wranglerEnv
 */
export function assertInfisicalWranglerEnvPair(infisicalEnv, wranglerEnv) {
  const expected = INFISICAL_TO_WRANGLER_ENV[infisicalEnv];
  if (!expected) {
    throw new Error(
      `Unknown Infisical env "${infisicalEnv}". Expected: ${Object.keys(INFISICAL_TO_WRANGLER_ENV).join(", ")}`,
    );
  }
  if (expected !== wranglerEnv) {
    throw new Error(
      `Infisical env "${infisicalEnv}" maps to wrangler "${expected}", not "${wranglerEnv}". ` +
        "Fix dispatch inputs before syncing.",
    );
  }
}

/**
 * Wrangler CLI `--env` args for sync/upload.
 * Production deploy uses the top-level Worker (`ipix-operator`) — `--env=""` when named envs exist.
 * Preview uses `env.preview` in wrangler.jsonc.
 * @param {string} wranglerEnv
 * @returns {string[]}
 */
export function wranglerCliEnvArgs(wranglerEnv) {
  runtimeSecretNamesForWranglerEnv(wranglerEnv);
  if (wranglerEnv === "production") {
    return ["--env", ""];
  }
  if (wranglerEnv === "preview") {
    return ["--env", "preview"];
  }
  throw new Error(`Unknown wrangler env "${wranglerEnv}"`);
}

/**
 * Compare wrangler secret list output (names only) against allowlist.
 * @param {string[]} deployedNames — from `wrangler secret list`
 * @param {string} wranglerEnv
 * @returns {{ extra: string[]; missing: string[] }}
 */
export function diffSecretNames(deployedNames, wranglerEnv) {
  const allowlist = new Set(runtimeSecretNamesForWranglerEnv(wranglerEnv));
  const deployed = new Set(deployedNames);

  const extra = [...deployed].filter((n) => !allowlist.has(n)).sort();
  const missing = [...allowlist].filter((n) => !deployed.has(n)).sort();

  return { extra, missing };
}
