import { defineConfig, devices } from "@playwright/test";

const port = Number(process.env.PORT || 5001);
const baseURL = process.env.PLAYWRIGHT_BASE_URL || `http://127.0.0.1:${port}`;
const shouldStartServer = !process.env.PLAYWRIGHT_BASE_URL;

export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  expect: {
    timeout: 10_000,
  },
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  webServer: shouldStartServer
    ? {
        command: "npm run dev",
        url: baseURL,
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
        env: {
          PORT: String(port),
        },
      }
    : undefined,
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
