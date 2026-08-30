import { expect, test } from "@playwright/test"
import { encode } from "next-auth/jwt"

const baseURL = "http://127.0.0.1:3203"
const authSecret = "laflabs-admin-stability-test-secret"

test("Admin locale, guide layout, and retired design routes remain stable", async ({ context, page }, testInfo) => {
  const session = await encode({
    token: {
      sub: "admin-stability-test",
      githubId: "admin-stability-test",
      orgMember: true,
      membershipCheckedAt: Date.now(),
      githubAccessToken: "admin-stability-test",
    },
    secret: authSecret,
    salt: "authjs.session-token",
    maxAge: 8 * 60 * 60,
  })

  await context.addCookies([{
    name: "authjs.session-token",
    value: session,
    url: baseURL,
    httpOnly: true,
    sameSite: "Lax",
  }, {
    name: "laf_consent",
    value: "1:essential",
    url: baseURL,
    sameSite: "Lax",
  }, {
    name: "laf_locale",
    value: "ko",
    url: baseURL,
    sameSite: "Lax",
  }])

  await page.goto("/admin/documents/markdown-guide")
  await expect(page.getByRole("heading", { name: "Markdown 작성 가이드" })).toBeVisible()
  await expect(page.getByRole("navigation", { name: "관리자" })).toContainText("문서")
  await expect(page.getByRole("link", { name: "문서 목록으로" })).toBeVisible()
  await expect(page.getByRole("link", { name: "AI용 Markdown 원문" })).toBeVisible()

  const englishToggle = page.getByRole("button", { name: "English" })
  if (testInfo.project.name === "desktop-1440") {
    await englishToggle.focus()
    await expect(englishToggle).toBeFocused()
    await englishToggle.press("Enter")
  } else {
    await englishToggle.click()
  }
  await expect(page.getByRole("navigation", { name: "Admin" })).toContainText("Documents")
  await expect(page.getByRole("heading", { name: "Markdown writing guide" })).toBeVisible()
  await expect(page.getByRole("link", { name: "Back to documents" })).toBeVisible()
  await expect(page.getByRole("link", { name: "Markdown source for AI" })).toBeVisible()
  if (testInfo.project.name === "desktop-1440") {
    await expect(englishToggle).toBeFocused()
  }

  const localeCookie = (await context.cookies(baseURL)).find((cookie) => cookie.name === "laf_locale")
  expect(localeCookie?.value).toBe("en")

  await page.reload()
  await expect(page.locator("html")).toHaveAttribute("lang", "en")
  await expect(page.getByRole("navigation", { name: "Admin" })).toContainText("Documents")
  await expect(page.getByRole("heading", { name: "Markdown writing guide" })).toBeVisible()

  const widths = await page.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    document: document.documentElement.scrollWidth,
  }))
  expect(widths.document).toBeLessThanOrEqual(widths.viewport + 1)

  await page.screenshot({
    path: `test-results/admin-stability-${testInfo.project.name}.png`,
    fullPage: false,
  })

  const staticGuide = await page.goto("/design")
  expect(staticGuide?.status()).toBe(200)
  await expect(page.getByRole("heading", { name: "Design guide" })).toBeVisible()

  const retiredDesignDocument = await page.goto("/design/retired-example")
  expect(retiredDesignDocument?.status()).toBe(404)
})
