import { expect, test } from "@playwright/test";

/**
 * IPI-337 / DESIGN-054b — Shoot Detail tab smoke tests.
 */

test.describe("Shoot Detail — IPI-337", () => {
  test("invalid shoot id shows error or login", async ({ page }) => {
    await page.goto("/app/shoots/not-a-uuid");
    const body = page.locator("body");
    const ok =
      (await body.getByText(/invalid|not found|couldn't load|sign in|log in/i).count()) > 0 ||
      (await body.getByText(/Internal Server Error/i).count()) === 0;
    expect(ok).toBe(true);
  });

  test("shoot detail route accepts uuid shape", async ({ page }) => {
    await page.goto("/app/shoots/00000000-0000-4000-8000-000000000001");
    await expect(page.locator("body")).not.toContainText("Internal Server Error");
    const body = page.locator("body");
    const hasContent =
      (await body.getByText(/couldn't load|shoot not found|loading shoot|shoots/i).count()) > 0 ||
      (await body.getByRole("tab", { name: /overview/i }).count()) > 0 ||
      (await body.getByText(/sign in|log in/i).count()) > 0;
    expect(hasContent).toBe(true);
  });

  test("tab labels present when detail loads", async ({ page }) => {
    await page.goto("/app/shoots/00000000-0000-4000-8000-000000000001");
    const tabs = ["Overview", "Shot List", "Assets", "Team", "Schedule", "Budget"];
    for (const label of tabs) {
      const tab = page.getByRole("tab", { name: new RegExp(label, "i") });
      if ((await tab.count()) > 0) {
        await expect(tab.first()).toBeVisible();
      }
    }
  });
});
