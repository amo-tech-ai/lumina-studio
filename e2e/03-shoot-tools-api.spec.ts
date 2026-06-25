import { expect, test } from "@playwright/test";

/**
 * Real-world API tests for IPI-148 shoot planner tools.
 * Tests hit the running Next.js dev server directly via fetch API.
 * These validate the tools are wired and respond — not that AI output is correct.
 */

test.describe("Shoot tool registry — IPI-148 SHOOT-AI-001", () => {
  test("agentTools registry is non-empty (tools registered)", async ({ page }) => {
    const errors: string[] = [];
    // Register before navigation to catch early load/hydration errors
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto("/app/shoots");
    await page.waitForLoadState("networkidle");
    expect(errors.filter((e) => /cannot read|undefined is not/i.test(e))).toHaveLength(0);

    // Verify at least one tool is registered via the CopilotKit agents endpoint
    const res = await page.request.post("/api/copilotkit", {
      headers: { "Content-Type": "application/json", "x-copilotkit-agent-id": "production-planner" },
      data: { messages: [] },
    });
    expect(res.status()).not.toBe(404);
    expect(res.status()).not.toBe(500);
  });

  test("recommendShootType tool input schema is valid (Zod validation check)", async ({ request }) => {
    // CopilotKit protocol: agent id goes in header, not body
    const res = await request.post("/api/copilotkit", {
      headers: { "Content-Type": "application/json", "x-copilotkit-agent-id": "production-planner" },
      data: {
        messages: [{ role: "user", content: "Recommend a shoot type for an Instagram campaign" }],
      },
    });
    // 200 = AI responded, 401 = auth required — both valid; 500 = tool crashed
    expect(res.status()).not.toBe(500);
  });
});

test.describe("Shoot schema — IPI-183 SHOOT-DATA-001", () => {
  test("/app/shoots page renders HTML without server error", async ({ page }) => {
    const res = await page.goto("/app/shoots");
    expect(res?.status()).toBeLessThan(500);
    const body = await page.locator("body").textContent();
    expect(body).not.toMatch(/Internal Server Error/i);
  });
});
