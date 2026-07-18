import { expect, test } from "@playwright/test";
import { resolve } from "node:path";

import { loginOperatorIfConfigured } from "./helpers/mobile-audit";
import { loadEnvLocal } from "./helpers/qa-credentials";

const TEST_ASSET_ID = "abcdef0123456789abcdef0123456789";

function simulateUpload(page: import("@playwright/test").Page, assetId = TEST_ASSET_ID) {
  return page.evaluate((id) => {
    window.dispatchEvent(new CustomEvent("ipi433-e2e-simulate", { detail: { assetId: id } }));
  }, assetId);
}

async function waitForUploadPanel(page: import("@playwright/test").Page) {
  await page.getByRole("region", { name: "Upload assets" }).waitFor({ timeout: 20_000 });
}

/**
 * IPI-433 · CLD-101 — Upload workspace queue states (mocked Cloudinary + status poll).
 *
 * Uses `ipi433-e2e-simulate` CustomEvent (dev-only listener) instead of the real
 * Upload Widget so CI stays deterministic. Real Cloudinary proof: see
 * app/docs/cloudinary/IPI-433-real-upload-verification.md and
 * `npm run verify:cloudinary-webhook-live`.
 */
test.describe("IPI-433 — Upload workspace queue", () => {
  test.describe.configure({ mode: "serial", timeout: 90_000 });

  test.beforeAll(() => {
    loadEnvLocal(resolve(process.cwd(), "app/.env.local"));
  });

  test.beforeEach(async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium-desktop", "desktop-only queue proof");

    const loggedIn = await loginOperatorIfConfigured(page);
    test.skip(!loggedIn, "QA_PASSWORD required in app/.env.local");

    await page.goto("/app/assets");
    await page.evaluate(() => sessionStorage.removeItem("ipix-asset-upload-queue-v1"));
    await page.reload();
    await page.waitForLoadState("domcontentloaded");
    await page.getByRole("button", { name: "Upload", exact: true }).waitFor({ timeout: 20_000 });
  });

  test("happy path: upload → processing → ready", async ({ page }) => {
    let pollCount = 0;
    await page.route("**/api/assets/status**", async (route) => {
      pollCount += 1;
      const body =
        pollCount < 2
          ? {
              status: "not_found",
              cloudinary_asset_id: TEST_ASSET_ID,
              version: null,
              public_id: null,
            }
          : {
              status: "ready",
              cloudinary_asset_id: TEST_ASSET_ID,
              version: 1,
              public_id: "ipix/e2e/fixture",
            };
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(body) });
    });

    await waitForUploadPanel(page);
    await simulateUpload(page);

    const queue = page.getByTestId("upload-queue");
    await expect(queue.getByText(/processing/i)).toBeVisible({ timeout: 10_000 });
    await expect(queue.getByText(/ready in asset library/i)).toBeVisible({ timeout: 15_000 });
    expect(pollCount).toBeGreaterThanOrEqual(2);
  });

  test("cancel stops polling and marks cancelled", async ({ page }) => {
    let pollCount = 0;
    await page.route("**/api/assets/status**", async (route) => {
      pollCount += 1;
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          status: "not_found",
          cloudinary_asset_id: TEST_ASSET_ID,
          version: null,
          public_id: null,
        }),
      });
    });

    await waitForUploadPanel(page);
    await simulateUpload(page);

    await expect(page.getByTestId("upload-queue").getByText(/processing/i)).toBeVisible({ timeout: 10_000 });
    const pollsBeforeCancel = pollCount;

    await page.getByTestId("upload-cancel").click();
    await expect(page.getByText("Upload cancelled")).toBeVisible();

    await page.waitForTimeout(600);
    expect(pollCount).toBe(pollsBeforeCancel);
  });

  test("timeout does not mark asset as failed", async ({ page }) => {
    await page.route("**/api/assets/status**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          status: "not_found",
          cloudinary_asset_id: TEST_ASSET_ID,
          version: null,
          public_id: null,
        }),
      });
    });

    await waitForUploadPanel(page);
    await simulateUpload(page);

    const queue = page.getByTestId("upload-queue");
    await expect(queue.getByText(/taking longer than expected/i)).toBeVisible({ timeout: 10_000 });
    await expect(queue.getByText(/processing failed/i)).not.toBeVisible();
  });

  test("retry prompts fresh signature via Upload again", async ({ page }) => {
    await page.route("**/api/assets/status**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          status: "failed",
          cloudinary_asset_id: TEST_ASSET_ID,
          version: null,
          public_id: "ipix/e2e/fixture",
        }),
      });
    });

    await waitForUploadPanel(page);
    await simulateUpload(page);

    await expect(page.getByText(/processing failed — retry or check asset library/i)).toBeVisible({
      timeout: 15_000,
    });

    await page.getByTestId("upload-retry").click();
    await expect(page.getByText(/select upload again to retry with a new signature/i)).toBeVisible();
  });

  test("no Cloudinary API secret in page source", async ({ page }) => {
    const html = await page.content();
    expect(html).not.toMatch(/CLOUDINARY_API_SECRET/i);
    expect(html).not.toMatch(/api_secret/i);
  });
});

declare global {
  interface WindowEventMap {
    "ipi433-e2e-simulate": CustomEvent<{ assetId?: string }>;
  }
}
