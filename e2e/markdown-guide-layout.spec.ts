import { expect, test } from "@playwright/test"
import { encode } from "next-auth/jwt"

const baseURL = "http://127.0.0.1:3202"
const authSecret = "laflabs-markdown-guide-layout-test-secret"

test("Markdown guide stays within the current viewport", async ({ context, page }, testInfo) => {
  const session = await encode({
    token: {
      sub: "layout-test",
      githubId: "layout-test",
      orgMember: true,
      membershipCheckedAt: Date.now(),
      githubAccessToken: "layout-test",
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
  }])
  await page.goto("/admin/documents/markdown-guide")
  await expect(page.getByRole("heading", { name: "Markdown 작성 가이드" })).toBeVisible()
  const toolbarFont = await page.getByRole("link", { name: "AI용 Markdown 원문" })
    .evaluate((element) => getComputedStyle(element).fontFamily)
  expect(toolbarFont).toContain("Pretendard")

  const widths = await page.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    document: document.documentElement.scrollWidth,
  }))

  expect(widths.document).toBeLessThanOrEqual(widths.viewport + 1)
  await page.screenshot({
    path: `test-results/markdown-guide-${testInfo.project.name}.png`,
    fullPage: false,
  })
})
