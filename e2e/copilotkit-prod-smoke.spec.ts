import { expect, test } from "@playwright/test";
import { getQaCredentials, loadEnvLocal } from "./helpers/qa-credentials";

const PROD_BASE = process.env.IPIX_PROD_BASE_URL?.replace(/\/$/, "") ?? "https://www.ipix.co";

test.describe("CopilotKit production smoke (IPI-670 · COPILOT-RUNTIME-001)", () => {
  test.beforeAll(() => {
    loadEnvLocal();
  });

  test("authenticated /app/assets: /info 200, creative-director, no copilotkit 500s", async ({
    page,
  }) => {
    const { email, password } = getQaCredentials();
    test.skip(!password, "Set QA_PASSWORD in .env.local to run production smoke");

    const consoleErrors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") consoleErrors.push(msg.text());
    });

    const failedRequests: { url: string; status: number }[] = [];
    page.on("response", (response) => {
      const url = response.url();
      if (url.includes("/api/copilotkit") && response.status() >= 500) {
        failedRequests.push({ url, status: response.status() });
      }
    });

    await page.goto(`${PROD_BASE}/login`);
    await page.fill('input[name="email"]', email);
    await page.fill('input[name="password"]', password);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/app/, { timeout: 30_000 });

    await page.goto(`${PROD_BASE}/app/assets`);
    await page.waitForLoadState("networkidle");

    const infoResponse = await page.waitForResponse(
      (res) => res.url().includes("/api/copilotkit/info") && res.request().method() === "GET",
      { timeout: 30_000 },
    );
    expect(infoResponse.status()).toBe(200);
    expect(infoResponse.headers()["content-type"] ?? "").toMatch(/json/i);

    const infoBody = (await infoResponse.json()) as { agents?: Record<string, unknown> };
    expect(infoBody.agents?.["creative-director"]).toBeDefined();

    expect(failedRequests).toEqual([]);
    expect(
      consoleErrors.filter(
        (line) =>
          /copilotkit|runtime_info_fetch_failed|agent.*not found/i.test(line) &&
          !/favicon/i.test(line),
      ),
    ).toEqual([]);

    await page.screenshot({
      path: "test-results/copilotkit-prod-assets.png",
      fullPage: false,
    });
  });
});
