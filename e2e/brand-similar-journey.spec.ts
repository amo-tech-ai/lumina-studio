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
// Foreign brand is proven to exist and be owned by another org via an
// admin-verified fixture. The runner (brand-similar-evidence.mjs) requires
// FOREIGN_FIXTURE={id,org_id,name} at capture time and records it in
// tasks/platform/verify/ipi-924/metadata.json. The spec mirrors that contract:
// a bare 404 for an unproven UUID would be indistinguishable from "deleted".
// Default is the admin-verified fixture recorded in metadata.json.
const FOREIGN_FIXTURE = process.env.FOREIGN_FIXTURE ? JSON.parse(process.env.FOREIGN_FIXTURE) : null;
const FOREIGN_ORG_BRAND_ID = FOREIGN_FIXTURE?.id || "eec20e68-2adb-472d-8226-3da5d9f34fbe"; // Glossier (other org)

test.describe("Similar brands — tenant isolation journey", () => {
  test.beforeEach(async ({ page }) => {
    const loggedIn = await loginOperatorIfConfigured(page);
    test.skip(!loggedIn, "QA credentials required in app/.env.local");
  });

  test("same-org brand: detail page renders, similar API returns 200 with results or no_embedding", async ({ page }) => {
    const res = await page.request.get(`/api/brands/${SAME_ORG_BRAND_ID}/similar`);
    expect(res.status()).toBe(200);
    const body = (await res.json()) as { data?: unknown; reason?: string };
    // Stable contract: HTTP 200 and a data array. "no_embedding" is optional —
    // once the brand is embedded the route returns { data: [...] } without it.
    expect(Array.isArray(body.data)).toBe(true);
    if (body.reason !== undefined) {
      expect(body.reason).toBe("no_embedding");
    }

    await page.goto(`/app/brand/${SAME_ORG_BRAND_ID}`, { waitUntil: "domcontentloaded" });
    await expect(page.getByTestId("brand-detail-workspace")).toBeVisible({ timeout: 20_000 });
  });

  test("foreign-org brand: detail page 404s and similar API denies with 404", async ({ page }) => {
    const res = await page.request.get(`/api/brands/${FOREIGN_ORG_BRAND_ID}/similar`);
    expect(res.status()).toBe(404);

    // Next.js streams the app shell as 200; the RLS-hidden brand makes the
    // server page call notFound(), rendering the not-found boundary. Wait for
    // that positive settled signal (visible at every viewport) BEFORE asserting
    // the workspace is absent, so a regression that renders the workspace later
    // during hydration cannot pass by checking too early. The intelligence
    // panel's error copy is a secondary artifact and is CSS-hidden on narrow
    // viewports, so the boundary heading is the settle signal, not that text.
    await page.goto(`/app/brand/${FOREIGN_ORG_BRAND_ID}`, { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: "Page Not Found" })).toBeVisible({ timeout: 45_000 });
    await expect(page.getByTestId("brand-detail-workspace")).toBeHidden();
  });
});
