import { expect, test } from "@playwright/test";

import { loginOperatorIfConfigured } from "./helpers/mobile-audit";

const DC_URL = "http://localhost:8765/Command%20Center.v2.image-first.dc.html";

test.describe("Intelligence Panel DC verify", () => {
  test("React /app panel matches DC populated structure", async ({ page }) => {
    const loggedIn = await loginOperatorIfConfigured(page);
    test.skip(!loggedIn, "QA credentials required");

    await page.goto("/app", { waitUntil: "domcontentloaded" });
    await expect(page.getByTestId("intelligence-panel")).toBeVisible({ timeout: 20_000 });

    const panel = page.getByTestId("intelligence-panel");
    await expect(panel.getByText("DNA Score")).toBeVisible();
    await expect(panel.getByRole("heading", { name: "Approvals" })).toBeVisible();
    await expect(panel.getByRole("button", { name: "Approve" }).first()).toBeVisible();
    await expect(panel.getByRole("button", { name: "Edit" }).first()).toBeVisible();
    await expect(panel.getByRole("tab", { name: /Overview/i })).toBeVisible();
    await expect(panel.getByRole("tab", { name: /Approvals/i })).toBeVisible();
    await expect(panel.getByRole("tab", { name: /Activity/i })).toBeVisible();
  });

  test("DC reference panel has approvals + DNA structure", async ({ page }) => {
    await page.goto(DC_URL, { waitUntil: "domcontentloaded" });
    await expect(page.getByText("DNA Score")).toBeVisible();
    const panel = page.getByRole("complementary");
    await expect(panel.getByText("Approvals", { exact: true }).first()).toBeVisible();
    await expect(panel.getByRole("button", { name: "Approve" }).first()).toBeVisible();
  });
});
