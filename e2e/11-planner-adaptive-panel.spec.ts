import { expect, test, type Page } from "@playwright/test";
import { loginOperatorIfConfigured } from "./helpers/mobile-audit";

/**
 * IPI-551 · PLN-S4b — Adaptive Context Panel (Intelligence ⇄ Detail) route
 * coverage. Requires dev server on :3002. Set QA_PASSWORD for authenticated
 * routes.
 *
 * No click handler ships in this ticket (see adaptive-panel.tsx's own
 * header comment) — every scenario below drives the panel via direct/
 * programmatic `?selection=` URL navigation, exactly like 07-planner-
 * routes.spec.ts already does for the bare Workspace/Settings routes.
 *
 * Same "no unauthorized live writes" constraint as 07-planner-routes.spec.ts:
 * production has 0 rows in planner.instances as of this PR, so happy-path
 * task/member Detail assertions are gated on env vars pointing at a real,
 * already-seeded fixture rather than inserting one here:
 *   QA_PLANNER_INSTANCE_ID — an instance id the qa@ipix.test org can read
 *   QA_PLANNER_TASK_ID     — a task id belonging to that instance
 *   QA_PLANNER_MEMBER_ID   — a planner.assignments row id on that instance
 * Fail-closed/fallback scenarios only need QA_PLANNER_INSTANCE_ID — a
 * syntactically-valid-but-nonexistent uuid resolves to "not found" against
 * any real instance without needing a seeded task/member row.
 */
const FIXTURE_INSTANCE_ID = process.env.QA_PLANNER_INSTANCE_ID;
const FIXTURE_TASK_ID = process.env.QA_PLANNER_TASK_ID;
const FIXTURE_MEMBER_ID = process.env.QA_PLANNER_MEMBER_ID;
const NONEXISTENT_UUID = "00000000-0000-0000-0000-000000000000";

const TASK_DETAIL = '[data-testid="planner-detail-task"]';
const MEMBER_DETAIL = '[data-testid="planner-detail-member"]';
const INTELLIGENCE_PANEL = '[data-testid="intelligence-panel"]';

// operator-shell.module.css:107-114 — the IntelligencePanel column is
// `display: none` entirely below 1024px (pre-existing, repo-wide; real
// mobile shell redesign is MOB-01/02/04, not this ticket). Detail-visibility
// assertions are meaningless on those viewports — the mechanism (URL state)
// is still checked, just not "is the panel showing it".
function panelColumnRendersAtThisViewport(page: Page): boolean {
  return (page.viewportSize()?.width ?? 0) > 1024;
}

function withSelection(path: string, selection: string): string {
  return `${path}?selection=${encodeURIComponent(selection)}`;
}

