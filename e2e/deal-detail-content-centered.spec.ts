import { expect, test } from "@playwright/test";
import { loginOperatorIfConfigured } from "./helpers/mobile-audit";

/**
 * Regression test for PR #344 — the Deal Detail workspace's single content
 * column (max-width: 640px) was left-aligned with no margin, so on wide
 * viewports the leftover space (where the DC design's "not yet wired"
 * health-score aside would go) sat entirely on the right. Fixed with
 * `margin: 0 auto` on .content — this test pins that centering so a future
 * change to the module doesn't silently reintroduce the left-hugging bug.
 *
 * Uses a static seed deal (Zara, qualified stage — non-terminal, always
 * present) rather than creating fixtures, since this only asserts layout
 * geometry, not deal data.
 */
const SEED_DEAL_ID = "00000000-0000-0000-0000-000000000601";

test.describe("Deal Detail — content column stays centered", () => {
  test.beforeEach(async ({ page }) => {
    const loggedIn = await loginOperatorIfConfigured(page);
    test.skip(!loggedIn, "QA_PASSWORD required in .env.local");
  });

  test("desktop wide (2000px) — content is centered, not left-hugging", async ({ page }) => {
    await page.setViewportSize({ width: 2000, height: 1150 });
    await page.goto(`/app/crm/pipeline/${SEED_DEAL_ID}`, { waitUntil: "networkidle" });

    const content = page.getByTestId("deal-detail-content");
    await expect(content).toBeVisible();

    const margins = await content.evaluate((el) => {
      const cs = getComputedStyle(el);
      return { left: parseFloat(cs.marginLeft), right: parseFloat(cs.marginRight) };
    });

    // Exact equality, not "roughly centered" — margin: 0 auto on a block
    // element with a max-width produces identical left/right margins.
    expect(margins.left).toBeCloseTo(margins.right, 0);
    expect(margins.left).toBeGreaterThan(0);
  });

  test("mobile (375px) — unaffected, no horizontal overflow", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(`/app/crm/pipeline/${SEED_DEAL_ID}`, { waitUntil: "networkidle" });

    const content = page.getByTestId("deal-detail-content");
    await expect(content).toBeVisible();

    const overflow = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }));
    expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.clientWidth + 1);
  });
});
