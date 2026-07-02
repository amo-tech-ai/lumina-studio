import { expect, test } from "@playwright/test";

import { loginOperatorIfConfigured } from "./helpers/mobile-audit";

const OUT = "tasks/design-docs/implementation/brand/screenshots/2026-07-02";
const DC_URL = "http://localhost:8765/Command%20Center.v2.image-first.dc.html";

test.describe("Command Center DC parity screenshots", () => {
  test("capture DC target and React /app desktop + mobile", async ({ browser }) => {
    const desktop = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const mobile = await browser.newContext({ viewport: { width: 390, height: 844 } });

    const dcPage = await desktop.newPage();
    await dcPage.goto(DC_URL, { waitUntil: "domcontentloaded" });
    await expect(dcPage.getByText("DNA Score")).toBeVisible({ timeout: 20_000 });
    await dcPage.screenshot({
      path: `${OUT}/commandCenter-dc-desktop-v2.png`,
      fullPage: true,
    });

    const reactDesktop = await desktop.newPage();
    const loggedIn = await loginOperatorIfConfigured(reactDesktop);
    test.skip(!loggedIn, "QA credentials required");
    await reactDesktop.goto("/app", { waitUntil: "domcontentloaded" });
    await expect(reactDesktop.getByText("Recent work")).toBeVisible({ timeout: 20_000 });
    await reactDesktop.screenshot({
      path: `${OUT}/commandCenter-react-desktop-v2.png`,
      fullPage: true,
    });

    const reactMobile = await mobile.newPage();
    const mobileLoggedIn = await loginOperatorIfConfigured(reactMobile);
    test.skip(!mobileLoggedIn, "QA credentials required");
    await reactMobile.goto("/app", { waitUntil: "domcontentloaded" });
    await expect(reactMobile.getByText("Recent work")).toBeVisible({ timeout: 20_000 });
    await reactMobile.screenshot({
      path: `${OUT}/commandCenter-react-mobile-v2.png`,
      fullPage: true,
    });

    await desktop.close();
    await mobile.close();
  });
});
