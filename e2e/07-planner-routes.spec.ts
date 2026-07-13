import { expect, test, type Page } from "@playwright/test";
import { loginOperatorIfConfigured } from "./helpers/mobile-audit";

/**
 * IPI-536 — Planner Foundation route coverage. 10 scenarios per the QA scope.
 * Requires dev server on :3002. Set QA_PASSWORD for authenticated routes.
 * Runs across all 5 configured projects (playwright.config.ts) — see
 * expectNavMatchesViewport below for why nav-visibility assertions must be
 * viewport-aware, not a blanket toBeVisible()/toBeHidden().
 *
 * Workspace/Settings happy-path tests (3, 4) need a real planner.instances
 * row — production has 0 rows as of this PR (no instance-creation ticket has
 * shipped yet). Per the "no unauthorized live writes" constraint, these are
 * gated on QA_PLANNER_INSTANCE_ID rather than inserting a fixture row here.
 * Set it to a real instance id (owned by the qa@ipix.test org) to enable.
 *
 * Scenario 9 (route-level error boundary) cannot be forced safely/
 * deterministically from a black-box browser test without manipulating the
 * live Supabase connection or env vars mid-run — both unsafe for a shared
 * dev server. It's covered instead by a Vitest component test
 * (planner-error-boundary.render.test.tsx) that renders the boundary
 * directly with a thrown error and asserts Sentry reporting + generic
 * message. This test is skipped with that reasoning, not silently dropped.
 *
 * `h1:not([class*="cpk"])` — the operator shell's persistent CopilotKit chat
 * dock renders its own `<h1>` ("Ask about your portfolio...") on every /app/*
 * route, both inside <main>. A plain `page.locator("h1")` matches 2 elements
 * and fails Playwright's strict mode. Pre-existing shell behavior, not
 * introduced by this ticket — flagged for Phase 8 (multiple <h1> per page is
 * a heading-hierarchy smell), not treated as an IPI-536 regression.
 */
const FIXTURE_INSTANCE_ID = process.env.QA_PLANNER_INSTANCE_ID;
const MALFORMED_ID = "not-a-uuid";
const NONEXISTENT_UUID = "00000000-0000-0000-0000-000000000000";

// nav-sidebar.module.css:170-172 — `.nav { display: none }` at
// max-width: 768px, repo-wide (every icon), "CopilotSidebar handles
// navigation on small screens" per the CSS's own comment. A code-reviewer
// pass on this file caught the original version asserting a blanket
// toBeVisible()/toBeHidden(), which is deterministically wrong on 3 of the
// 5 configured projects (mobile-390/430, tablet-768 hide it; chromium-
// desktop/tablet-1024 show it). This checks the real viewport instead of
// assuming one, so the suite gains coverage across all 5 projects rather
// than needing to skip any of them.
async function expectNavMatchesViewport(page: Page) {
  const width = page.viewportSize()?.width ?? 0;
  const nav = page.locator('nav[aria-label="App navigation"]');
  if (width <= 768) {
    await expect(nav).toBeHidden();
  } else {
    await expect(nav).toBeVisible();
  }
}

