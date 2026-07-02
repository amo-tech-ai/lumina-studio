import { expect, test } from "@playwright/test";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { getQaCredentials } from "./helpers/qa-credentials";
import { loginOperatorIfConfigured } from "./helpers/mobile-audit";

const OUT_DIR = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "../tasks/design-docs/implementation/brand/screenshots/2026-07-02",
);

const DC = {
  brandList: "http://localhost:8765/Brand%20List.v2.image-first.dc.html",
  brandDetail: "http://localhost:8765/Brand%20Detail.v2.image-first.dc.html?id=nike",
  commandCenter: "http://localhost:8765/Command%20Center.v2.image-first.dc.html",
} as const;

const DC_READY: Record<keyof typeof DC, RegExp | string> = {
  brandList: /Brand portfolio|Your brands/i,
  brandDetail: /Brand DNA|Visual identity/i,
  commandCenter: "DNA Score",
};

test.describe("Brand DC parity — screenshot capture", () => {
  test.beforeAll(() => {
    mkdirSync(OUT_DIR, { recursive: true });
  });

  test("capture DC design references (desktop 1280)", async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const page = await context.newPage();

    for (const [name, url] of Object.entries(DC)) {
      await page.goto(url, { waitUntil: "domcontentloaded" });
      await expect(page.getByText(DC_READY[name as keyof typeof DC])).toBeVisible({
        timeout: 20_000,
      });
      await page.screenshot({ path: resolve(OUT_DIR, `${name}-dc-desktop.png`), fullPage: true });
    }

    await context.close();
  });

  test("capture React screens (desktop 1280)", async ({ browser }) => {
    const { password } = getQaCredentials();
    test.skip(!password, "QA credentials required in .env.local");

    const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const page = await context.newPage();

    const loggedIn = await loginOperatorIfConfigured(page);
    expect(loggedIn).toBe(true);

    await page.goto("/app", { waitUntil: "domcontentloaded" });
    await expect(page.getByText("Recent work")).toBeVisible({ timeout: 20_000 });
    await page.screenshot({
      path: resolve(OUT_DIR, "commandCenter-react-desktop.png"),
      fullPage: true,
    });

    await page.goto("/app/brand", { waitUntil: "domcontentloaded" });
    await expect(page.getByTestId("brand-list-workspace")).toBeVisible({ timeout: 15_000 });
    await page.screenshot({
      path: resolve(OUT_DIR, "brandList-react-desktop.png"),
      fullPage: true,
    });

    const detailLink = page.locator('[data-testid="brand-list-card"] a[href*="/app/brand/"]').first();
    const href = await detailLink.getAttribute("href");
    expect(href).toBeTruthy();

    await page.goto(href!, { waitUntil: "domcontentloaded" });
    await expect(page.getByTestId("brand-detail-workspace")).toBeVisible({ timeout: 15_000 });
    await page.screenshot({
      path: resolve(OUT_DIR, "brandDetail-react-desktop.png"),
      fullPage: true,
    });

    await context.close();
  });
});