test.describe("Planner — adaptive context panel", () => {
  test.beforeEach(async ({ page }) => {
    const ok = await loginOperatorIfConfigured(page);
    test.skip(!ok, "QA_PASSWORD not set — skipping authenticated Planner routes");
    test.skip(!FIXTURE_INSTANCE_ID, "QA_PLANNER_INSTANCE_ID not set — no seeded fixture instance");
  });

  test("1. Valid task selection renders Detail in the shared panel (Workspace)", async ({ page }) => {
    test.skip(!FIXTURE_TASK_ID, "QA_PLANNER_TASK_ID not set");
    await page.goto(withSelection(`/app/planner/${FIXTURE_INSTANCE_ID}`, `task:${FIXTURE_TASK_ID}`));

    if (!panelColumnRendersAtThisViewport(page)) {
      // Mechanism still runs even though the column is hidden — assert the
      // URL round-trips instead of panel content.
      await expect(page).toHaveURL(new RegExp(`selection=task%3A${FIXTURE_TASK_ID}`));
      return;
    }

    await expect(page.locator(TASK_DETAIL)).toBeVisible();
    // Exactly one tree: the default Intelligence briefing prompt must not
    // also be present.
    await expect(page.getByText("Select a brand to view intelligence.")).toHaveCount(0);
  });

  test("2. Valid member selection renders Detail in the shared panel (Settings)", async ({ page }) => {
    test.skip(!FIXTURE_MEMBER_ID, "QA_PLANNER_MEMBER_ID not set");
    await page.goto(
      withSelection(`/app/planner/${FIXTURE_INSTANCE_ID}/settings`, `member:${FIXTURE_MEMBER_ID}`),
    );

    if (!panelColumnRendersAtThisViewport(page)) {
      await expect(page).toHaveURL(new RegExp(`selection=member%3A${FIXTURE_MEMBER_ID}`));
      return;
    }

    await expect(page.locator(MEMBER_DETAIL)).toBeVisible();
  });

  test("3. Escape returns to Intelligence and removes the selection param — but only when no nested overlay owns it", async ({
    page,
  }) => {
    test.skip(!FIXTURE_TASK_ID, "QA_PLANNER_TASK_ID not set");
    await page.goto(withSelection(`/app/planner/${FIXTURE_INSTANCE_ID}`, `task:${FIXTURE_TASK_ID}`));
    test.skip(!panelColumnRendersAtThisViewport(page), "panel column hidden below 1024px — not this ticket's scope");

    await expect(page.locator(TASK_DETAIL)).toBeVisible();
    await page.keyboard.press("Escape");

    await expect(page.locator(TASK_DETAIL)).toHaveCount(0);
    await expect(page).not.toHaveURL(/selection=/);
  });

  test("4. Browser Back/Forward restores the prior selection natively", async ({ page }) => {
    test.skip(!FIXTURE_TASK_ID, "QA_PLANNER_TASK_ID not set");
    test.skip(!panelColumnRendersAtThisViewport(page), "panel column hidden below 1024px — not this ticket's scope");

    await page.goto(`/app/planner/${FIXTURE_INSTANCE_ID}`);
    await page.goto(withSelection(`/app/planner/${FIXTURE_INSTANCE_ID}`, `task:${FIXTURE_TASK_ID}`));
    await expect(page.locator(TASK_DETAIL)).toBeVisible();

    await page.goBack();
    await expect(page.locator(TASK_DETAIL)).toHaveCount(0);

    await page.goForward();
    await expect(page.locator(TASK_DETAIL)).toBeVisible();
  });

  test("5. A refreshed page with a valid selection restores it", async ({ page }) => {
    test.skip(!FIXTURE_TASK_ID, "QA_PLANNER_TASK_ID not set");
    await page.goto(withSelection(`/app/planner/${FIXTURE_INSTANCE_ID}`, `task:${FIXTURE_TASK_ID}`));
    await page.reload();

    if (!panelColumnRendersAtThisViewport(page)) {
      await expect(page).toHaveURL(new RegExp(`selection=task%3A${FIXTURE_TASK_ID}`));
      return;
    }
    await expect(page.locator(TASK_DETAIL)).toBeVisible();
  });

  test("6. A syntactically valid but nonexistent selection fails safely into Intelligence mode, URL cleaned", async ({
    page,
  }) => {
    await page.goto(withSelection(`/app/planner/${FIXTURE_INSTANCE_ID}`, `task:${NONEXISTENT_UUID}`));

    await expect(page.locator(TASK_DETAIL)).toHaveCount(0);
    await expect(page.locator(MEMBER_DETAIL)).toHaveCount(0);
    await expect(page).not.toHaveURL(/selection=/);
    // Never the generic error boundary / a 5xx — this is a handled case.
    const res = await page.reload();
    expect(res?.status()).toBeLessThan(400);
  });

  test("7. An unparseable selection (unknown type / malformed uuid) never crashes the route", async ({
    page,
  }) => {
    for (const bad of ["bogus:not-a-uuid", "task:short", "phase:11111111-1111-1111-1111-111111111111"]) {
      const res = await page.goto(withSelection(`/app/planner/${FIXTURE_INSTANCE_ID}`, bad));
      expect(res?.status()).toBeLessThan(400);
      await expect(page.locator(TASK_DETAIL)).toHaveCount(0);
      await expect(page.locator(MEMBER_DETAIL)).toHaveCount(0);
      if (panelColumnRendersAtThisViewport(page)) {
        await expect(page.locator(INTELLIGENCE_PANEL)).toBeVisible();
      }
    }
  });

  test("8. `phase` selections never resolve — no per-instance phase contract exists yet (documented gap, not a bug)", async ({
    page,
  }) => {
    await page.goto(
      withSelection(`/app/planner/${FIXTURE_INSTANCE_ID}`, `phase:${NONEXISTENT_UUID}`),
    );
    await expect(page.locator(TASK_DETAIL)).toHaveCount(0);
    await expect(page.locator(MEMBER_DETAIL)).toHaveCount(0);
    await expect(page).not.toHaveURL(/selection=/);
  });

  test("9. A nested dialog's own Escape does not also deselect the entity behind it", async ({ page }) => {
    test.skip(!FIXTURE_MEMBER_ID, "QA_PLANNER_MEMBER_ID not set");
    test.skip(!panelColumnRendersAtThisViewport(page), "panel column hidden below 1024px — not this ticket's scope");

    await page.goto(
      withSelection(`/app/planner/${FIXTURE_INSTANCE_ID}/settings`, `member:${FIXTURE_MEMBER_ID}`),
    );
    await expect(page.locator(MEMBER_DETAIL)).toBeVisible();

    const inviteButton = page.getByRole("button", { name: /add member/i });
    const canOpenDialog = (await inviteButton.count()) > 0 && (await inviteButton.isVisible());
    test.skip(!canOpenDialog, "qa@ipix.test is not owner/manager on this fixture instance — Invite control not rendered");

    await inviteButton.click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();

    await page.keyboard.press("Escape");

    // Dialog owns Escape: it closes, but the selection/Detail behind it survives.
    await expect(dialog).toHaveCount(0);
    await expect(page.locator(MEMBER_DETAIL)).toBeVisible();
    await expect(page).toHaveURL(new RegExp(`selection=member%3A${FIXTURE_MEMBER_ID}`));
  });

  test("10. Mobile/tablet: selection mechanism doesn't error even though the panel column is hidden (pre-existing, not an IPI-551 regression)", async ({
    page,
  }) => {
    test.skip(panelColumnRendersAtThisViewport(page), "desktop viewport — covered by tests 1-9");
    test.skip(!FIXTURE_TASK_ID, "QA_PLANNER_TASK_ID not set");

    const res = await page.goto(
      withSelection(`/app/planner/${FIXTURE_INSTANCE_ID}`, `task:${FIXTURE_TASK_ID}`),
    );
    expect(res?.status()).toBeLessThan(400);
    await expect(page.locator(TASK_DETAIL)).toHaveCount(0); // column not rendered at all
    const overflow = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }));
    expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.clientWidth + 1);
  });
});
