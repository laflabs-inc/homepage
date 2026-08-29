import { expect, test } from "@playwright/test"

test("build loop steps keep their scroll motion on mobile", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" })
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
})
