import { defineConfig } from "@playwright/test"

const baseURL = "http://127.0.0.1:3203"

export default defineConfig({
  testDir: "./e2e",
  testMatch: "admin-stability.spec.ts",
  fullyParallel: false,
  retries: 0,
  reporter: "list",
  use: {
    baseURL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "mobile-390",
      use: { browserName: "chromium", viewport: { width: 390, height: 844 } },
    },
    {
      name: "tablet-768",
      use: { browserName: "chromium", viewport: { width: 768, height: 900 } },
    },
    {
      name: "desktop-1440",
      use: { browserName: "chromium", viewport: { width: 1440, height: 1000 } },
    },
  ],
  webServer: {
    command: "npm run dev -- --hostname 127.0.0.1 --port 3203",
    url: baseURL,
    reuseExistingServer: false,
    timeout: 120_000,
    env: {
      ...process.env,
      NEXT_PUBLIC_SITE_URL: baseURL,
      AUTH_URL: baseURL,
      AUTH_SECRET: "laflabs-admin-stability-test-secret",
      AUTH_GITHUB_ID: "admin-stability-test",
      AUTH_GITHUB_SECRET: "admin-stability-test",
      ADMIN_GITHUB_ORG: "laflabs-inc",
    },
  },
})
