import { expect, test } from "@playwright/test";
import {
  CRM_MOBILE_ROUTES,
  CRM_MOBILE_VIEWPORTS,
  assertNoHorizontalOverflow,
  loginOperatorIfConfigured,
} from "./helpers/mobile-audit";

/**
 * IPI-572 · CRM-UX-008 — SCR-26–31 mobile matrix (320 + 390).
 * Screenshots: only-on-failure (playwright.config). Traces: on-first-retry.
 * Requires QA_PASSWORD for authenticated CRM routes.
 */
test.describe("IPI-572 — CRM mobile matrix (SCR-26–31)", () => {
  test.beforeEach(async ({ page }) => {
    const ok = await loginOperatorIfConfigured(page);
    test.skip(!ok, "QA_PASSWORD not set — skip authenticated CRM mobile matrix");
  });

  for (const vp of CRM_MOBILE_VIEWPORTS) {
    for (const route of CRM_MOBILE_ROUTES) {
      test(`${route} @ ${vp.name}px — no overflow + CRM tab bar`, async ({ page }) => {
        await page.setViewportSize({ width: vp.width, height: vp.height });
        const res = await page.goto(route, { waitUntil: "networkidle" });
        expect(res?.status()).toBeLessThan(500);
        await expect(page.locator("body")).not.toContainText("Internal Server Error");
        await expect(page.locator("body")).not.toContainText("Application error");

        await expect(page.getByTestId("crm-mobile-tab-bar")).toBeVisible();
        expect(await assertNoHorizontalOverflow(page), `horizontal overflow on ${route} @ ${vp.name}`).toBe(
          true,
        );
      });
    }

    test(`/app/crm/pipeline @ ${vp.name}px — native accordion`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto("/app/crm/pipeline", { waitUntil: "networkidle" });

      const stages = page.locator('details[name="crm-pipeline"]');
      await expect(stages.first()).toBeVisible();
      const count = await stages.count();
      expect(count).toBeGreaterThan(0);
      test.skip(count < 2, "need ≥2 stages for exclusive-open check");

      const first = stages.nth(0);
      const second = stages.nth(1);
      await first.locator("summary").click();
      await second.locator("summary").click();
      await expect(second).toHaveAttribute("open", "");
      const openCount = await stages.evaluateAll((els) =>
        els.filter((el) => (el as HTMLDetailsElement).open).length,
      );
      expect(openCount).toBeLessThanOrEqual(1);
    });
  }
});
