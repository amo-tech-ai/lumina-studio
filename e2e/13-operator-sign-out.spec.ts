import { expect, test } from "@playwright/test";
import { loginOperatorIfConfigured } from "./helpers/mobile-audit";

/**
 * IPI-725 · AUTH-UI-001 — Operator Sign Out control.
 *
 * Requires (local optional; CI/preview required when REQUIRE_OPERATOR_SIGNOUT_E2E=true):
 * - QA_PASSWORD (app/.env.local)
 * - OPERATOR_AUTH_ENABLED=true on the Next server (so /info → 401 and /app gate
 *   match Cloudflare preview). Playwright webServer inherits process env.
 *
 * Preview / gate command:
 *   REQUIRE_OPERATOR_SIGNOUT_E2E=true OPERATOR_AUTH_ENABLED=true \
 *     npx playwright test e2e/13-operator-sign-out.spec.ts --project=chromium-desktop
 */
function requireOrSkip(condition: boolean, reason: string) {
  if (condition) return;
  if (process.env.REQUIRE_OPERATOR_SIGNOUT_E2E === "true") {
    throw new Error(`Required sign-out e2e missing config: ${reason}`);
  }
  test.skip(true, reason);
}

test.describe("IPI-725 — Operator Sign Out", () => {
  test("login → Sign out → login redirect, info 401, /app gated", async ({ page }) => {
    requireOrSkip(
      process.env.OPERATOR_AUTH_ENABLED === "true",
      "Set OPERATOR_AUTH_ENABLED=true for this test (matches preview auth gate)",
    );

    const loggedIn = await loginOperatorIfConfigured(page);
    requireOrSkip(loggedIn, "QA_PASSWORD not set");

    const consoleErrors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") consoleErrors.push(msg.text());
    });

    const signOut = page.getByRole("button", { name: "Sign out" });
    await expect(signOut).toBeVisible();
    await expect(signOut).toBeEnabled();
    await Promise.all([
      page.waitForURL(/\/login/, { timeout: 20_000 }),
      signOut.click(),
    ]);

    const authCookies = (await page.context().cookies()).filter(
      (c) => c.name.includes("auth-token") || c.name.startsWith("sb-"),
    );
    const liveAuth = authCookies.filter((c) => c.value && c.value.length > 10);
    expect(liveAuth, "Supabase auth cookies should be cleared").toEqual([]);

    const infoStatus = await page.evaluate(async () => {
      const r = await fetch("/api/copilotkit/info", {
        credentials: "include",
        headers: { Accept: "application/json" },
      });
      return r.status;
    });
    expect(infoStatus).toBe(401);

    await page.goto("/app");
    await expect(page).toHaveURL(/\/login/, { timeout: 15_000 });

    // Ignore CopilotKit runtime_info noise during the logout navigation race;
    // fail only on hydration / uncaught exceptions.
    const blocking = consoleErrors.filter(
      (t) =>
        /hydration|Uncaught|TypeError|ReferenceError/i.test(t) &&
        !/runtime_info_fetch_failed|Failed to fetch/i.test(t),
    );
    expect(blocking).toEqual([]);
  });
});
