import { defineConfig, devices } from "@playwright/test";

const prodBase = process.env.IPIX_PROD_BASE_URL?.replace(/\/$/, "") ?? "https://www.ipix.co";

export default defineConfig({
  testDir: "./e2e",
  timeout: 60_000,
  retries: 0,
  use: {
    baseURL: prodBase,
    headless: true,
    screenshot: "only-on-failure",
    video: "off",
  },
  projects: [{ name: "chromium-prod", use: { ...devices["Desktop Chrome"] } }],
});