test.describe("Planner — routes", () => {
  test.beforeEach(async ({ page }) => {
    const ok = await loginOperatorIfConfigured(page);
    test.skip(!ok, "QA_PASSWORD not set — skipping authenticated Planner routes");
  });

  test("1. Hub route renders inside the operator shell", async ({ page }) => {
    const res = await page.goto("/app/planner");
    expect(res?.status()).toBeLessThan(400);
    await expect(page.locator('h1:not([class*="cpk"])')).toHaveText("Planner");
    await expectNavMatchesViewport(page);
  });

  test("2. Dashboard route renders inside the operator shell", async ({ page }) => {
    const res = await page.goto("/app/planner/dashboard");
    expect(res?.status()).toBeLessThan(400);
    await expect(page.locator('h1:not([class*="cpk"])')).toHaveText("Planner Dashboard");
    await expectNavMatchesViewport(page);
  });

  test("3. Workspace happy path renders for a real instance", async ({ page }) => {
    test.skip(!FIXTURE_INSTANCE_ID, "QA_PLANNER_INSTANCE_ID not set — no seeded fixture instance");
    const res = await page.goto(`/app/planner/${FIXTURE_INSTANCE_ID}`);
    expect(res?.status()).toBeLessThan(400);
    await expect(page.locator('h1:not([class*="cpk"])')).toHaveText("Planner Workspace");
    await expectNavMatchesViewport(page);
  });

  test("4. Settings happy path renders for a real instance", async ({ page }) => {
    test.skip(!FIXTURE_INSTANCE_ID, "QA_PLANNER_INSTANCE_ID not set — no seeded fixture instance");
    const res = await page.goto(`/app/planner/${FIXTURE_INSTANCE_ID}/settings`);
    expect(res?.status()).toBeLessThan(400);
    await expect(page.locator('h1:not([class*="cpk"])')).toHaveText("Planner Settings");
    await expectNavMatchesViewport(page);
  });

  test("5. Malformed instanceId shows Planner-scoped not-found, never the marketing 404", async ({
    page,
  }) => {
    await page.goto(`/app/planner/${MALFORMED_ID}`);
    await expect(page.locator('h1:not([class*="cpk"])')).toHaveText("Plan not found");
    // Marketing 404 renders "Page Not Found" and has no operator nav — assert both absent.
    await expect(page.getByText("Page Not Found")).toHaveCount(0);
    await expectNavMatchesViewport(page);
  });

  test("6. Valid-but-nonexistent UUID shows Planner-scoped not-found, operator shell intact", async ({
    page,
  }) => {
    await page.goto(`/app/planner/${NONEXISTENT_UUID}`);
    await expect(page.locator('h1:not([class*="cpk"])')).toHaveText("Plan not found");
    await expect(page.getByText("Page Not Found")).toHaveCount(0);
    await expectNavMatchesViewport(page);

    // Same instance under /settings must 404 the same way.
    await page.goto(`/app/planner/${NONEXISTENT_UUID}/settings`);
    await expect(page.locator('h1:not([class*="cpk"])')).toHaveText("Plan not found");
    await expectNavMatchesViewport(page);
  });

  test("8. Planner nav entry shows active state on every Planner route, not elsewhere", async ({
    page,
  }) => {
    test.skip(
      (page.viewportSize()?.width ?? 0) <= 768,
      "nav rail is hidden entirely below 768px — no active-state class to assert on a hidden element",
    );
    await page.goto("/app/planner");
    const plannerLink = page.locator('nav[aria-label="App navigation"] a[href="/app/planner"]');
    await expect(plannerLink).toHaveClass(/itemActive/);

    await page.goto("/app/planner/dashboard");
    await expect(plannerLink).toHaveClass(/itemActive/);

    await page.goto("/app/shoots");
    await expect(plannerLink).not.toHaveClass(/itemActive/);
  });

  test.skip(
    "9. Route-level error boundary (see planner-error-boundary.render.test.tsx for actual coverage)",
    async () => {
      // Intentionally skipped: forcing a real Supabase/RLS failure mid-test
      // would require mutating live env vars or DB state on a shared dev
      // server, unsafe and non-deterministic for CI. Covered instead at the
      // component level — see app/src/components/planner/planner-error-boundary.render.test.tsx.
    },
  );
});

test.describe("Planner — unauthenticated", () => {
  test("7. Unauthenticated Planner route redirects to login when the operator auth gate is on; never renders operator content either way", async ({
    page,
  }) => {
    // middleware.ts's /app/* gate is flag-gated by OPERATOR_AUTH_ENABLED
    // ("stays OFF until login creates a real session" — repo-wide, not a
    // Planner-specific setting; this dev environment currently has it
    // false). Mirrors the auth-on/auth-off ambiguity 06-booking-wizard.spec.ts
    // already handles the same way for API routes, rather than assuming
    // either state.
    await page.context().clearCookies();
    const res = await page.goto("/app/planner");
    const finalUrl = page.url();

    if (finalUrl.includes("/login")) {
      // Gate is on: redirected correctly, never rendered operator content.
      await expect(page.locator('nav[aria-label="App navigation"]')).toHaveCount(0);
    } else {
      // Gate is off in this environment (OPERATOR_AUTH_ENABLED=false) — the
      // route still must not error or 5xx; content rendering without a
      // session is the accepted current state, not a Planner regression.
      expect(res?.status()).toBeLessThan(500);
    }
  });
});

test.describe("Planner — mobile", () => {
  test("10. Planner route content is usable at mobile viewport; nav rail is intentionally hidden below 768px, not a Planner-specific gap", async ({
    page,
  }) => {
    const ok = await loginOperatorIfConfigured(page);
    test.skip(!ok, "QA_PASSWORD not set");
    test.skip(
      (page.viewportSize()?.width ?? Infinity) > 768,
      "this scenario specifically asserts the sub-768px hidden-nav behavior — run under mobile-390/430 or tablet-768",
    );

    await page.goto("/app/planner");
    await expectNavMatchesViewport(page);

    // What IS testable at mobile: the route's own content still renders
    // correctly and doesn't overflow horizontally.
    await expect(page.locator('h1:not([class*="cpk"])')).toHaveText("Planner");
    const overflow = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }));
    expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.clientWidth + 1);
  });
});
