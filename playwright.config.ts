import { defineConfig, devices } from "@playwright/test";

const MOBILE_BREAKPOINTS = [
  { name: "mobile-390", width: 390, height: 844 },
  { name: "mobile-430", width: 430, height: 932 },
  { name: "tablet-768", width: 768, height: 1024 },
  { name: "tablet-1024", width: 1024, height: 768 },
] as const;

export default defineConfig({
  testDir: "./e2e",
  testIgnore: ["**/copilotkit-prod-smoke.spec.ts"],
  timeout: 45_000,
  retries: 1,
  webServer: {
    command: "npm run dev:ui",
    cwd: "./app",
    url: "http://localhost:3002",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      NEXT_PUBLIC_E2E_UPLOAD_POLL_MAX_MS: "3000",
      // Prefer no Next.js dev portal overlay during Playwright (actionability).
      NEXT_DISABLE_DEV_OVERLAY: "1",
      // IPI-725 sign-out e2e needs the same fail-closed gate as Cloudflare preview.
      ...(process.env.OPERATOR_AUTH_ENABLED
        ? { OPERATOR_AUTH_ENABLED: process.env.OPERATOR_AUTH_ENABLED }
        : {}),
      ...(process.env.REQUIRE_OPERATOR_SIGNOUT_E2E === "true"
        ? { OPERATOR_AUTH_ENABLED: "true" }
        : {}),
      // IPI-836 — force Next webServer onto QA Supabase (never production).
      ...(process.env.ONBOARDING_LAUNCH_E2E === "true"
        ? {
            OPERATOR_AUTH_ENABLED: "true",
            NEXT_PUBLIC_SUPABASE_URL: process.env.QA_SUPABASE_URL,
            NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.QA_SUPABASE_ANON_KEY,
            DATABASE_URL: process.env.QA_DATABASE_URL,
            QA_DATABASE_URL: process.env.QA_DATABASE_URL,
            QA_SUPABASE_URL: process.env.QA_SUPABASE_URL,
            QA_SUPABASE_ANON_KEY: process.env.QA_SUPABASE_ANON_KEY,
            CLOUDFLARE_HYPERDRIVE_LOCAL_CONNECTION_STRING_HYPERDRIVE_FRESH:
              process.env.QA_DATABASE_URL,
          }
        : {}),
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
    ...MOBILE_BREAKPOINTS.map(({ name, width, height }) => ({
      name,
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width, height },
        isMobile: width <= 430,
        hasTouch: width <= 1024,
      },
    })),
  ],
});
