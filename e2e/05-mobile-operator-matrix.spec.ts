import { expect, test } from "@playwright/test";
import {
  OPERATOR_ROUTES,
  assertNoHorizontalOverflow,
  loginOperatorIfConfigured,
} from "./helpers/mobile-audit";

/**
 * IPI-264 — React mobile verification matrix (overflow + load gate).
 * Requires dev server on :3002. Set QA_PASSWORD for authenticated operator routes.
 */
test.describe("IPI-264 — operator mobile matrix", () => {
  test.beforeEach(async ({ page }) => {
    await loginOperatorIfConfigured(page);
  });

  for (const route of OPERATOR_ROUTES) {
    test(`${route} — no horizontal overflow`, async ({ page }) => {
      const res = await page.goto(route, { waitUntil: "networkidle" });
      expect(res?.status()).toBeLessThan(500);
      await expect(page.locator("body")).not.toContainText("Internal Server Error");
      await expect(page.locator("body")).not.toContainText("Application error");

      const ok = await assertNoHorizontalOverflow(page);
      expect(ok, `horizontal overflow on ${route}`).toBe(true);
    });
  }

  test("/login — mobile overflow gate (unauthenticated baseline)", async ({ page }) => {
    await page.goto("/login", { waitUntil: "networkidle" });
    expect(await assertNoHorizontalOverflow(page)).toBe(true);
  });
});
