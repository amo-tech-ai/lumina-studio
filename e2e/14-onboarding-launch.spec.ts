import { expect, test } from "@playwright/test";

import {
  advanceToAnalysis,
  fillQuestionnaireThroughGrowth,
  loginAndOpenFreshOnboarding,
  loginAndResumeDraftReady,
  readAuthUserId,
  readIdempotencyKey,
} from "./helpers/onboarding-flow";
import {
  assertTenantIsolation,
  assertUniqueMaterialized,
  cleanupFreshCrawlRows,
  findDraftReadyOnboardingSession,
  formatOnboardingProgress,
  queryOnboardingUniqueness,
  resetBrandToDraftReady,
  snapshotOnboardingProgress,
  type DraftReadySession,
} from "./helpers/onboarding-sql";
import {
  loadEnvLocalFiles,
  preflightOnboardingQaTarget,
  PROD_PROJECT_REF,
  QA_PROJECT_REF,
} from "./helpers/qa-target";

/**
 * IPI-836 · ONB2-VERIFY-001 — onboarding launch proof on QA.
 *
 * Fast path: resume existing draft_ready for DNA / approve / Hub / mobile / motion.
 * Slow path (last): one fresh-user journey that pays for Firecrawl + BI.
 *
 *   node scripts/run-onboarding-launch-e2e.mjs
 */
function launchOptIn(): boolean {
  return process.env.ONBOARDING_LAUNCH_E2E === "true";
}

function requireOrSkip(condition: boolean, reason: string) {
  if (condition) return;
  if (launchOptIn() || process.env.REQUIRE_ONBOARDING_LAUNCH_E2E === "true") {
    throw new Error(`Required onboarding launch e2e missing config: ${reason}`);
  }
  test.skip(true, reason);
}

async function requireDraftReady(): Promise<DraftReadySession> {
  preflightOnboardingQaTarget();
  const session = await findDraftReadyOnboardingSession();
  requireOrSkip(Boolean(session), "No QA draft_ready materialized session to resume");
  return session!;
}

function logProgress(label: string, text: string) {
  console.log(`\n[IPI-836 ${label}]\n${text}\n`);
}

test.describe("IPI-836 — preflight", () => {
  test.beforeEach(({}, testInfo) => {
    test.skip(testInfo.project.name !== "chromium-desktop", "pinned to chromium-desktop");
  });

  test("preflight refuses production targets", async () => {
    requireOrSkip(launchOptIn(), "Set ONBOARDING_LAUNCH_E2E=true");
    loadEnvLocalFiles();
    expect(() => preflightOnboardingQaTarget()).not.toThrow();
    expect(process.env.QA_DATABASE_URL).toContain(QA_PROJECT_REF);
    expect(process.env.QA_DATABASE_URL).not.toContain(PROD_PROJECT_REF);
  });
});

