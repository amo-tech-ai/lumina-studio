import { test } from "@playwright/test";

import {
  loadCloudinaryQaEnv,
  runCloudinaryQaLifecycle,
} from "./helpers/cloudinary-qa-fixture";
import { loginOperatorIfConfigured } from "./helpers/mobile-audit";

/**
 * IPI-512 · CLD-QA-001 — Disposable Cloudinary fixture through /app/assets.
 *
 * Reuses verify-cloudinary-pipeline create + cleanup (synthetic webhook).
 * Runs the full lifecycle twice. Chromium desktop only.
 */
test.describe("IPI-512 — Cloudinary assets fixture lifecycle", () => {
  test.describe.configure({ mode: "serial" });

  test.beforeAll(() => {
    loadCloudinaryQaEnv();
  });

  for (const cycle of [1, 2] as const) {
    test(`create → /app/assets assert → cleanup (cycle ${cycle})`, async ({ page }, testInfo) => {
      test.skip(testInfo.project.name !== "chromium-desktop", "desktop-only proof");
      test.setTimeout(180_000);

      const loggedIn = await loginOperatorIfConfigured(page);
      test.skip(!loggedIn, "QA_PASSWORD required in app/.env.local");

      await runCloudinaryQaLifecycle(page);
    });
  }
});
