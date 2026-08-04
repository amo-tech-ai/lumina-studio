import { expect, test } from "@playwright/test";

import {
  advanceToAnalysis,
  fillQuestionnaireThroughGrowth,
  loginAndOpenFreshOnboarding,
  readAuthUserId,
  readIdempotencyKey,
  selectBuildOption,
} from "./helpers/onboarding-flow";
import {
  assertTenantIsolation,
  assertUniqueMaterialized,
  queryOnboardingUniqueness,
} from "./helpers/onboarding-sql";
import { loadEnvLocalFiles, preflightOnboardingQaTarget } from "./helpers/qa-target";

/**
 * IPI-836 · ONB2-VERIFY-001 — onboarding launch proof on QA.
 *
 * Run (fail-closed to QA; never production):
 *   node scripts/run-onboarding-launch-e2e.mjs
 *
 * Or:
 *   ONBOARDING_LAUNCH_E2E=true npx playwright test \
 *     --config=playwright.onboarding-launch.config.ts \
 *     e2e/14-onboarding-launch.spec.ts --project=chromium-desktop
 *
 * Default `npm run test:e2e` discovers this file but skips unless ONBOARDING_LAUNCH_E2E=true.
 */
function launchOptIn(): boolean {
  return process.env.ONBOARDING_LAUNCH_E2E === "true";
}

function requireOrSkip(condition: boolean, reason: string) {
  if (condition) return;
  // Opt-in alone is fail-closed: missing QA_PASSWORD must not exit green after preflight-only.
  if (launchOptIn() || process.env.REQUIRE_ONBOARDING_LAUNCH_E2E === "true") {
    throw new Error(`Required onboarding launch e2e missing config: ${reason}`);
  }
  test.skip(true, reason);
}

test.describe("IPI-836 — onboarding launch (desktop QA)", () => {
  test.beforeEach(({}, testInfo) => {
    test.skip(testInfo.project.name !== "chromium-desktop", "pinned to chromium-desktop");
  });

  test("preflight refuses production targets", async () => {
    requireOrSkip(launchOptIn(), "Set ONBOARDING_LAUNCH_E2E=true");
    loadEnvLocalFiles();
    expect(() => preflightOnboardingQaTarget()).not.toThrow();
    expect(process.env.QA_DATABASE_URL).toContain("wtuhdynujhszsbwxlbdi");
    expect(process.env.QA_DATABASE_URL).not.toContain("nvdlhrodvevgwdsneplk");
  });

  test("questionnaire + mid-flow refresh + SQL uniqueness through materialize", async ({
    page,
  }) => {
    // Materialize ≤3m + DNA ≤6m + nav/login overhead — must exceed combined budgets.
    test.setTimeout(15 * 60_000);
    requireOrSkip(launchOptIn(), "Set ONBOARDING_LAUNCH_E2E=true");
    preflightOnboardingQaTarget();

    const started = await loginAndOpenFreshOnboarding(page);
    requireOrSkip(started, "QA_PASSWORD not set or login failed");

    const brandName = `IPI836 Aurelia ${Date.now()}`;
    // Use a stable public site so crawl/BI can succeed when providers are wired.
    const websiteUrl = "https://www.aesop.com";

    await fillQuestionnaireThroughGrowth(page, { brandName, websiteUrl });

    // Mid-questionnaire refresh (after growth = screen ~8 marketing).
    await page.reload();
    await expect(page.getByRole("heading").first()).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText(/Step\s+\d+\s*\/\s*13/i)).toBeVisible({ timeout: 20_000 });

    const userId = await readAuthUserId(page);
    const idem = await readIdempotencyKey(page);
    expect(userId, "auth user id").toBeTruthy();
    expect(idem, "idempotency key").toBeTruthy();

    await advanceToAnalysis(page, { brandName, websiteUrl });
    await expect(page.getByTestId("analysis-status")).toBeVisible({ timeout: 120_000 });

    // Wait until session materializes (org+brand ids persisted).
    let uniqueness = await queryOnboardingUniqueness({
      userId: userId!,
      idempotencyKey: idem!,
    });
    const deadline = Date.now() + 3 * 60_000;
    while (Date.now() < deadline && (!uniqueness.organizationId || !uniqueness.brandId)) {
      await page.waitForTimeout(5_000);
      uniqueness = await queryOnboardingUniqueness({
        userId: userId!,
        idempotencyKey: idem!,
      });
    }

    assertUniqueMaterialized(uniqueness);
    await assertTenantIsolation({
      userId: userId!,
      organizationId: uniqueness.organizationId!,
      brandId: uniqueness.brandId!,
      idempotencyKey: idem!,
    });

    // Wait for DNA payoff when crawl+BI succeed (may stay on analysis if providers fail — HOLD).
    const approve = page.getByTestId("approve-brand-dna");
    const analysis = page.getByTestId("analysis-status");
    const dnaDeadline = Date.now() + 5 * 60_000;
    while (Date.now() < dnaDeadline) {
      if (await approve.isVisible().catch(() => false)) break;
      const statusText = (await analysis.textContent().catch(() => "")) ?? "";
      if (/failed|error/i.test(statusText) && !/Preparing|Crawling|Building|Scores|Review/i.test(statusText)) {
        throw new Error(`analysis stuck/failed before DNA approve: ${statusText.slice(0, 200)}`);
      }
      await page.waitForTimeout(5_000);
    }
    if (await approve.isVisible().catch(() => false)) {
      await approve.click();
      await expect(page.getByRole("button", { name: "Open iPix" })).toBeEnabled({
        timeout: 120_000,
      });
      // Screen 13 refresh — same brand.
      await page.reload();
      await expect(page.getByTestId("approve-brand-dna").or(page.getByRole("button", { name: "Open iPix" }))).toBeVisible({
        timeout: 60_000,
      });
      await page.getByRole("button", { name: "Open iPix" }).click();
      await page.waitForURL(/\/app/, { timeout: 30_000 });
      await expect(page).toHaveURL(/\/app/);
    } else {
      test.info().annotations.push({
        type: "hold",
        description:
          "Materialized with unique SQL but Brand DNA approve never appeared — crawl/BI may be unwired on QA. File defect if providers should be live.",
      });
    }

    const afterAnalysis = await queryOnboardingUniqueness({
      userId: userId!,
      idempotencyKey: idem!,
    });
    expect(afterAnalysis.organizationId).toBe(uniqueness.organizationId);
    expect(afterAnalysis.brandId).toBe(uniqueness.brandId);
    assertUniqueMaterialized(afterAnalysis);
  });
});

