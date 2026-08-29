import { defineConfig } from "@playwright/test"

const baseURL = "http://127.0.0.1:3202"

export default defineConfig({
  testDir: "./e2e",
  testMatch: "markdown-guide-layout.spec.ts",
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
      name: "mobile-chromium",
      use: { browserName: "chromium", viewport: { width: 390, height: 844 } },
    },
    {
      name: "tablet-chromium",
      use: { browserName: "chromium", viewport: { width: 768, height: 900 } },
    },
    {
      name: "desktop-chromium",
      use: { browserName: "chromium", viewport: { width: 1440, height: 1000 } },
    },
  ],
  webServer: {
    command: "npm run dev -- --hostname 127.0.0.1 --port 3202",
    url: baseURL,
    reuseExistingServer: true,
    timeout: 120_000,
    env: {
      ...process.env,
      NEXT_PUBLIC_SITE_URL: baseURL,
      AUTH_URL: baseURL,
      AUTH_SECRET: "laflabs-markdown-guide-layout-test-secret",
      AUTH_GITHUB_ID: "layout-test",
      AUTH_GITHUB_SECRET: "layout-test",
      ADMIN_GITHUB_ORG: "laflabs-inc",
    },
  },
})
