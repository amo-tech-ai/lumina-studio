import { expect, test } from "@playwright/test";

import { loginOperatorIfConfigured } from "./helpers/mobile-audit";

/**
 * Channel Preview (/app/preview) functional smoke test.
 *
 * Unlike the Shoot Wizard, this screen makes zero client-side network
 * calls: getAllChannelSpecs() runs server-side in the async Server
 * Component (page.tsx) before the page ever reaches the browser, and the
 * client-side studio is pure local React state. So there's nothing to
 * mock here, and no risk of a real AI/workflow/commit call — this test
 * deliberately hits the REAL Supabase-backed getAllChannelSpecs() query
 * path. The Vitest suite (channel-specs.server.test.ts) already covers
 * that query's logic against a mocked Supabase client; this test is what
 * proves the real integration — real query, real render — actually works
 * end to end.
 *
 * 05-mobile-operator-matrix.spec.ts already covers /app/preview for
 * horizontal-overflow at 4 breakpoints — that's a layout-only check, not
 * a functional one. This spec is desktop-only and checks behavior.
 */

test.use({ trace: "off" }); // real login — see e2e/08-shoot-wizard.spec.ts for why

/**
 * The operator layout wraps every /app/* route, so login and this page both
 * trigger unrelated shell calls (brand list, intelligence panel, CopilotKit
 * info) that have nothing to do with the channel-preview read path this spec
 * exists to prove. Stubbed the same way e2e/08-shoot-wizard.spec.ts stubs
 * them, so a shell regression can't fail (or flake) this spec. This does NOT
 * touch getAllChannelSpecs() — that call happens server-side inside the
 * Next.js Server Component during SSR, invisible to page.route(), so the
 * real Supabase-backed integration this spec is testing is unaffected.
 */
function stubOperatorShellApis(page: import("@playwright/test").Page) {
  return Promise.all([
    page.route("**/api/brands", (route) => route.fulfill({ json: [] })),
    page.route("**/api/intelligence/panel**", (route) => route.fulfill({ json: {} })),
    page.route("**/api/copilotkit/info**", (route) => route.fulfill({ json: {} })),
  ]);
}

test.describe("Channel Preview", () => {
  test("platform-first selector groups Instagram placements and a verified non-Instagram channel", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium-desktop", "desktop-only functional proof");

    await stubOperatorShellApis(page);

    const loggedIn = await loginOperatorIfConfigured(page);
    test.skip(!loggedIn, "QA_PASSWORD required in app/.env.local");

    await page.goto("/app/preview");
    await expect(page.locator("body")).not.toContainText("Internal Server Error");
    await expect(page.getByRole("heading", { name: "Channel Preview" })).toBeVisible();

    await expect(page.getByRole("checkbox", { name: "Instagram" })).toBeChecked();
    await expect(page.getByRole("tab", { name: "Instagram" })).toBeVisible();

    await expect(page.getByText("Instagram Feed")).toBeVisible();
    await expect(page.getByText("Instagram Story")).toBeVisible();
    await expect(page.getByText("Instagram Reel")).toBeVisible();
    await expect(page.getByText("Facebook Feed")).toHaveCount(0);
    await expect(page.getByText("No spec available")).toHaveCount(0);

    await page.getByRole("checkbox", { name: "Facebook" }).check();
    await page.getByRole("tab", { name: "Facebook" }).click();
    await expect(page.getByText("Facebook Feed")).toBeVisible();
    await expect(page.getByText("Facebook Story")).toHaveCount(0);
    await expect(page.getByText("Instagram Feed")).toHaveCount(0);
    await expect(page.getByText("No spec available")).toHaveCount(0);

    const brandInput = page.getByLabel("Brand name");
    await brandInput.fill("E2E Test Brand");
    await expect(page.getByText("E2E Test Brand").first()).toBeVisible();

    await expect(page.getByAltText("Asset preview").first()).toBeVisible();
    await page.getByRole("button", { name: "video" }).click();
    await expect(page.locator("video").first()).toBeVisible();
    await expect(page.getByAltText("Asset preview")).toHaveCount(0);
  });
});