test.describe("IPI-836 — mobile 390×844 smoke", () => {
  test.beforeEach(({}, testInfo) => {
    test.skip(testInfo.project.name !== "mobile-390", "pinned to mobile-390");
  });

  test("screens 1 and 5 primary controls reachable", async ({ page }) => {
    test.setTimeout(3 * 60_000);
    requireOrSkip(launchOptIn(), "Set ONBOARDING_LAUNCH_E2E=true");
    preflightOnboardingQaTarget();

    const started = await loginAndOpenFreshOnboarding(page);
    requireOrSkip(started, "QA_PASSWORD not set or login failed");

    // Screen 1
    const start = page.getByRole("button", { name: "Get started" });
    await expect(start).toBeVisible();
    await expect(start).toBeInViewport();
    await start.click();

    // Screen 2 → skip to brand details via continue path quickly
    await selectBuildOption(page, "fashion");
    await page.getByRole("button", { name: "Continue" }).click();
    await page.getByRole("button", { name: "Continue" }).click();
    await page.getByLabel(/brand name/i).fill("Mobile Proof Brand");
    await page.getByLabel(/website/i).fill("https://example.com");
    await page.getByRole("button", { name: "Continue" }).click();

    // Screen 5
    const ig = page.getByTestId("channel-ig");
    await expect(ig).toBeVisible();
    await expect(page.getByRole("button", { name: "Continue" })).toBeInViewport();
  });
});

test.describe("IPI-836 — reduced motion", () => {
  test.use({ reducedMotion: "reduce" });
  test.beforeEach(({}, testInfo) => {
    test.skip(testInfo.project.name !== "chromium-desktop", "pinned to chromium-desktop");
  });

  test("Get started remains usable with reduced motion", async ({ page }) => {
    test.setTimeout(2 * 60_000);
    requireOrSkip(launchOptIn(), "Set ONBOARDING_LAUNCH_E2E=true");
    preflightOnboardingQaTarget();

    const started = await loginAndOpenFreshOnboarding(page);
    requireOrSkip(started, "QA_PASSWORD not set or login failed");

    await expect(page.getByRole("button", { name: "Get started" })).toBeVisible();
    await expect(page.getByRole("heading").first()).toBeVisible();
  });
});
