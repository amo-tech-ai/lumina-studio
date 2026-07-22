/**
 * IPI-607 · CF-MIG-230-FLAGS — SSOT for per-agent routing env var names.
 *
 * Imported by:
 * - `agent-routing.ts` (app resolver)
 * - `cloudflare-secret-allowlist.mjs` (Worker `--var` passthrough)
 *
 * Workflow `.github/workflows/cloudflare-secrets-sync.yml` cannot import this;
 * `cloudflare-secret-allowlist.test.mjs` asserts every key appears there.
 */

/** @type {Readonly<Record<string, string>>} */
export const AGENT_ROUTING_KEYS = Object.freeze({
  "public-marketing": "AI_ROUTING_AGENT_PUBLIC_MARKETING",
  "production-planner": "AI_ROUTING_AGENT_PRODUCTION_PLANNER",
  "creative-director": "AI_ROUTING_AGENT_CREATIVE_DIRECTOR",
  "visual-identity": "AI_ROUTING_AGENT_VISUAL_IDENTITY",
  "social-discovery": "AI_ROUTING_AGENT_SOCIAL_DISCOVERY",
  "brand-intelligence": "AI_ROUTING_AGENT_BRAND_INTELLIGENCE",
  "model-match": "AI_ROUTING_AGENT_MODEL_MATCH",
  "crm-assistant": "AI_ROUTING_AGENT_CRM_ASSISTANT",
  booking: "AI_ROUTING_AGENT_BOOKING",
});

/** @type {readonly string[]} */
export const AGENT_ROUTING_ENV_KEYS = Object.freeze(
  Object.values(AGENT_ROUTING_KEYS),
);
