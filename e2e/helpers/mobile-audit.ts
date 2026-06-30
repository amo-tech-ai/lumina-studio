import type { Page } from "@playwright/test";

export const OPERATOR_ROUTES = [
  "/app",
  "/app/brand",
  "/app/shoots",
  "/app/assets",
  "/app/campaigns",
  "/app/matching",
  "/app/preview",
  "/app/onboarding",
] as const;

export async function assertNoHorizontalOverflow(page: Page) {
  const metrics = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  return metrics.scrollWidth <= metrics.clientWidth + 1;
}

export async function collectConsoleErrors(page: Page) {
  const errors: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(msg.text());
  });
  return errors;
}

export async function loginOperatorIfConfigured(page: Page): Promise<boolean> {
  const password = process.env.QA_PASSWORD;
  if (!password) return false;

  await page.goto("/login");
  await page.fill('input[name="email"]', "qa@ipix.test");
  await page.fill('input[name="password"]', password);
  await page.getByRole("button", { name: /sign in|log in/i }).click();
  await page.waitForURL(/\/app/, { timeout: 15_000 });
  return page.url().includes("/app");
}
