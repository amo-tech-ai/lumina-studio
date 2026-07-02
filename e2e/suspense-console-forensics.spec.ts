import { expect, test } from "@playwright/test";

import { loginOperatorIfConfigured } from "./helpers/mobile-audit";
import { isBenignAppNoise, isExtensionOnlyNoise } from "./helpers/console-noise";

const TARGETS = [
  "/app",
  "/app/brand",
  "/app/brand/99f47f5c-d935-4623-931c-a773c3802ad4",
] as const;

const SUSPENSE_RE =
  /cleaning up async info that was not on the parent Suspense boundary|This is a bug in React/i;

test.describe("Suspense console forensics — clean Chromium", () => {
  test.beforeEach(async ({ page }) => {
    const loggedIn = await loginOperatorIfConfigured(page);
    test.skip(!loggedIn, "QA credentials required in .env.local");
  });

  for (const path of TARGETS) {
    test(`${path} — capture console + reload`, async ({ page }) => {
      const logs: Array<{ type: string; text: string }> = [];
      const pageErrors: string[] = [];

      page.on("console", (msg) => {
        logs.push({ type: msg.type(), text: msg.text() });
      });
      page.on("pageerror", (err) => pageErrors.push(err.message));

      const res = await page.goto(path, { waitUntil: "networkidle" });
      expect(res?.status()).toBeLessThan(500);
      await page.waitForTimeout(2000);

      await page.reload({ waitUntil: "networkidle" });
      await page.waitForTimeout(2000);

      const suspenseHits = [...logs.map((l) => l.text), ...pageErrors].filter((t) =>
        SUSPENSE_RE.test(t),
      );
      const appErrors = logs
        .filter((l) => l.type === "error")
        .map((l) => l.text)
        .filter((t) => !isExtensionOnlyNoise(t) && !isBenignAppNoise(t));

      expect(suspenseHits.filter((t) => !isExtensionOnlyNoise(t))).toEqual([]);
      expect(appErrors.filter((t) => !SUSPENSE_RE.test(t))).toEqual([]);
    });
  }
});
