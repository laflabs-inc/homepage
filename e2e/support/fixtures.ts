import { test as base } from "@playwright/test"

import { ensureE2eDatabaseSentinel } from "./analytics-database"

export const test = base.extend<Record<never, never>, { databaseSentinel: void }>({
  databaseSentinel: [async ({ browserName }, use) => {
    void browserName
    await ensureE2eDatabaseSentinel()
    await use()
  }, { auto: true, scope: "worker" }],
})