test.describe("IPI-836 — resume from DNA (no new crawl)", () => {
  test.beforeEach(({}, testInfo) => {
    test.skip(testInfo.project.name !== "chromium-desktop", "pinned to chromium-desktop");
  });

  test("DNA render + ID continuity from draft_ready", async ({ page }) => {
    test.setTimeout(3 * 60_000);
    const startedAt = Date.now();
    requireOrSkip(launchOptIn(), "Set ONBOARDING_LAUNCH_E2E=true");
    const draft = await requireDraftReady();

    const progress = await snapshotOnboardingProgress({
      brandId: draft.brandId,
      session: "resumed",
    });
    logProgress("DNA render", formatOnboardingProgress(progress));
    expect(progress.brandIntelligence).toBe("draft_ready");
    expect(progress.crawl).toBe("completed");
    expect(draft.crawls).toBe(1);

    const started = await loginAndResumeDraftReady(page, draft);
    requireOrSkip(started, "QA_PASSWORD not set or login failed");

    await expect(page.getByTestId("approve-brand-dna")).toBeVisible({ timeout: 30_000 });
    await expect(page.getByText(/Step\s+13\s*\/\s*13/i)).toBeVisible({ timeout: 15_000 });

    const userId = await readAuthUserId(page);
    const idem = await readIdempotencyKey(page);
    expect(userId).toBe(draft.userId);
    expect(idem).toBe(draft.idempotencyKey);

    const uniqueness = await queryOnboardingUniqueness({
      userId: draft.userId,
      idempotencyKey: draft.idempotencyKey,
    });
    assertUniqueMaterialized(uniqueness);
    expect(uniqueness.organizationId).toBe(draft.organizationId);
    expect(uniqueness.brandId).toBe(draft.brandId);
    expect(uniqueness.crawls).toBe(1);
    expect(["draft_ready", "scores_complete"]).toContain(uniqueness.intakeStatus);

    console.log(`[IPI-836 timing] DNA render ${Date.now() - startedAt}ms (existing)`);
  });

  test("approval idempotency + ready + Brand Hub", async ({ page }) => {
    test.setTimeout(5 * 60_000);
    const startedAt = Date.now();
    requireOrSkip(launchOptIn(), "Set ONBOARDING_LAUNCH_E2E=true");
    const draft = await requireDraftReady();

    logProgress(
      "approve",
      formatOnboardingProgress(
        await snapshotOnboardingProgress({ brandId: draft.brandId, session: "resumed" }),
      ),
    );

    const started = await loginAndResumeDraftReady(page, draft);
    requireOrSkip(started, "QA_PASSWORD not set or login failed");

    try {
      const approve = page.getByTestId("approve-brand-dna");
      await expect(approve).toBeVisible({ timeout: 30_000 });

      await approve.click();

      // Server returns ok only after promote → ready; card + footer must unlock.
      await expect(page.getByRole("heading", { name: /Brand DNA is ready/i })).toBeVisible({
        timeout: 120_000,
      });
      await expect(page.getByText("Brand DNA approved")).toBeVisible({ timeout: 30_000 });
      const openApp = page.getByRole("button", { name: "Open iPix" });
      await expect(openApp).toBeEnabled({ timeout: 60_000 });

      await expect
        .poll(
          async () => {
            const u = await queryOnboardingUniqueness({
              userId: draft.userId,
              idempotencyKey: draft.idempotencyKey,
            });
            return u.intakeStatus;
          },
          { timeout: 2 * 60_000, intervals: [1000, 2000, 5000] },
        )
        .toBe("ready");

      const after = await queryOnboardingUniqueness({
        userId: draft.userId,
        idempotencyKey: draft.idempotencyKey,
      });
      assertUniqueMaterialized(after);
      expect(after.crawls, "approval must not start a second crawl").toBe(1);
      expect(after.brandId).toBe(draft.brandId);
      expect(after.organizationId).toBe(draft.organizationId);

      await assertTenantIsolation({
        userId: draft.userId,
        organizationId: draft.organizationId,
        brandId: draft.brandId,
        idempotencyKey: draft.idempotencyKey,
      });

      await openApp.click();
      await page.waitForURL(/\/app/, { timeout: 30_000 });
      await page.reload();
      await expect(page).toHaveURL(/\/app/);
      // Brand Hub — brand name or ready chip when present.
      if (draft.brandName) {
        await expect(page.getByText(draft.brandName, { exact: false }).first()).toBeVisible({
          timeout: 30_000,
        });
      }
    } finally {
      // Snapshot the real post-approval state BEFORE the fixture reset, so the
      // evidence reflects the ready state this test just proved. A snapshot
      // failure (transient PG blip) must not skip the reset — evidence is
      // best-effort, fixture reuse is not (Devin cycle-3 BUG).
      const approved = await snapshotOnboardingProgress({
        brandId: draft.brandId,
        session: "resumed",
      }).catch(() => null);
      // Restore brand to draft_ready even if assertions fail, so the fixture
      // can be reused by subsequent runs. Cleanup failure must never mask the
      // original test error — catch and log separately (Devin cycle-3 BUG).
      await resetBrandToDraftReady(draft.brandId).catch((e) => {
        console.error("[IPI-836 cleanup] failed to reset brand to draft_ready:", e);
        // Attach to Playwright report so the cause travels with the run.
        void test.info().attach("fixture-reset-failure", {
          body: `Failed to reset brand ${draft.brandId} to draft_ready: ${e instanceof Error ? e.message : String(e)}`,
          contentType: "text/plain",
        });
      });
      if (approved) {
        logProgress("post-approve", formatOnboardingProgress(approved));
      }
    }

    console.log(`[IPI-836 timing] Approve+Hub ${Date.now() - startedAt}ms (existing)`);
  });
});

test.describe("IPI-836 — mobile 390×844 smoke (resume DNA)", () => {
  test.beforeEach(({}, testInfo) => {
    test.skip(testInfo.project.name !== "mobile-390", "pinned to mobile-390");
  });

  test("screen 13 primary controls reachable from draft_ready", async ({ page }) => {
    test.setTimeout(3 * 60_000);
    const startedAt = Date.now();
    requireOrSkip(launchOptIn(), "Set ONBOARDING_LAUNCH_E2E=true");
    const draft = await requireDraftReady();
    const started = await loginAndResumeDraftReady(page, draft);
    requireOrSkip(started, "QA_PASSWORD not set or login failed");

    const approve = page.getByTestId("approve-brand-dna");
    const openApp = page.getByRole("button", { name: "Open iPix" });
    const cta = approve.or(openApp);
    await expect(cta.first()).toBeVisible({ timeout: 60_000 });
    await expect(cta.first()).toBeInViewport();
    console.log(`[IPI-836 timing] Mobile DNA ${Date.now() - startedAt}ms (existing)`);
  });
});

