import { createClient } from "@supabase/supabase-js";
import { expect, type Page } from "@playwright/test";
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

function serviceRoleClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );
}

async function assertFixtureRows(fixture: CloudinaryQaFixture): Promise<void> {
  const admin = serviceRoleClient();
  const { data: assetRow, error: assetErr } = await admin
    .from("assets")
    .select("id, brand_id, cloudinary_public_id")
    .eq("id", fixture.assetId)
    .maybeSingle();
  expect(assetErr).toBeNull();
  expect(assetRow?.id).toBe(fixture.assetId);
  expect(assetRow?.brand_id).toBe(fixture.brandId);
  expect(assetRow?.cloudinary_public_id).toBe(fixture.publicId);

  const { data: cldRow, error: cldErr } = await admin
    .from("cloudinary_assets")
    .select("public_id, status, brand_id, asset_id")
    .eq("public_id", fixture.publicId)
    .maybeSingle();
  expect(cldErr).toBeNull();
  expect(cldRow?.public_id).toBe(fixture.publicId);
  expect(cldRow?.status).toBe("ready");
  expect(cldRow?.brand_id).toBe(fixture.brandId);
  expect(cldRow?.asset_id).toBe(fixture.assetId);
}

async function assertFixtureOnAssetsPage(page: Page, fixture: CloudinaryQaFixture): Promise<void> {
  const imageOk = { seen: false };
  page.on("response", (res) => {
    const ct = res.headers()["content-type"] ?? "";
    const url = res.url();
    if (
      res.status() === 200 &&
      (ct.startsWith("image/") ||
        (url.includes("/_next/image") && ct.startsWith("image/")) ||
        (url.includes("res.cloudinary.com") && ct.startsWith("image/")))
    ) {
      imageOk.seen = true;
    }
  });

  await page.goto("/app/assets", { waitUntil: "domcontentloaded" });
  const card = page.locator(`[data-testid="asset-card"][data-asset-id="${fixture.assetId}"]`);
  await expect(card).toBeVisible({ timeout: 30_000 });
  const img = card.locator("img").first();
  await expect(img).toBeVisible({ timeout: 15_000 });
  await expect.poll(() => imageOk.seen, { timeout: 30_000 }).toBe(true);

  const src = (await img.getAttribute("src")) ?? "";
  const decoded = decodeURIComponent(src);
  expect(
    decoded.includes(fixture.publicId) || src.includes(encodeURIComponent(fixture.publicId)),
  ).toBe(true);
}

async function assertFixtureCleaned(fixture: CloudinaryQaFixture): Promise<void> {
  const summary = await fixture.cleanup();
  expect(
    summary.cloudinary === "ok" ||
      summary.cloudinary === "not found" ||
      summary.cloudinary === "skipped",
  ).toBeTruthy();
  expect(
    summary.assets === "ok" ||
      summary.assets === "ok-fallback" ||
      String(summary.assets).startsWith("ok-fallback") ||
      summary.assets === "skipped",
  ).toBeTruthy();
  const { data: gone } = await serviceRoleClient()
    .from("assets")
    .select("id")
    .eq("id", fixture.assetId)
    .maybeSingle();
  expect(gone).toBeNull();
}

/**
 * Create one disposable fixture via the existing IPI-432 verifier helpers
 * (synthetic webhook — deterministic CI). Caller must cleanup() on success.
 */
export async function createCloudinaryQaFixture(): Promise<CloudinaryQaFixture> {
  loadCloudinaryQaEnv();
  const verifierUrl = pathToFileURL(
    resolve(process.cwd(), "app/scripts/verify-cloudinary-pipeline.mjs"),
  ).href;
  const mod = await import(verifierUrl);
  const progress: {
    cleanup?: () => Promise<Record<string, string>>;
  } = {};
  try {
    const fixture = await mod.createDisposableFixture({
      skipDna: true,
      log: true,
      progress,
    });
    return {
      runId: fixture.runId,
      brandId: fixture.brandId,
      publicId: fixture.publicId,
      assetId: fixture.assetId,
      cleanup: fixture.cleanup,
    };
  } catch (err) {
    if (typeof progress.cleanup === "function") {
      await progress.cleanup().catch(() => undefined);
    }
    throw err;
  }
}

/** Full IPI-512 browser lifecycle: create → DB assert → /app/assets → cleanup. */
export async function runCloudinaryQaLifecycle(page: Page): Promise<void> {
  let fixture: CloudinaryQaFixture | undefined;
  try {
    fixture = await createCloudinaryQaFixture();
    await assertFixtureRows(fixture);
    await assertFixtureOnAssetsPage(page, fixture);
  } finally {
    if (fixture) await assertFixtureCleaned(fixture);
  }
}
