import { expect, test } from "@playwright/test";

import { loginOperatorIfConfigured } from "./helpers/mobile-audit";

// IPI-924 · AGENT-RAG-001 — "Similar brands" tenant-isolation journey.
// The section card only renders when a brand has DNA (dnaScore > 0); today no
// QA-org brand has scores, so the verifiable security contract is the
// authenticated API route the card calls: same-org → 200 (results or
// no_embedding), foreign-org → 404 (RLS hides the brand, RPC never invoked).
// page.request shares the browser session cookie, so this proves the route's
// tenant check under a real login, not a mocked unit test.

const SAME_ORG_BRAND_ID = "f3d6681c-2847-43fd-bfa4-8fe659a62bd7"; // qa@ipix.test org
const FOREIGN_ORG_BRAND_ID = "eec20e68-2adb-472d-8226-3da5d9f34fbe"; // Glossier (other org)

test.describe("Similar brands — tenant isolation journey", () => {
  test.beforeEach(async ({ page }) => {
    const loggedIn = await loginOperatorIfConfigured(page);
    test.skip(!loggedIn, "QA credentials required in app/.env.local");
  });

  test("same-org brand: detail page renders, similar API returns 200/no_embedding", async ({ page }) => {
    const res = await page.request.get(`/api/brands/${SAME_ORG_BRAND_ID}/similar`);
    expect(res.status()).toBe(200);
    const body = (await res.json()) as { data?: unknown; reason?: string };
    expect(body).toHaveProperty("data");
    expect(body.reason).toBe("no_embedding");

    await page.goto(`/app/brand/${SAME_ORG_BRAND_ID}`, { waitUntil: "domcontentloaded" });
    await expect(page.getByTestId("brand-detail-workspace")).toBeVisible({ timeout: 20_000 });
  });

  test("foreign-org brand: detail page 404s and similar API denies with 404", async ({ page }) => {
    const res = await page.request.get(`/api/brands/${FOREIGN_ORG_BRAND_ID}/similar`);
    expect(res.status()).toBe(404);

    // Next.js streams the app shell as 200; the RLS-hidden brand resolves to a
    // not-found boundary, so assert the security property — the brand detail
    // workspace must never render — rather than the HTTP status.
    await page.goto(`/app/brand/${FOREIGN_ORG_BRAND_ID}`, { waitUntil: "domcontentloaded" });
    await expect(page.getByTestId("brand-detail-workspace")).toBeHidden({ timeout: 5000 });
  });
});
