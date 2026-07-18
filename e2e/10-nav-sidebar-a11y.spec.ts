import { expect, test } from "@playwright/test";
import { loginOperatorIfConfigured } from "./helpers/mobile-audit";

/**
 * IPI-584 — Operator nav-sidebar accessibility fixes.
 * Requires dev server on :3002. Set QA_PASSWORD for authenticated operator routes.
 *
 * nav-sidebar.module.css:170-172 hides the rail entirely below 768px (see
 * e2e/07-planner-routes.spec.ts's expectNavMatchesViewport comment) — these
 * assertions only make sense where the rail is visible, so this spec is
 * scoped to chromium-desktop.
 */
test.describe("IPI-584 — nav-sidebar accessibility", () => {
  test.beforeEach(async ({ page }, testInfo) => {
    // nav-sidebar.module.css:185-187 hides the rail entirely below 768px, so
    // these assertions have nothing to find on the mobile-390/mobile-430/
    // tablet-768/tablet-1024 projects — skip explicitly instead of timing
    // out waiting for elements that will never render. Same pattern as
    // e2e/09-channel-preview.spec.ts's "desktop-only functional proof" skip.
    test.skip(testInfo.project.name !== "chromium-desktop", "desktop-only — nav rail is hidden below 768px");

    const ok = await loginOperatorIfConfigured(page);
    test.skip(!ok, "QA_PASSWORD not set — skipping authenticated nav-sidebar checks");
  });

  test("A — nav links resolve by their accessible name (label), not the raw emoji", async ({
    page,
  }) => {
    await page.goto("/app/planner");
    const nav = page.locator('nav[aria-label="App navigation"]');
    await expect(nav).toBeVisible();

    // Accessible name comes from aria-label, not the emoji text content.
    // Scoped to the nav landmark — the Planner hub's own page content also
    // has links named "Planner" (e.g. fixture cards), so an unscoped
    // getByRole would violate Playwright's strict mode.
    const plannerLink = nav.getByRole("link", { name: "Planner" });
    await expect(plannerLink).toHaveAttribute("href", "/app/planner");

    const homeLink = nav.getByRole("link", { name: "Home" });
    await expect(homeLink).toHaveAttribute("href", "/app");

    // Visible text content is still the emoji glyph — aria-label wins for
    // the accessible name without changing what's rendered on screen.
    const plannerText = await plannerLink.textContent();
    expect(plannerText).toContain("🗓");
  });

  test("B — exactly one nav link has aria-current=page, matching the current route", async ({
    page,
  }) => {
    await page.goto("/app/planner");
    const nav = page.locator('nav[aria-label="App navigation"]');
    const current = nav.locator('a[aria-current="page"]');
    await expect(current).toHaveCount(1);
    await expect(current).toHaveAttribute("href", "/app/planner");

    const shootsLink = nav.locator('a[href="/app/shoots"]');
    await expect(shootsLink).not.toHaveAttribute("aria-current", "page");

    await page.goto("/app/shoots");
    const currentAfterNav = nav.locator('a[aria-current="page"]');
    await expect(currentAfterNav).toHaveCount(1);
    await expect(currentAfterNav).toHaveAttribute("href", "/app/shoots");

    const plannerLink = nav.locator('a[href="/app/planner"]');
    await expect(plannerLink).not.toHaveAttribute("aria-current", "page");
  });

  test("C — nav items, toggle button, and brand items show a visible focus indicator", async ({
    page,
  }) => {
    await page.goto("/app/planner");
    const nav = page.locator('nav[aria-label="App navigation"]');

    // Focus ring is a box-shadow (var(--ring)), matching threads-drawer's
    // convention — outline itself is intentionally "none", so the visible-
    // indicator check is on boxShadow, not outlineStyle.
    const toggleBtn = nav.locator("button").first();
    await toggleBtn.focus();
    await expect(toggleBtn).toBeFocused();
    let boxShadow = await toggleBtn.evaluate((el) => getComputedStyle(el).boxShadow);
    expect(boxShadow).not.toBe("none");

    const plannerLink = nav.getByRole("link", { name: "Planner" });
    await plannerLink.focus();
    await expect(plannerLink).toBeFocused();
    boxShadow = await plannerLink.evaluate((el) => getComputedStyle(el).boxShadow);
    expect(boxShadow).not.toBe("none");
  });

  test("C — brand-switcher item shows a visible focus indicator when expanded", async ({
    page,
  }) => {
    await page.goto("/app/planner");
    const nav = page.locator('nav[aria-label="App navigation"]');
    const toggleBtn = nav.locator("button").first();

    // Expand the rail so brand items render (brands section is conditional
    // on open && brands.length > 0 — skip if this operator has none loaded).
    await toggleBtn.click();
    const brandItem = page.locator(`.brandItem, [class*="brandItem"]`).first();
    const hasBrands = (await brandItem.count()) > 0;
    test.skip(!hasBrands, "no brands loaded for this operator session — nothing to focus-check");

    await brandItem.focus();
    await expect(brandItem).toBeFocused();
    const boxShadow = await brandItem.evaluate((el) => getComputedStyle(el).boxShadow);
    expect(boxShadow).not.toBe("none");
  });

  test("D — Threads shortcut has an accessible name, not the raw emoji", async ({ page }) => {
    await page.goto("/app/planner");
    const threadsBtn = page.getByRole("button", { name: "Chat threads" });
    await expect(threadsBtn).toBeVisible();
    const text = await threadsBtn.textContent();
    expect(text).toContain("💬");
  });
});
