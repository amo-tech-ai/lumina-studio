/**
 * IPI-836 · ONB2-VERIFY-001 — dedicated Playwright config for QA onboarding launch.
 *
 * Kept separate from playwright.config.ts so shared e2e CI/config stays one concern
 * (AGENTS.md #1). Always starts a fresh webServer with QA env — never reuses a local
 * :3002 process that may still point at production.
 *
 * Usage:
 *   ONBOARDING_LAUNCH_E2E=true npx playwright test \
 *     --config=playwright.onboarding-launch.config.ts \
 *     e2e/14-onboarding-launch.spec.ts
 */
import { defineConfig, devices } from "@playwright/test";

import { qaWebServerEnv } from "./e2e/helpers/qa-target";

const qaEnv = qaWebServerEnv();

export default defineConfig({
  testDir: "./e2e",
  testMatch: "**/14-onboarding-launch.spec.ts",
  timeout: 45_000,
  retries: 0,
  workers: 1,
  webServer: {
    command: "npm run dev:ui",
    cwd: "./app",
    url: "http://localhost:3002",
    // P1: never reuse a pre-existing :3002 (may be production-backed).
    reuseExistingServer: false,
    timeout: 120_000,
    env: {
      NEXT_PUBLIC_E2E_UPLOAD_POLL_MAX_MS: "3000",
      NEXT_DISABLE_DEV_OVERLAY: "1",
      ONBOARDING_LAUNCH_E2E: "true",
      ...qaEnv,
    },
  },
  use: {
    baseURL: "http://localhost:3002",
    headless: true,
    screenshot: "only-on-failure",
    video: "off",
  },
  projects: [
    { name: "chromium-desktop", use: { ...devices["Desktop Chrome"] } },
    {
      name: "mobile-390",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 390, height: 844 },
        isMobile: true,
        hasTouch: true,
      },
    },
  ],
});
