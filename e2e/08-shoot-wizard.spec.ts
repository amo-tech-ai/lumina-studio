import { expect, test } from "@playwright/test";

import { loginOperatorIfConfigured } from "./helpers/mobile-audit";

/**
 * IPI-674 · QA-SHOOT-001 — Shoot Wizard happy-path e2e.
 *
 * Logs in as the real QA operator and drives the real /app/shoots/new UI in
 * a real browser. Every network dependency is intercepted via page.route()
 * so the run is fast and fully deterministic:
 *  - the Supabase brands read (so the test never depends on what's actually
 *    seeded in whatever environment it runs against)
 *  - the 3 AI/workflow-backed calls (plan deliverables, approve→shot list,
 *    approve→budget) and the final commit
 * A catch-all /api/** route fails any call this test doesn't explicitly
 * expect, so "no real AI/workflow/commit request escapes the mocks" is
 * enforced by construction, not by assertion after the fact.
 *
 * Desktop only — this is a functional flow proof, not a responsive-layout
 * audit (that's 05-mobile-operator-matrix.spec.ts's job).
 */

const RUN_ID = "e2e-run-1";
const BRAND = { id: "e2e-brand-1", name: "E2E Test Brand" };

/**
 * Registers routes and returns the list of unexpected /api/** calls made
 * while they were active. A route.fulfill(500) alone doesn't fail a
 * Playwright test — nothing asserts on it — so an unmocked background call
 * (e.g. a real AI/workflow call whose error the UI silently swallows) could
 * still leave the happy path green. Callers must assert this array is empty.
 */
function trackedMockWizardApis(page: import("@playwright/test").Page) {
  const unexpectedCalls: string[] = [];

  const install = async () => {
    // Registered first so it's checked LAST for any URL a more specific route
    // below also matches (Playwright resolves overlapping routes most-recently
    // -registered-first) — this only fires for /api/** calls no specific mock
    // below claims, i.e. an unexpected endpoint.
    await page.route("**/api/**", (route) => {
      const req = route.request();
      const violation = `${req.method()} ${new URL(req.url()).pathname}`;
      unexpectedCalls.push(violation);
      return route.fulfill({ status: 500, json: { error: `unexpected endpoint call: ${violation}` } });
    });

    await page.route("**/rest/v1/brands*", (route) => route.fulfill({ json: [BRAND] }));

    // The operator shell (mounted on every /app/* page, not just this
    // wizard) fires these on its own as soon as it lands — they're not part
    // of the Shoot Wizard flow this test verifies, but they'd otherwise hit
    // real Supabase/CopilotKit routes. Stubbed with safe, empty-ish success
    // shapes so the shell renders without depending on real backend data,
    // and excluded from the unexpected-call violation set below.
    await page.route("**/api/brands", (route) => route.fulfill({ json: [] }));
    await page.route("**/api/intelligence/panel**", (route) => route.fulfill({ json: {} }));
    await page.route("**/api/copilotkit/info**", (route) => route.fulfill({ json: {} }));

    await page.route("**/api/shoots/suggest-brief", (route) =>
      route.fulfill({ json: { brief: "E2E generated creative brief for the SS26 campaign." } }),
    );

    await page.route("**/api/workflows/shoot-wizard", (route) =>
      route.fulfill({
        json: {
          runId: RUN_ID,
          suspendPayload: {
            deliverables: [{ channel: "instagram_feed", format: "JPG", quantity: 6 }],
            total_assets: 6,
          },
        },
      }),
    );

    await page.route("**/api/workflows/resume", async (route) => {
      const body = route.request().postDataJSON() as { stepId?: string };
      if (body?.stepId === "deliverable-gate") {
        return route.fulfill({
          json: {
            suspendPayload: {
              shots: [
                { shot_number: 1, description: "Hero, full body", angle: "eye-level", lighting: "soft daylight", deliverable_ids: [] },
              ],
              uncovered_warnings: [],
            },
          },
        });
      }
      if (body?.stepId === "shot-list-gate") {
        return route.fulfill({
          json: { suspendPayload: { budget: { crew: 1000, studio: 500, equipment: 300, post: 200, total: 2000 } } },
        });
      }
      if (body?.stepId === "budget-gate") {
        return route.fulfill({ json: {} });
      }
      return route.fulfill({ status: 400, json: { error: `unmocked stepId: ${body?.stepId}` } });
    });

    await page.route("**/api/shoots/commit", (route) =>
      route.fulfill({ json: { shoot_id: "e2e-shoot-123" } }),
    );

    // Deterministic empty spec panel — the real /api/media/specs endpoint is
    // orthogonal to this flow's acceptance criteria and just adds noise/flake.
    await page.route("**/api/media/specs**", (route) => route.fulfill({ json: { results: [] } }));
  };

  return { install, unexpectedCalls };
}

