import { expect, test } from "@playwright/test";

import { loginOperatorIfConfigured } from "./helpers/mobile-audit";

async function gotoFirstBrandDetail(page: import("@playwright/test").Page) {
  await page.goto("/app/brand", { waitUntil: "domcontentloaded" });
  const link = page.locator('[data-testid="brand-list-card"] a[href*="/app/brand/"]').first();
  await expect(link).toBeVisible({ timeout: 20_000 });
  const href = await link.getAttribute("href");
  expect(href).toBeTruthy();
  const res = await page.goto(href!, { waitUntil: "domcontentloaded" });
  expect(res?.status()).toBeLessThan(500);
  await expect(page.getByTestId("brand-detail-workspace")).toBeVisible({ timeout: 20_000 });
  return href!;
}

/** Extension-only noise — Playwright Chromium has no extensions; these should never appear. */
function isExtensionOnlyNoise(text: string): boolean {
  return (
    /chrome-extension:\/\//i.test(text) ||
    /installHook\.js/i.test(text) ||
    /react-devtools/i.test(text) ||
    /download the react devtools/i.test(text) ||
    /useCopilotKit must be used within CopilotKitProvider/i.test(text)
  );
}

function isBenignAppNoise(text: string): boolean {
  return (
    /Failed to load resource: the server responded with a status of 404/i.test(text) ||
    /favicon\.ico/i.test(text) ||
    /useCopilotKit must be used within CopilotKitProvider/i.test(text)
  );
}

test.describe("Brand detail — console forensics (clean Chromium)", () => {
  test.beforeEach(async ({ page }) => {
    const loggedIn = await loginOperatorIfConfigured(page);
    test.skip(!loggedIn, "QA credentials required in .env.local");
  });

  test("brand detail route has no app-originating console errors", async ({ page }) => {
    const consoleErrors: string[] = [];
    const pageErrors: string[] = [];

    page.on("console", (msg) => {
      if (msg.type() === "error") consoleErrors.push(msg.text());
    });
    page.on("pageerror", (err) => pageErrors.push(err.message));

    const href = await gotoFirstBrandDetail(page);
    await expect(page.getByTestId("intelligence-panel")).toBeVisible();
    void href;
    await page.waitForTimeout(1500);

    const appErrors = [...consoleErrors, ...pageErrors].filter(
      (e) => !isExtensionOnlyNoise(e) && !isBenignAppNoise(e),
    );

    expect(appErrors, `App console errors:\n${appErrors.join("\n")}`).toEqual([]);
  });

  test("navigation refresh and panel tabs stay clean", async ({ page }) => {
    const consoleErrors: string[] = [];

    page.on("console", (msg) => {
      if (msg.type() === "error") consoleErrors.push(msg.text());
    });

    await gotoFirstBrandDetail(page);

    await page.reload({ waitUntil: "domcontentloaded" });
    await expect(page.getByTestId("brand-detail-workspace")).toBeVisible({ timeout: 20_000 });

    await page.getByRole("tab", { name: "Approvals" }).click();
    await page.getByRole("tab", { name: "Activity" }).click();
    await page.getByRole("tab", { name: "Overview" }).click();

    await page.goto("/app/brand", { waitUntil: "domcontentloaded" });
    await gotoFirstBrandDetail(page);
    await page.waitForTimeout(1500);

    const appErrors = consoleErrors.filter(
      (e) => !isExtensionOnlyNoise(e) && !isBenignAppNoise(e),
    );
    expect(appErrors).toEqual([]);
  });

  test("evidence dialog open/close stays clean", async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") consoleErrors.push(msg.text());
    });

    await gotoFirstBrandDetail(page);

    const pillarBtn = page.getByRole("button", { name: /Visual — \d+/ }).first();
    await expect(pillarBtn).toBeVisible({ timeout: 10_000 });
    await pillarBtn.click();
    await expect(page.getByRole("dialog")).toBeVisible({ timeout: 5000 });
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).toBeHidden({ timeout: 5000 });

    await page.waitForTimeout(500);

    const appErrors = consoleErrors.filter(
      (e) => !isExtensionOnlyNoise(e) && !isBenignAppNoise(e),
    );
    expect(appErrors).toEqual([]);
  });
});
