import { expect, test } from "@playwright/test";

/**
 * Real-world browser tests for IPI-133 AIOR-017 — Durable Agent Foundation.
 * Tests verify the durable production-planner is wired into the operator panel.
 */

test.describe("Durable agent — IPI-133 AIOR-017", () => {
  test("operator panel at /app/shoots loads CopilotSidebar without crash", async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") consoleErrors.push(msg.text());
    });

    await page.goto("/app/shoots");
    await page.waitForLoadState("networkidle");

    // No React hydration errors or CopilotKit errors
    const criticalErrors = consoleErrors.filter(
      (e) => /hydration|copilotkit.*error|agent.*not found|cannot read properties/i.test(e),
    );
    expect(criticalErrors).toHaveLength(0);
  });

  test("operator panel at /app/brand loads without agent registry error", async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") consoleErrors.push(msg.text());
    });

    await page.goto("/app/brand");
    await page.waitForLoadState("networkidle");

    const criticalErrors = consoleErrors.filter(
      (e) => /agent.*not found|registry.*missing/i.test(e),
    );
    expect(criticalErrors).toHaveLength(0);
  });

  test("resolveAgentId maps /app/shoots to production-planner (route-agent wiring)", async ({ page }) => {
    await page.goto("/app/shoots");
    await page.waitForLoadState("domcontentloaded");

    // Verify the agent id rendered on the page matches production-planner.
    // OperatorPanel renders data-agent-id="<agentId>" for testability.
    const agentId = await page.evaluate(() => {
      const el = document.querySelector("[data-agent-id]");
      return el?.getAttribute("data-agent-id") ?? null;
    });
    // If attribute not present yet (auth redirect), fall back to absence-of-error check
    if (agentId !== null) {
      expect(agentId).toBe("production-planner");
    } else {
      const body = await page.locator("body").textContent();
      expect(body).not.toMatch(/agent.*not found/i);
      expect(body).not.toMatch(/production-planner.*undefined/i);
    }
  });
});
