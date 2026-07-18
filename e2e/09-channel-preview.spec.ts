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
 * path, which is exactly the "real DB logic, zero tests" risk this
 * screen was flagged for. The Vitest suite (channel-specs.server.test.ts)
 * already covers that query's logic against a mocked Supabase client;
 * this test is what proves the real integration — real query, real
 * render — actually works end to end.
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
  test("renders all 4 channel frames from a real getAllChannelSpecs() call, and studio edits are interactive", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium-desktop", "desktop-only functional proof");

    // Installed before login — the operator shell's /api/brands fetch fires
    // as soon as the post-login /app shell mounts.
    await stubOperatorShellApis(page);

    const loggedIn = await loginOperatorIfConfigured(page);
    test.skip(!loggedIn, "QA_PASSWORD required in app/.env.local");

    await page.goto("/app/preview");
    await expect(page.locator("body")).not.toContainText("Internal Server Error");
    await expect(page.getByRole("heading", { name: "Channel Preview" })).toBeVisible();

    // One caption per PREVIEW_CHANNELS entry — proves getAllChannelSpecs()
    // resolved (real Supabase query) and all 4 device frames rendered,
    // regardless of whether each channel happens to have a seeded spec.
    await expect(page.getByText("Facebook Feed")).toBeVisible();
    await expect(page.getByText("Instagram Feed")).toBeVisible();
    await expect(page.getByText("Instagram Story")).toBeVisible();
    await expect(page.getByText("TikTok")).toBeVisible();

    // The 4 caption labels above are static (CHANNEL_LABELS[channel]) and
    // render regardless of whether a spec was found — SpecCaption only
    // switches the *sub-line* between spec data and the "No spec seeded"
    // fallback (see device-frame-preview.tsx). So the assertions above alone
    // would still pass even if getAllChannelSpecs() silently returned all
    // nulls (a real Supabase bridge/seed regression). All 4 PREVIEW_CHANNELS
    // are seeded by migration 20260627180000_media_spec_tables.sql via
    // recommendation_rules(rule_type='channel_required') — so on a healthy
    // DB, the null-spec fallback should never appear here at all. Asserting
    // its absence is what actually proves the spec data came through.
    await expect(page.getByText("No spec seeded for this channel")).toHaveCount(0);

    // Interactivity proof: editing the brand name (client-side local state)
    // updates the rendered Facebook chrome, which shows the raw brand name.
    const brandInput = page.getByLabel("Brand name");
    await brandInput.fill("E2E Test Brand");
    await expect(page.getByText("E2E Test Brand").first()).toBeVisible();

    // Toggling to video swaps every rendered <img alt="Asset preview"> for a <video>.
    await expect(page.getByAltText("Asset preview").first()).toBeVisible();
    await page.getByRole("button", { name: "video" }).click();
    await expect(page.locator("video").first()).toBeVisible();
    await expect(page.getByAltText("Asset preview")).toHaveCount(0);
  });
});
