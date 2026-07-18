import { expect, test } from "@playwright/test";

import { loginOperatorIfConfigured } from "./helpers/mobile-audit";

/**
 * IPI-674 · QA-SHOOT-001 — Shoot Wizard happy-path e2e.
 *
 * Logs in as the real QA operator (skips cleanly if QA_PASSWORD isn't
 * configured, matching this suite's established convention) and drives the
 * real /app/shoots/new UI in a real browser. The 3 AI/workflow-backed calls
 * (plan deliverables, approve→shot list, approve→budget) and the final
 * commit are intercepted via page.route() so the test is fast and
 * deterministic instead of depending on live AI output — Task 10's "no real
 * AI call in CI" guard is satisfied by construction, not by assertion.
 *
 * Desktop only — this is a functional flow proof, not a responsive-layout
 * audit (that's 05-mobile-operator-matrix.spec.ts's job).
 */

const RUN_ID = "e2e-run-1";

async function mockWizardApis(page: import("@playwright/test").Page) {
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
}

test.describe("IPI-674 — Shoot Wizard happy path", () => {
  test("Basics → Brief → Deliverables → Shot List → Budget → inline Confirmation (no redirect)", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium-desktop", "desktop-only functional proof");
    test.setTimeout(60_000);

    const loggedIn = await loginOperatorIfConfigured(page);
    test.skip(!loggedIn, "QA_PASSWORD required in app/.env.local");

    await mockWizardApis(page);

    // Brands load asynchronously via a client-side Supabase query
    // (page.tsx's useEffect hitting /rest/v1/brands) — start waiting for that
    // response before navigating, so the option-count check below can't race
    // ahead of the fetch and mistake "not loaded yet" for "not seeded".
    const brandsLoaded = page
      .waitForResponse((r) => r.url().includes("/rest/v1/brands"), { timeout: 10_000 })
      .catch(() => null);

    await page.goto("/app/shoots/new");
    await expect(page.locator("body")).not.toContainText("Internal Server Error");
    await brandsLoaded;

    const brandSelect = page.locator("#brand-select");
    await expect(brandSelect).toBeVisible();
    const brandOptionCount = await brandSelect.locator("option").count();
    test.skip(brandOptionCount <= 1, "no brand seeded for this operator — nothing to select in Basics");

    // ── Basics ──
    await brandSelect.selectOption({ index: 1 });
    await page.locator("#shoot-name").fill("E2E SS26 Campaign");
    await page.getByRole("button", { name: /IG Feed/ }).click();
    const continueBtn = page.getByRole("button", { name: /Continue/ });
    await expect(continueBtn).toBeEnabled();
    await continueBtn.click();

    // ── Brief (auto-generates via the intercepted suggest-brief route) ──
    await expect(page.getByText("Step 2 of 6 · Brief")).toBeVisible();
    const briefField = page.locator("#brief-text");
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
  });
});
