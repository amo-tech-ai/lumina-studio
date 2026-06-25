import { expect, test } from "@playwright/test";

test.describe("App — loads and routes correctly", () => {
  test("root redirects or renders without crash", async ({ page }) => {
    const res = await page.goto("/");
    expect(res?.status()).toBeLessThan(500);
    await expect(page).not.toHaveTitle(/error|500/i);
  });

  test("/app/shoots route loads without crash", async ({ page }) => {
    await page.goto("/app/shoots");
    // either renders content or redirects to login — no 500
    await expect(page.locator("body")).not.toContainText("Internal Server Error");
    await expect(page.locator("body")).not.toContainText("Application error");
  });

  test("/app/brand route loads without crash", async ({ page }) => {
    await page.goto("/app/brand");
    await expect(page.locator("body")).not.toContainText("Internal Server Error");
    await expect(page.locator("body")).not.toContainText("Application error");
  });

  test("/app/campaigns route loads without crash", async ({ page }) => {
    await page.goto("/app/campaigns");
    await expect(page.locator("body")).not.toContainText("Internal Server Error");
    await expect(page.locator("body")).not.toContainText("Application error");
  });
});
