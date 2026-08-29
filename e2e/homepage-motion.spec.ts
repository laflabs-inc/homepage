import { expect, test } from "@playwright/test"

const homepageUrl = "http://127.0.0.1:3201"

test("build loop steps keep their scroll motion across responsive layouts", async ({ context, page }, testInfo) => {
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
  const firstStep = section.getByRole("listitem").first()

  await page.evaluate(() => {
    const target = document.querySelector<HTMLElement>('section[aria-labelledby="build-loop-title"]')
    if (!target) throw new Error("Build loop was not found")
    window.scrollTo({ top: target.offsetTop - window.innerHeight * 0.78, behavior: "instant" })
  })
  await expect(section).toBeInViewport()
  const before = await firstStep.evaluate((element) => getComputedStyle(element).transform)

  await page.evaluate(() => window.scrollBy({ top: window.innerHeight * 0.58, behavior: "instant" }))
  await page.waitForTimeout(120)
  const after = await firstStep.evaluate((element) => getComputedStyle(element).transform)

  expect(before).not.toBe("none")
  expect(after).not.toBe(before)
  await page.screenshot({
    path: `test-results/build-loop-${testInfo.project.name}.png`,
    fullPage: false,
  })
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
      design: { slug: "brand-assets", title: "브랜드 에셋 안내", summary: "공식 로고와 디자인 리소스의 사용 기준을 정리했습니다.", category: "assets", date: "2026-08-27T00:00:00.000Z" },
    }[kind as "notice" | "disclosure" | "design"]
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
