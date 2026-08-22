import { expect, test, type BrowserContext, type Page, type Request } from "@playwright/test"

import {
  cleanupVisitorRows,
  countVisitorRows,
  visitorHashFromToken,
} from "./support/analytics-database"

const ANALYTICS_PATH = "/api/analytics/events"
const CONSENT_COOKIE = "laf_consent"
const VISITOR_COOKIE = "laf_visitor"

let visitorHashes: Set<string>

function monitorAnalyticsRequests(page: Page): Request[] {
  const requests: Request[] = []
  page.on("request", (request) => {
    if (new URL(request.url()).pathname === ANALYTICS_PATH) requests.push(request)
  })
  return requests
}

async function cookieValue(context: BrowserContext, name: string): Promise<string | null> {
  const cookies = await context.cookies()
  return cookies.find((cookie) => cookie.name === name)?.value ?? null
}

async function expectCookie(
  context: BrowserContext,
  name: string,
  expected: string | null,
): Promise<void> {
  await expect.poll(() => cookieValue(context, name)).toBe(expected)
}

async function rememberCurrentVisitor(context: BrowserContext): Promise<string> {
  const token = await cookieValue(context, VISITOR_COOKIE)
  expect(token, "an analytics choice should create laf_visitor").not.toBeNull()
  const visitorHash = visitorHashFromToken(token as string)
  expect(visitorHash, "laf_visitor should be signed with the E2E analytics secret").not.toBeNull()
  visitorHashes.add(visitorHash as string)
  return visitorHash as string
}

async function chooseAnalytics(page: Page, context: BrowserContext): Promise<{
  request: Request
  visitorHash: string
}> {
  const eventRequest = page.waitForRequest((request) => (
    new URL(request.url()).pathname === ANALYTICS_PATH
  ), { timeout: 10_000 })

  await page.getByRole("button", { name: /분석 허용|Allow analytics/ }).click()
  await expectCookie(context, CONSENT_COOKIE, "1:analytics")
  const visitorHash = await rememberCurrentVisitor(context)

  return { request: await eventRequest, visitorHash }
}

test.beforeEach(() => {
  visitorHashes = new Set()
})

test.afterEach(async ({ context }) => {
  const token = await cookieValue(context, VISITOR_COOKIE)
  if (token) {
    const visitorHash = visitorHashFromToken(token)
    if (visitorHash) visitorHashes.add(visitorHash)
  }

  for (const visitorHash of visitorHashes) await cleanupVisitorRows(visitorHash)
})

test("first visit sends no analytics before a choice", async ({ page }) => {
  const analyticsRequests = monitorAnalyticsRequests(page)

  await page.goto("/")
  await expect(page.getByRole("button", { name: /필수만 사용|Essential only/ })).toBeVisible()
  await page.waitForTimeout(1_000)

  expect(analyticsRequests).toEqual([])
  await expect(page.locator("body")).not.toBeEmpty()
  await expect(page.locator("[data-nextjs-dialog]"))
    .toHaveCount(0)
})

test("essential-only keeps analytics silent and creates no visitor cookie", async ({ page, context }) => {
  const analyticsRequests = monitorAnalyticsRequests(page)

  await page.goto("/")
  await page.getByRole("button", { name: /필수만 사용|Essential only/ }).click()

  await expectCookie(context, CONSENT_COOKIE, "1:essential")
  await expectCookie(context, VISITOR_COOKIE, null)
  expect(analyticsRequests).toEqual([])
})

test("allow-analytics creates both cookies and one event request", async ({ page, context }) => {
  const analyticsRequests = monitorAnalyticsRequests(page)

  await page.goto("/")
  const { request, visitorHash } = await chooseAnalytics(page, context)
  const response = await request.response()

  expect(response?.status()).toBe(204)
  expect(analyticsRequests).toHaveLength(1)
  await expect.poll(async () => (await countVisitorRows(visitorHash)).events).toBeGreaterThanOrEqual(2)
})

test("DNT: 1 resolves an analytics choice to essential without a visitor cookie", async ({ page, context }) => {
  const analyticsRequests = monitorAnalyticsRequests(page)
  await page.setExtraHTTPHeaders({ DNT: "1" })

  await page.goto("/")
  await expect(page.getByText(/추적 거부 설정|Do Not Track preference/)).toBeVisible()
  await page.getByRole("button", { name: /분석 허용|Allow analytics/ }).click()

  await expectCookie(context, CONSENT_COOKIE, "1:essential")
  await expectCookie(context, VISITOR_COOKIE, null)
  expect(analyticsRequests).toEqual([])
})

