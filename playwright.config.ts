import { defineConfig } from "@playwright/test"

import {
  E2E_ANALYTICS_HASH_SECRET,
  validateE2eDatabaseEnvironment,
} from "./e2e/support/test-database"

const baseURL = "http://127.0.0.1:3200"
const testDatabaseUrl = validateE2eDatabaseEnvironment({
  testDatabaseUrl: process.env.TEST_DATABASE_URL,
  databaseUrl: process.env.DATABASE_URL,
  productionSiteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? "https://laflabs.co",
  productionDatabaseHostname: process.env.E2E_PRODUCTION_DATABASE_HOSTNAME,
  databaseSentinel: process.env.E2E_DATABASE_SENTINEL,
  ci: Boolean(process.env.CI),
})

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["line"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "desktop-chromium",
      use: { browserName: "chromium", viewport: { width: 1440, height: 1000 } },
    },
    {
      name: "mobile-chromium",
      use: {
        browserName: "chromium",
        viewport: { width: 390, height: 844 },
        hasTouch: true,
        isMobile: true,
      },
    },
  ],
  webServer: {
    command: "npm run dev -- --hostname 127.0.0.1 --port 3200",
    url: baseURL,
    reuseExistingServer: false,
    timeout: 120_000,
    env: {
      ...process.env,
      DATABASE_URL: testDatabaseUrl,
      TEST_DATABASE_URL: testDatabaseUrl,
      E2E_DATABASE_SENTINEL: process.env.E2E_DATABASE_SENTINEL ?? "",
      E2E_PRODUCTION_DATABASE_HOSTNAME: process.env.E2E_PRODUCTION_DATABASE_HOSTNAME ?? "",
      ANALYTICS_HASH_SECRET: E2E_ANALYTICS_HASH_SECRET,
      AUTH_SECRET: process.env.AUTH_SECRET ?? "laflabs-e2e-only-auth-secret-32-bytes",
      AUTH_GITHUB_ID: process.env.AUTH_GITHUB_ID ?? "e2e-placeholder-client-id",
      AUTH_GITHUB_SECRET: process.env.AUTH_GITHUB_SECRET ?? "e2e-placeholder-client-secret",
      ADMIN_GITHUB_ORG: process.env.ADMIN_GITHUB_ORG ?? "laflabs-inc",
      CRON_SECRET: process.env.CRON_SECRET ?? "laflabs-e2e-cron-secret",
      NEXT_PUBLIC_SITE_URL: baseURL,
      AUTH_URL: baseURL,
      AUTH_TRUST_HOST: "true",
    },
  },
})
