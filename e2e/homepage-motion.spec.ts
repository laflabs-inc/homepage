import { expect, test } from "@playwright/test"

const homepageUrl = "http://127.0.0.1:3200"

test("mobile header keeps generous tap targets without oversized visuals", async ({ context, page }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile-chromium")
  await context.addCookies([
    { name: "laf_locale", value: "ko", url: homepageUrl },
    { name: "laf_consent", value: "2:essential", url: homepageUrl },
  ])
  await page.route("**/api/content?**", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ items: [], nextCursor: null }) })
  })
  await page.goto("/")

  const search = page.getByRole("button", { name: "검색" })
  await search.click()

  const headerGeometry = await page.locator(".site-header").evaluate((header) => {
    const logoImage = header.querySelector<HTMLElement>(".laf-logo img")!
    const logoText = header.querySelector<HTMLElement>(".laf-logo-text")!
    const actions = header.querySelector<HTMLElement>(".header-actions")!
    const searchTrigger = header.querySelector<HTMLElement>('button[aria-controls="site-search-overlay"]')!
    const searchIcon = searchTrigger.querySelector<HTMLElement>("svg")!
    const github = header.querySelector<HTMLElement>(".icon-toggle")!
    const githubIcon = github.querySelector<HTMLElement>("svg")!
    const searchFrame = getComputedStyle(searchTrigger, "::before")
    const githubFrame = getComputedStyle(github, "::before")

    return {
      logoImage: logoImage.getBoundingClientRect().width,
      logoText: getComputedStyle(logoText).fontSize,
      actionsGap: getComputedStyle(actions).gap,
      searchTarget: searchTrigger.getBoundingClientRect().width,
      searchVisual: [searchFrame.width, searchFrame.height],
      searchIcon: searchIcon.getBoundingClientRect().width,
      githubTarget: github.getBoundingClientRect().width,
      githubVisual: [githubFrame.width, githubFrame.height],
      githubIcon: githubIcon.getBoundingClientRect().width,
      pageWidth: document.documentElement.scrollWidth,
      viewportWidth: document.documentElement.clientWidth,
    }
  })

  expect(headerGeometry).toEqual({
    logoImage: 20,
    logoText: "16px",
    actionsGap: "4px",
    searchTarget: 44,
    searchVisual: ["34px", "34px"],
    searchIcon: 14,
    githubTarget: 44,
    githubVisual: ["34px", "34px"],
    githubIcon: 15,
    pageWidth: headerGeometry.viewportWidth,
    viewportWidth: headerGeometry.viewportWidth,
  })

  await page.screenshot({
    path: `test-results/mobile-header-390-${testInfo.project.name}.png`,
    fullPage: false,
  })
  await page.setViewportSize({ width: 320, height: 568 })
  await page.screenshot({
    path: `test-results/mobile-header-320-${testInfo.project.name}.png`,
    fullPage: false,
  })
})

test("company-first sections stay in the normal document flow", async ({ context, page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop-chromium")
  await page.emulateMedia({ reducedMotion: "no-preference" })
  await context.addCookies([
    { name: "laf_locale", value: "ko", url: homepageUrl },
    { name: "laf_consent", value: "2:essential", url: homepageUrl },
  ])
  await page.route("**/api/content?**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ items: [], nextCursor: null }),
    })
  })
  await page.goto("/")

  const company = page.locator("#company")
  const method = page.locator("#work-method")
  const work = page.locator("#work")
  const layout = await method.evaluate((element) => ({
    position: getComputedStyle(element).position,
    height: element.getBoundingClientRect().height,
    viewport: window.innerHeight,
    pageWidth: document.documentElement.scrollWidth,
    viewportWidth: document.documentElement.clientWidth,
  }))

  expect(layout.position).toBe("static")
  expect(layout.height).toBeLessThan(layout.viewport * 2)
  expect(layout.pageWidth).toBeLessThanOrEqual(layout.viewportWidth + 1)
  expect(await company.evaluate((element) => {
    const methodElement = document.querySelector("#work-method")
    return methodElement
      ? Boolean(element.compareDocumentPosition(methodElement) & Node.DOCUMENT_POSITION_FOLLOWING)
      : false
  })).toBe(true)
  expect(await method.evaluate((element) => {
    const workElement = document.querySelector("#work")
    return workElement
      ? Boolean(element.compareDocumentPosition(workElement) & Node.DOCUMENT_POSITION_FOLLOWING)
      : false
  })).toBe(true)
  await expect(work.getByRole("heading", { name: "Laf ID" })).toBeVisible()
})

test("mobile selected work changes only through an explicit gesture", async ({ context, page }, testInfo) => {
  test.skip(testInfo.project.name === "desktop-chromium")
  await page.emulateMedia({ reducedMotion: "no-preference" })
  await context.addCookies([
    { name: "laf_locale", value: "ko", url: homepageUrl },
    { name: "laf_consent", value: "2:essential", url: homepageUrl },
  ])
  await page.route("**/api/content?**", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ items: [], nextCursor: null }) })
  })
  await page.goto("/")

  const work = page.getByRole("region", { name: "우리가 만든 것" })
  await work.scrollIntoViewIfNeeded()
  await expect(work.getByRole("heading", { name: "Laf ID" })).toBeVisible()
  await page.waitForTimeout(500)
  await expect(work.getByRole("heading", { name: "Laf ID" })).toBeVisible()

  const before = await page.evaluate(() => window.scrollY)
  await work.getByRole("button", { name: "다음 작업" }).click()
  await expect(work.getByRole("heading", { name: "lafetch" })).toBeVisible()
  expect(Math.abs((await page.evaluate(() => window.scrollY)) - before)).toBeLessThan(4)

  const width = await page.evaluate(() => ({
    page: document.documentElement.scrollWidth,
    viewport: document.documentElement.clientWidth,
  }))
  expect(width.page).toBeLessThanOrEqual(width.viewport + 1)
})

test("reduced motion keeps selected work fully operable", async ({ context, page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" })
  await context.addCookies([
    { name: "laf_locale", value: "ko", url: homepageUrl },
    { name: "laf_consent", value: "2:essential", url: homepageUrl },
  ])
  await page.route("**/api/content?**", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ items: [], nextCursor: null }) })
  })
  await page.goto("/")

  const work = page.getByRole("region", { name: "우리가 만든 것" })
  await work.scrollIntoViewIfNeeded()
  await work.getByRole("button", { name: "다음 작업" }).click()
  await expect(work.getByRole("heading", { name: "lafetch" })).toBeVisible()
  await expect(work.getByText('import { lafetch } from "@laflabs/lafetch";')).toBeVisible()
})

test("latest signals is scrollable without widening the homepage", async ({ context, page }, testInfo) => {
  await context.addCookies([
    { name: "laf_locale", value: "ko", url: homepageUrl },
    { name: "laf_consent", value: "2:essential", url: homepageUrl },
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

  const section = page.getByRole("heading", { name: "최근 작업과 회사 소식을 전합니다." }).locator("..")
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
