#!/usr/bin/env node
/**
 * IPI-606 · CF-SEC-010 — validate Infisical ↔ wrangler env pairing from env vars.
 * Used by .github/workflows/cloudflare-secrets-sync.yml (avoids inline script injection).
 */
import { assertInfisicalWranglerEnvPair } from "./cloudflare-secret-allowlist.mjs";

const infisicalEnv = process.env.INFISICAL_ENV?.trim();
const wranglerEnv = process.env.WRANGLER_ENV?.trim();

if (!infisicalEnv || !wranglerEnv) {
  console.error("Error: INFISICAL_ENV and WRANGLER_ENV must be set");
  process.exit(1);
}

assertInfisicalWranglerEnvPair(infisicalEnv, wranglerEnv);
console.log(`pairing ok: ${infisicalEnv} → ${wranglerEnv}`);