test.describe("IPI-836 — reduced motion (resume DNA)", () => {
  test.use({ reducedMotion: "reduce" });
  test.beforeEach(({}, testInfo) => {
    test.skip(testInfo.project.name !== "chromium-desktop", "pinned to chromium-desktop");
  });

  test("DNA approve remains usable with reduced motion", async ({ page }) => {
    test.setTimeout(3 * 60_000);
    const startedAt = Date.now();
    requireOrSkip(launchOptIn(), "Set ONBOARDING_LAUNCH_E2E=true");
    const draft = await requireDraftReady();
    const started = await loginAndResumeDraftReady(page, draft);
    requireOrSkip(started, "QA_PASSWORD not set or login failed");

    const primary = page
      .getByTestId("approve-brand-dna")
      .or(page.getByRole("button", { name: "Open iPix" }))
      .first();
    await expect(primary).toBeVisible({ timeout: 60_000 });
    await expect(primary).toBeEnabled({ timeout: 30_000 });
    await expect(page.getByRole("heading").first()).toBeVisible();
    console.log(`[IPI-836 timing] Reduced motion ${Date.now() - startedAt}ms (existing)`);
  });
});

test.describe("IPI-836 — fresh-user full crawl (only paid path)", () => {
  test.beforeEach(({}, testInfo) => {
    test.skip(testInfo.project.name !== "chromium-desktop", "pinned to chromium-desktop");
  });

  test("questionnaire → crawl → DNA → approve → Hub (new crawl)", async ({ page }) => {
    // Materialize ≤3m + DNA ≤8m + nav — production-like budget; only this test pays.
    test.setTimeout(18 * 60_000);
    const startedAt = Date.now();
    requireOrSkip(launchOptIn(), "Set ONBOARDING_LAUNCH_E2E=true");
    preflightOnboardingQaTarget();

    let userId: string | null = null;
    let idem: string | null = null;
    const brandName = `Aurelia ${Date.now()}`;
    const websiteUrl = "https://www.aesop.com";

    try {
      const started = await loginAndOpenFreshOnboarding(page);
      requireOrSkip(started, "QA_PASSWORD not set or login failed");

      userId = await readAuthUserId(page);
      idem = await readIdempotencyKey(page);
      expect(userId, "auth user id").toBeTruthy();
      expect(idem, "idempotency key").toBeTruthy();

      await fillQuestionnaireThroughGrowth(page, { brandName, websiteUrl });
      await page.reload();
      await expect(page.getByRole("heading").first()).toBeVisible({ timeout: 20_000 });
      await expect(page.getByText(/Step\s+\d+\s*\/\s*13/i)).toBeVisible({ timeout: 20_000 });

      await advanceToAnalysis(page, { brandName, websiteUrl });
      await expect(
        page.getByTestId("analysis-status").or(page.getByTestId("approve-brand-dna")).first(),
      ).toBeVisible({ timeout: 120_000 });

      await expect
        .poll(
          async () => {
            const u = await queryOnboardingUniqueness({
              userId: userId!,
              idempotencyKey: idem!,
            });
            return Boolean(u.organizationId && u.brandId);
          },
          { timeout: 3 * 60_000, intervals: [1000, 2000, 5000] },
        )
        .toBe(true);

      const uniqueness = await queryOnboardingUniqueness({
        userId: userId!,
        idempotencyKey: idem!,
      });
      assertUniqueMaterialized(uniqueness);
      logProgress(
        "fresh crawl",
        formatOnboardingProgress(
          await snapshotOnboardingProgress({
            brandId: uniqueness.brandId!,
            session: "created",
          }),
        ),
      );

      await assertTenantIsolation({
        userId: userId!,
        organizationId: uniqueness.organizationId!,
        brandId: uniqueness.brandId!,
        idempotencyKey: idem!,
      });

      const approve = page.getByTestId("approve-brand-dna");
      await expect(approve).toBeVisible({ timeout: 8 * 60_000 });
      await approve.click();
      await expect(page.getByRole("button", { name: "Open iPix" })).toBeEnabled({
        timeout: 120_000,
      });
      await page.getByRole("button", { name: "Open iPix" }).click();
      await page.waitForURL(/\/app/, { timeout: 30_000 });

      // After Approve + Open iPix navigation, the brand must be promoted to ready.
      // Accepting draft_ready/scores_complete here would let the test pass even if promotion never reached ready.
      const after = await queryOnboardingUniqueness({
        userId: userId!,
        idempotencyKey: idem!,
      });
      assertUniqueMaterialized(after);
      expect(after.crawls).toBe(1);
      expect(after.intakeStatus, "brand must be promoted to ready after approve + Hub nav").toBe("ready");
    } finally {
      // Clean up fresh-crawl rows so they don't contaminate findDraftReadyOnboardingSession
      // (which orders by updated_at desc) in subsequent runs.
      if (userId && idem) {
        await cleanupFreshCrawlRows({ userId, idempotencyKey: idem }).catch((e) => {
          console.error("[IPI-836 cleanup] failed to delete fresh-crawl rows:", e);
          void test.info().attach("fresh-crawl-cleanup-failure", {
            body: `Failed to delete rows for userId=${userId}, idem=${idem}: ${e instanceof Error ? e.message : String(e)}`,
            contentType: "text/plain",
          });
        });
      }
  });
});
