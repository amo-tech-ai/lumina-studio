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

/** IPI-572 — SCR-26–31 CRM operator routes for mobile overflow / chrome gates.
 *  List/board roots; detail URLs are discovered at runtime from the first row link. */
export const CRM_MOBILE_ROUTES = [
  "/app/crm/companies",
  "/app/crm/contacts",
  "/app/crm/pipeline",
] as const;

/** List → first detail row (company / contact / deal). */
export const CRM_MOBILE_DETAIL_ENTRY = [
  { list: "/app/crm/companies", linkName: /\/app\/crm\/companies\/[^/]+$/ },
  { list: "/app/crm/contacts", linkName: /\/app\/crm\/contacts\/[^/]+$/ },
  { list: "/app/crm/pipeline", linkName: /\/app\/crm\/pipeline\/[^/]+$/ },
] as const;

export const CRM_MOBILE_VIEWPORTS = [
  { name: "320", width: 320, height: 568 },
  { name: "390", width: 390, height: 844 },
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
  await page.getByRole("heading", { name: "Welcome" }).waitFor({ timeout: 20_000 });
  await page.fill('input[name="email"]', "qa@ipix.test");
  await page.fill('input[name="password"]', password);
  // Scoped to the email/password form's own submit button — a bare
  // name-regex match also hits "Sign in with Google" and the email/Google
  // tab-toggle button, both of which also contain "Sign in".
  await page.locator('form button[type="submit"]').click();
  await page.waitForURL(/\/app/, { timeout: 15_000 });
  return page.url().includes("/app");
}