test.describe("IPI-674 — Shoot Wizard happy path", () => {
  test("Basics → Brief → Deliverables → Shot List → Budget → inline Confirmation (no redirect)", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium-desktop", "desktop-only functional proof");
    test.setTimeout(60_000);

    // In CI this must fail loudly, not vanish as a green "skipped" run —
    // a missing credential should never look like a passing test suite.
    if (process.env.CI && !process.env.QA_PASSWORD) {
      throw new Error("QA_PASSWORD is required in CI for this test — refusing to silently skip.");
    }

    // Routes must be live BEFORE login: loginOperatorIfConfigured() navigates
    // all the way to /app, where the operator shell's useOperatorBrands hook
    // fires a real (unmocked) /api/brands call as soon as it mounts. Install
    // the mocks first so that first landing is covered too, not just the
    // later goto("/app/shoots/new").
    const { install, unexpectedCalls } = trackedMockWizardApis(page);
    await install();

    const loggedIn = await loginOperatorIfConfigured(page);
    test.skip(!loggedIn, "QA_PASSWORD required in app/.env.local");

    await page.goto("/app/shoots/new");
    await expect(page.locator("body")).not.toContainText("Internal Server Error");

    // ── Basics ── brand is mocked, deterministic — no environment-dependent skip
    await page.getByLabel("Brand *").selectOption({ label: BRAND.name });
    await page.getByLabel("Shoot name *").fill("E2E SS26 Campaign");
    await page.getByRole("button", { name: /IG Feed/ }).click();
    const continueBtn = page.getByRole("button", { name: /Continue/ });
    await expect(continueBtn).toBeEnabled();
    await continueBtn.click();

    // ── Brief (auto-generates via the intercepted suggest-brief route) ──
    await expect(page.getByText("Step 2 of 6 · Brief")).toBeVisible();
    const briefField = page.getByLabel("Brief *");
    await expect(briefField).toHaveValue(/.+/, { timeout: 10_000 });
    await page.getByRole("button", { name: /Plan deliverables/ }).click();

    // ── Deliverables (HITL gate 1) ──
    await expect(page.getByText("Step 3 of 6 · Deliverables")).toBeVisible();
    const approveDeliverables = page.getByRole("button", { name: /Approve deliverables/ });
    await expect(approveDeliverables).toBeEnabled();
    await approveDeliverables.click();

    // ── Shot List (HITL gate 2) ──
    await expect(page.getByText("Step 4 of 6 · Shot List")).toBeVisible();
    const approveShotList = page.getByRole("button", { name: /Approve shot list/ });
    await expect(approveShotList).toBeEnabled();
    await approveShotList.click();

    // ── Budget (HITL gate 3) ──
    await expect(page.getByText("Step 5 of 6 · Budget")).toBeVisible();
    await page.getByRole("button", { name: /Approve & commit/ }).click();

    // ── Confirmation — inline on the same page, not a redirect ──
    await expect(page.getByText("Shoot committed")).toBeVisible({ timeout: 10_000 });
    await expect(page).toHaveURL(/\/app\/shoots\/new$/);
    await expect(page.getByText("E2E SS26 Campaign")).toBeVisible();
    await expect(page.getByText(/e2e-shoot-123/)).toBeVisible();

    // The catch-all responding 500 doesn't fail the test by itself — this
    // explicit assertion is what actually enforces "no real AI/workflow/
    // commit/brand-read request escapes the mocks".
    expect(unexpectedCalls, "unexpected /api/** calls escaped the mocked allowlist").toEqual([]);
  });
});
