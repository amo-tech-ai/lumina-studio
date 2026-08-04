import type { Page } from "@playwright/test";

import { getQaCredentials, loadEnvLocal } from "./qa-credentials";

/** Login QA operator and land on /onboarding with a fresh idempotency attempt. */
export async function loginAndOpenFreshOnboarding(page: Page): Promise<boolean> {
  loadEnvLocal(resolveAppEnv());
  const { email, password } = getQaCredentials();
  if (!password) return false;

  await page.goto("/login");
  await page.getByRole("heading", { name: "Welcome" }).waitFor({ timeout: 30_000 });
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  await page.locator('form button[type="submit"]').click();
  // Zero-brand → /onboarding; existing brands → /app — always force fresh onboarding.
  await page.waitForURL(/\/(app|onboarding)/, { timeout: 45_000 });
  await page.goto("/onboarding?new=1");
  await page.waitForURL(/\/onboarding/, { timeout: 20_000 });
  await page.getByRole("button", { name: "Get started" }).waitFor({ timeout: 30_000 });
  return true;
}

function resolveAppEnv(): string {
  // Prefer app/.env.local (where QA_* live).
  return `${process.cwd()}/app/.env.local`;
}

export async function clickPrimaryCta(page: Page, name: string | RegExp) {
  const cta = page.getByRole("button", { name });
  await cta.waitFor({ state: "visible", timeout: 15_000 });
  // Fail fast — never spin for the full test timeout on a disabled CTA (screen 11
  // gates on brandName after resume).
  if (await cta.isDisabled()) {
    await cta.waitFor({ state: "attached", timeout: 100 }).catch(() => undefined);
    const step = (await page.getByText(/Step\s+\d+\s*\/\s*13/i).textContent().catch(() => "")) ?? "";
    throw new Error(`Primary CTA disabled (${String(name)}); ${step.trim() || "unknown screen"}`);
  }
  await cta.click();
}

/** Click a build/growth radio via its label — sr-only inputs are covered by images. */
export async function selectBuildOption(page: Page, optionId: string) {
  const input = page.getByTestId(`build-option-${optionId}`);
  await input.locator("xpath=ancestor::label[1]").click();
}

export async function selectGrowthOption(page: Page, optionId: string) {
  const input = page.getByTestId(`grow-option-${optionId}`);
  await input.locator("xpath=ancestor::label[1]").click();
}

/** Walk marketing + question screens through screen 7 (before analysis). */
export async function fillQuestionnaireThroughGrowth(
  page: Page,
  opts: { brandName: string; websiteUrl: string },
): Promise<void> {
  // 1 marketing
  await clickPrimaryCta(page, "Get started");
  // 2 build type
  await selectBuildOption(page, "access");
  await clickPrimaryCta(page, "Continue");
  // 3 marketing
  await clickPrimaryCta(page, "Continue");
  // 4 brand details
  await page.getByLabel(/brand name/i).fill(opts.brandName);
  await page.getByLabel(/website/i).fill(opts.websiteUrl);
  await clickPrimaryCta(page, "Continue");
  // 5 sales channels — click label card (checkbox is sr-only)
  await page.getByTestId("channel-ig").click();
  await clickPrimaryCta(page, "Continue");
  // 6 marketing
  await clickPrimaryCta(page, "Continue");
  // 7 growth
  await selectGrowthOption(page, "social");
  await clickPrimaryCta(page, "Continue");
  // Autosave is debounced 400ms — wait so mid-flow refresh resumes answers.
  await page.waitForTimeout(800);
}

/**
 * If resume dropped brandName, Continue on screen 11 stays disabled forever.
 * Walk back to Brand Details, refill, then return to the pre-analysis screen.
 */
