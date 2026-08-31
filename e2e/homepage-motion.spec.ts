import { expect, test } from "@playwright/test"

const homepageUrl = "http://127.0.0.1:3201"

test("desktop build loop pins one stage and advances its scene", async ({ context, page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop-chromium")
  await page.emulateMedia({ reducedMotion: "no-preference" })
  await context.addCookies([
    { name: "laf_locale", value: "ko", url: homepageUrl },
    { name: "laf_consent", value: "1:essential", url: homepageUrl },
  ])
  await page.route("**/api/content?**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ items: [], nextCursor: null }),
    })
  })
  await page.goto("/")

  const section = page.getByRole("region", {
    name: "제품에서 시작해 시스템으로 남깁니다.",
  })
  const sticky = section.getByTestId("build-loop-sticky")
  const dimensions = await section.evaluate((element) => ({
    height: element.getBoundingClientRect().height,
    viewport: window.innerHeight,
  }))

  expect(dimensions.height).toBeGreaterThan(dimensions.viewport * 3)
  expect(await sticky.evaluate((element) => getComputedStyle(element).position)).toBe("sticky")

  await section.evaluate((element) => {
    window.scrollTo({
      top: element.getBoundingClientRect().top + window.scrollY,
      behavior: "instant",
    })
  })
  await expect(section).toBeInViewport()
  await expect(section).toHaveAttribute("data-active-scene", "product")

  await section.evaluate((element) => {
    const top = element.getBoundingClientRect().top + window.scrollY
    const travel = element.getBoundingClientRect().height - window.innerHeight
    window.scrollTo({ top: top + travel * 0.84, behavior: "instant" })
  })
  await expect(section).toHaveAttribute("data-active-scene", "system")
  await expect.poll(async () => section.getByRole("listitem").evaluateAll((items) => (
    items.map((item) => Number(getComputedStyle(item).opacity).toFixed(2))
  ))).toEqual(["0.00", "0.00", "0.00", "1.00"])

  await page.screenshot({
    path: `test-results/build-loop-${testInfo.project.name}.png`,
    fullPage: false,
  })
})

test("mobile build loop is a readable vertical sequence", async ({ context, page }, testInfo) => {
  test.skip(testInfo.project.name === "desktop-chromium")
  await page.emulateMedia({ reducedMotion: "no-preference" })
  await context.addCookies([
    { name: "laf_locale", value: "ko", url: homepageUrl },
    { name: "laf_consent", value: "1:essential", url: homepageUrl },
  ])
  await page.route("**/api/content?**", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ items: [], nextCursor: null }) })
  })
  await page.goto("/")

  const section = page.getByRole("region", { name: "제품에서 시작해 시스템으로 남깁니다." })
  await section.scrollIntoViewIfNeeded()
  const layout = await section.evaluate((element) => {
    const items = [...element.querySelectorAll("li")]
    return {
      height: element.getBoundingClientRect().height,
      itemOpacity: items.map((item) => getComputedStyle(item).opacity),
      itemPositions: items.map((item) => getComputedStyle(item).position),
      width: document.documentElement.scrollWidth,
      viewport: document.documentElement.clientWidth,
    }
  })

  expect(layout.height).toBeLessThan(page.viewportSize()!.height * 3)
  expect(layout.itemOpacity).toEqual(["1", "1", "1", "1"])
  expect(layout.itemPositions).toEqual(["relative", "relative", "relative", "relative"])
  expect(layout.width).toBeLessThanOrEqual(layout.viewport + 1)
  await page.screenshot({ path: `test-results/build-loop-${testInfo.project.name}.png`, fullPage: false })
})

test("reduced motion exposes the complete build story", async ({ context, page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" })
  await context.addCookies([
    { name: "laf_locale", value: "ko", url: homepageUrl },
    { name: "laf_consent", value: "1:essential", url: homepageUrl },
  ])
  await page.route("**/api/content?**", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ items: [], nextCursor: null }) })
  })
  await page.goto("/")

  const section = page.getByRole("region", { name: "제품에서 시작해 시스템으로 남깁니다." })
  await section.scrollIntoViewIfNeeded()
  await expect(section).toHaveAttribute("data-active-scene", "system")
  const itemOpacity = await section.getByRole("listitem").evaluateAll((items) => (
    items.map((item) => getComputedStyle(item).opacity)
  ))
  expect(itemOpacity).toEqual(["1", "1", "1", "1"])
  await expect(section.getByText("LAF", { exact: true })).toBeVisible()
})

test("latest signals is scrollable without widening the homepage", async ({ context, page }, testInfo) => {
  await context.addCookies([
    { name: "laf_locale", value: "ko", url: homepageUrl },
    { name: "laf_consent", value: "1:essential", url: homepageUrl },
  ])
  await page.route("**/api/content?**", async (route) => {
    const kind = new URL(route.request().url()).searchParams.get("kind") ?? "notice"
    const content = {
      notice: { slug: "product-update", title: "제품 업데이트", summary: "제품과 기반 기술의 최근 변경 사항을 전합니다.", category: "company", date: "2026-08-29T00:00:00.000Z" },
      disclosure: { slug: "company-record", title: "회사 정보 공개", summary: "회사의 주요 정보를 확인할 수 있는 형태로 기록합니다.", category: "ir", date: "2026-08-28T00:00:00.000Z" },
    }[kind as "notice" | "disclosure"]
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        items: [{
          id: `${kind}-1`,
          kind,
          locale: "ko",
          slug: content.slug,
          category: content.category,
          pinned: false,
          revision: 1,
          title: content.title,
          summary: content.summary,
          effectiveAt: null,
          publishedAt: content.date,
        }],
        nextCursor: null,
      }),
    })
  })
  await page.goto("/")

  const section = page.getByRole("heading", { name: "만든 것과 배운 것을 기록합니다." }).locator("..")
  const rail = page.getByRole("region", { name: "최근 소식" })
  await section.scrollIntoViewIfNeeded()
  await expect(page.getByRole("link", { name: /제품 업데이트/ })).toBeVisible()
  await expect(page.getByTestId("signal-lock")).toHaveAttribute("data-signal-state", "ready")
  await page.waitForTimeout(650)

  const pageWidths = await page.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    document: document.documentElement.scrollWidth,
  }))
  expect(pageWidths.document).toBeLessThanOrEqual(pageWidths.viewport + 1)

  const before = await rail.evaluate((element) => element.scrollLeft)
  await page.getByRole("button", { name: "다음 소식" }).click()
  await expect.poll(() => rail.evaluate((element) => element.scrollLeft)).toBeGreaterThan(before)

  await page.screenshot({
    path: `test-results/latest-signals-${testInfo.project.name}.png`,
    fullPage: false,
  })
})
