import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

import { loadEnvLocal } from "./qa-credentials";

export type CloudinaryQaFixture = {
  runId: string;
  brandId: string;
  publicId: string;
  assetId: string;
  cleanup: () => Promise<Record<string, string>>;
};

/** Load app/.env.local then repo .env.local without overwriting explicit env. */
export function loadCloudinaryQaEnv(): void {
  loadEnvLocal(resolve(process.cwd(), "app/.env.local"));
  loadEnvLocal(resolve(process.cwd(), ".env.local"));
  if (!process.env.CLD105_BRAND_ID) {
    process.env.CLD105_BRAND_ID = "db1f728d-bee1-430e-a3e7-0c601da74ce7";
  }
  if (!process.env.CLD105_APP_BASE_URL) {
    process.env.CLD105_APP_BASE_URL = "http://localhost:3002";
  }
}

/**
 * Create one disposable fixture via the existing IPI-432 verifier helpers
 * (synthetic webhook — deterministic CI). Caller must cleanup().
 */
export async function createCloudinaryQaFixture(): Promise<CloudinaryQaFixture> {
  loadCloudinaryQaEnv();
  const verifierUrl = pathToFileURL(
    resolve(process.cwd(), "app/scripts/verify-cloudinary-pipeline.mjs"),
  ).href;
  const mod = await import(verifierUrl);
  const fixture = await mod.createDisposableFixture({ skipDna: true, log: true });
  return {
    runId: fixture.runId,
    brandId: fixture.brandId,
    publicId: fixture.publicId,
    assetId: fixture.assetId,
    cleanup: fixture.cleanup,
  };
}