export async function ensureAnswersForMaterialize(
  page: Page,
  opts: { brandName: string; websiteUrl: string },
): Promise<void> {
  const cta = page.getByRole("button", { name: "Continue" });
  if (await cta.isEnabled().catch(() => false)) return;

  for (let i = 0; i < 12; i += 1) {
    if (await page.getByLabel(/brand name/i).isVisible().catch(() => false)) break;
    const back = page.getByRole("button", { name: /Go back|Back/i });
    if (!(await back.isVisible().catch(() => false))) break;
    await back.click();
    await page.waitForTimeout(200);
  }

  await page.getByLabel(/brand name/i).fill(opts.brandName);
  await page.getByLabel(/website/i).fill(opts.websiteUrl);
  await page.waitForTimeout(800);

  // Re-walk forward through marketing/questions until Continue would materialize
  // (screen 11) or analysis has already started.
  for (let i = 0; i < 12; i += 1) {
    if (await page.getByTestId("analysis-status").isVisible().catch(() => false)) return;
    if (await page.getByTestId("approve-brand-dna").isVisible().catch(() => false)) return;
    const next = page.getByRole("button", { name: "Continue" });
    await next.waitFor({ state: "visible", timeout: 10_000 });
    if (await next.isDisabled()) {
      throw new Error("Continue still disabled after refill — cannot reach analysis");
    }
    const stepText = (await page.getByText(/Step\s+(\d+)\s*\/\s*13/i).textContent()) ?? "";
    await next.click();
    // After clicking Continue on screen 11, materialize may take a moment.
    if (/Step\s+11\b/i.test(stepText)) {
      await page
        .getByTestId("analysis-status")
        .or(page.getByTestId("approve-brand-dna"))
        .first()
        .waitFor({ timeout: 120_000 });
      return;
    }
  }
}

/** Advance remaining marketing screens 8–11 into analysis (12). */
export async function advanceToAnalysis(
  page: Page,
  opts?: { brandName: string; websiteUrl: string },
): Promise<void> {
  for (let i = 0; i < 4; i += 1) {
    const cta = page.getByRole("button", { name: "Continue" });
    await cta.waitFor({ state: "visible", timeout: 15_000 });
    if (await cta.isDisabled()) {
      if (!opts) {
        throw new Error("Continue disabled before analysis and no refill opts provided");
      }
      await ensureAnswersForMaterialize(page, opts);
      return;
    }
    await cta.click();
  }
  // Screen 12 — analysis. Footer Continue is hidden; wait for progress UI.
  await page
    .getByTestId("analysis-status")
    .or(page.getByText(/analyz|crawl|Brand DNA|Preparing|Setting/i))
    .first()
    .waitFor({
      timeout: 60_000,
    });
}

const IDEM_PREFIX = "ipix:onboarding:idempotency:v1:";

export async function readIdempotencyKey(page: Page): Promise<string | null> {
  return page.evaluate((prefix) => {
    for (let i = 0; i < localStorage.length; i += 1) {
      const key = localStorage.key(i);
      if (key?.startsWith(prefix)) {
        const value = localStorage.getItem(key);
        if (value) return value;
      }
    }
    return localStorage.getItem("ipix:onboarding:idempotency:v1");
  }, IDEM_PREFIX);
}

/** User id from per-user idempotency storage key (IPI-945) or HttpOnly auth cookies. */
export async function readAuthUserId(page: Page): Promise<string | null> {
  const fromStorage = await page.evaluate((prefix) => {
    for (let i = 0; i < localStorage.length; i += 1) {
      const key = localStorage.key(i);
      if (key?.startsWith(prefix) && key.length > prefix.length) {
        return key.slice(prefix.length);
      }
    }
    return null;
  }, IDEM_PREFIX);
  if (fromStorage) return fromStorage;

  const cookies = await page.context().cookies();
  const byName = new Map(cookies.map((c) => [c.name, c.value]));
  const authNames = [...byName.keys()].filter((n) => n.includes("auth-token"));
  const bases = new Set(authNames.map((n) => n.replace(/\.\d+$/, "")));

  for (const base of bases) {
    const parts = authNames
      .filter((n) => n === base || n.startsWith(`${base}.`))
      .sort((a, b) => {
        const ai = a.includes(".") ? Number(a.split(".").pop()) : -1;
        const bi = b.includes(".") ? Number(b.split(".").pop()) : -1;
        return ai - bi;
      });
    let raw = parts.map((n) => byName.get(n) ?? "").join("");
    if (raw.startsWith("base64-")) {
      try {
        raw = Buffer.from(raw.slice("base64-".length), "base64").toString("utf8");
      } catch {
        continue;
      }
    }
    try {
      const parsed = JSON.parse(decodeURIComponent(raw));
      const access =
        typeof parsed?.access_token === "string"
          ? parsed.access_token
          : Array.isArray(parsed)
            ? parsed.find((p) => typeof p?.access_token === "string")?.access_token
            : null;
      if (typeof access === "string") {
        const payload = JSON.parse(
          Buffer.from(access.split(".")[1]!, "base64url").toString("utf8"),
        );
        if (typeof payload.sub === "string") return payload.sub;
      }
    } catch {
      /* next cookie base */
    }
  }
  return null;
}
