import { defineConfig, devices } from "@playwright/test";

const MOBILE_BREAKPOINTS = [
  { name: "mobile-390", width: 390, height: 844 },
  { name: "mobile-430", width: 430, height: 932 },
  { name: "tablet-768", width: 768, height: 1024 },
  { name: "tablet-1024", width: 1024, height: 768 },
] as const;

export default defineConfig({
  testDir: "./e2e",
  timeout: 45_000,
  retries: 1,
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