test("footer withdrawal clears laf_visitor and removes the visitor rows", async ({ page, context }) => {
  await page.goto("/")
  const { request, visitorHash } = await chooseAnalytics(page, context)
  expect((await request.response())?.status()).toBe(204)
  await expect.poll(async () => {
    const rows = await countVisitorRows(visitorHash)
    return rows.events > 0 && rows.windows > 0
  }).toBe(true)

  await page.getByRole("button", { name: /쿠키 설정|Cookie settings/ }).click()
  await page.getByRole("button", { name: /필수만 사용|Essential only/ }).click()

  await expectCookie(context, CONSENT_COOKIE, "1:essential")
  await expectCookie(context, VISITOR_COOKIE, null)
  await expect.poll(() => countVisitorRows(visitorHash)).toEqual({ events: 0, windows: 0 })
})

test("locale change translates the panel while laf_consent remains", async ({ page, context }) => {
  await page.goto("/")
  await page.getByRole("button", { name: /필수만 사용|Essential only/ }).click()
  await expectCookie(context, CONSENT_COOKIE, "1:essential")

  await page.getByRole("button", { name: /쿠키 설정|Cookie settings/ }).click()
  await page.getByRole("button", { name: "EN", exact: true }).click()

  await expect(page.getByRole("heading", { name: "Choose your analytics preference" })).toBeVisible()
  await expect(page.getByRole("button", { name: "Essential only" })).toBeVisible()
  await expect(page.locator("html")).toHaveAttribute("lang", "en")
  await expectCookie(context, CONSENT_COOKIE, "1:essential")
})

test("a forced analytics 503 does not block product, GitHub, contact, locale, or scroll interactions", async ({ page, context }) => {
  const failedResponses: number[] = []
  await page.route(`**${ANALYTICS_PATH}`, async (route) => {
    failedResponses.push(503)
    await route.fulfill({ status: 503, body: "" })
  })
  await context.route("https://github.com/**", async (route) => {
    await route.fulfill({ status: 204, body: "" })
  })

  await page.goto("/")
  const { visitorHash } = await chooseAnalytics(page, context)
  await expect.poll(() => failedResponses.length).toBeGreaterThan(0)

  await page.locator('a.hero-scroll[href="#products"]').click()
  await expect(page).toHaveURL(/#products$/)
  await expect(page.locator("#products")).toBeInViewport()

  const popupPromise = context.waitForEvent("page")
  await page.locator('a[aria-label="LafLabs on GitHub"]').click()
  const popup = await popupPromise
  await expect.poll(() => popup.url()).toMatch(/^https:\/\/github\.com\/laflabs-inc/)
  await popup.close()

  await page.evaluate(() => {
    const contact = document.querySelector<HTMLAnchorElement>('a.footer-mail[href^="mailto:"]')
    contact?.addEventListener("click", (event) => {
      event.preventDefault()
      document.documentElement.dataset.e2eContactClicked = "true"
    }, { once: true })
  })
  await page.locator('a.footer-mail[href="mailto:contact@laflabs.co"]').click()
  await expect(page.locator("html")).toHaveAttribute("data-e2e-contact-clicked", "true")

  await page.getByRole("button", { name: "EN", exact: true }).click()
  await expect(page.locator("html")).toHaveAttribute("lang", "en")

  const scrollBefore = await page.evaluate(() => window.scrollY)
  expect(scrollBefore).toBeGreaterThan(0)
  await page.mouse.wheel(0, -700)
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeLessThan(scrollBefore)
  await expect(page.locator(".site-header")).toHaveAttribute("data-stuck", "true")

  expect(await countVisitorRows(visitorHash)).toEqual({ events: 0, windows: 0 })
})

test("admin analytics redirects an unauthenticated browser to sign-in", async ({ page }) => {
  await page.goto("/admin/analytics")

  await expect(page).toHaveURL(/\/admin\/sign-in$/)
  await expect(page.getByRole("heading", { name: "Continue with GitHub" })).toBeVisible()
  await expect(page.locator("[data-nextjs-dialog]"))
    .toHaveCount(0)
})
