import { createClient } from "@supabase/supabase-js";
import { expect, test } from "@playwright/test";

import {
  createCloudinaryQaFixture,
  loadCloudinaryQaEnv,
  type CloudinaryQaFixture,
} from "./helpers/cloudinary-qa-fixture";
import { loginOperatorIfConfigured } from "./helpers/mobile-audit";

/**
 * IPI-512 · CLD-QA-001 — Disposable Cloudinary fixture through /app/assets.
 *
 * Reuses verify-cloudinary-pipeline create + cleanup (synthetic webhook).
 * Runs the full lifecycle twice. Chromium desktop only.
 */
test.describe("IPI-512 — Cloudinary assets fixture lifecycle", () => {
  test.describe.configure({ mode: "serial" });

  test.beforeAll(() => {
    loadCloudinaryQaEnv();
  });

  for (const cycle of [1, 2] as const) {
    test(`create → /app/assets assert → cleanup (cycle ${cycle})`, async ({ page }, testInfo) => {
      test.skip(testInfo.project.name !== "chromium-desktop", "desktop-only proof");
      test.setTimeout(180_000);

      const loggedIn = await loginOperatorIfConfigured(page);
      test.skip(!loggedIn, "QA_PASSWORD required in app/.env.local");

      let fixture: CloudinaryQaFixture | undefined;
      try {
        fixture = await createCloudinaryQaFixture();

        const admin = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!,
          { auth: { persistSession: false } },
        );

        const { data: assetRow, error: assetErr } = await admin
          .from("assets")
          .select("id, brand_id, cloudinary_public_id")
          .eq("id", fixture.assetId)
          .maybeSingle();
        expect(assetErr).toBeNull();
        expect(assetRow?.id).toBe(fixture.assetId);
        expect(assetRow?.brand_id).toBe(fixture.brandId);
        expect(assetRow?.cloudinary_public_id).toBe(fixture.publicId);

        const { data: cldRow, error: cldErr } = await admin
          .from("cloudinary_assets")
          .select("public_id, status, brand_id, asset_id")
          .eq("public_id", fixture.publicId)
          .maybeSingle();
        expect(cldErr).toBeNull();
        expect(cldRow?.public_id).toBe(fixture.publicId);
        expect(cldRow?.status).toBe("ready");
        expect(cldRow?.brand_id).toBe(fixture.brandId);
        expect(cldRow?.asset_id).toBe(fixture.assetId);

        // Production query/RLS path: authenticated Assets page → listAssets.
        const imageOk = { seen: false };
        page.on("response", (res) => {
          const ct = res.headers()["content-type"] ?? "";
          const url = res.url();
          if (
            res.status() === 200 &&
            (ct.startsWith("image/") ||
              (url.includes("/_next/image") && ct.startsWith("image/")) ||
              (url.includes("res.cloudinary.com") && ct.startsWith("image/")))
          ) {
            imageOk.seen = true;
          }
        });

        await page.goto("/app/assets", { waitUntil: "domcontentloaded" });
        const card = page.locator(
          `[data-testid="asset-card"][data-asset-id="${fixture.assetId}"]`,
        );
        await expect(card).toBeVisible({ timeout: 30_000 });

        const img = card.locator("img").first();
        await expect(img).toBeVisible({ timeout: 15_000 });
        await expect.poll(() => imageOk.seen, { timeout: 30_000 }).toBe(true);

        const src = (await img.getAttribute("src")) ?? "";
        const decoded = decodeURIComponent(src);
        expect(
          decoded.includes(fixture.publicId) ||
            src.includes(encodeURIComponent(fixture.publicId)),
        ).toBe(true);
      } finally {
        if (fixture) {
          const summary = await fixture.cleanup();
          expect(
            summary.cloudinary === "ok" ||
              summary.cloudinary === "not found" ||
              summary.cloudinary === "skipped",
          ).toBeTruthy();
          expect(
            summary.assets === "ok" ||
              summary.assets === "ok-fallback" ||
              summary.assets === "skipped",
          ).toBeTruthy();
          const admin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!,
            { auth: { persistSession: false } },
          );
          const { data: gone } = await admin
            .from("assets")
            .select("id")
            .eq("id", fixture.assetId)
            .maybeSingle();
          expect(gone).toBeNull();
        }
      }
    });
  }
});
