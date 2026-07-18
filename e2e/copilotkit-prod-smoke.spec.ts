import { expect, test } from "@playwright/test";
import { getQaCredentials, loadEnvLocal } from "./helpers/qa-credentials";

let prodBase = "https://www.ipix.co";

test.describe("CopilotKit production smoke (IPI-670 · COPILOT-RUNTIME-001)", () => {
  test.beforeAll(() => {
    loadEnvLocal();
    prodBase = process.env.IPIX_PROD_BASE_URL?.replace(/\/$/, "") ?? "https://www.ipix.co";
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

    await page.goto(`${prodBase}/login`);
    await page.fill('input[name="email"]', email);
    await page.fill('input[name="password"]', password);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/app/, { timeout: 30_000 });

    await page.goto(`${prodBase}/app/assets`);
    await page.waitForLoadState("domcontentloaded");

    const infoProbe = await page.evaluate(async () => {
      const res = await fetch("/api/copilotkit/info", { credentials: "include" });
      return {
        status: res.status,
        contentType: res.headers.get("content-type") ?? "",
        body: await res.text(),
      };
    });

    expect(infoProbe.status).toBe(200);
    expect(infoProbe.contentType).toMatch(/json/i);
    const infoBody = JSON.parse(infoProbe.body) as { agents?: Record<string, unknown> };
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
