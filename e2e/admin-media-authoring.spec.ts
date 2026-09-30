import { expect, test } from "@playwright/test"

const draftId = process.env.E2E_MEDIA_DRAFT_ID
const fixturePath = process.env.E2E_MEDIA_FIXTURE_PATH

test("Admin inserts, verifies, replaces, and inspects immutable media", async ({ page }) => {
  test.skip(
    !draftId || !fixturePath || process.env.E2E_MEDIA_AUTHORING !== "1",
    "Media authoring E2E requires a disposable authenticated draft, fixture image, Blob stores, and E2E_MEDIA_AUTHORING=1.",
  )

  await page.goto(`/admin/documents/${draftId}`)
  await page.getByRole("button", { name: /관리 이미지 삽입|Insert managed image/ }).click()
  await page.getByText(/새 이미지 업로드|Upload a new image/).click()
  await page.getByLabel(/이미지 업로드|Upload images/).setInputFiles(fixturePath!)
  await expect(page.getByText(/준비됨|Ready/)).toBeVisible()

  await page.getByLabel(/대체 텍스트|Alternative text/).fill("Media authoring E2E fixture")
  await page.getByRole("button", { name: /이미지 삽입|Insert image/ }).click()
  await page.getByRole("button", { name: /초안 저장|Save draft/ }).click()
  await expect(page.getByText(/초안을 저장했습니다|Draft saved/)).toBeVisible()

  const source = page.locator(".cm-content")
  await expect(source).toContainText("/media/")
  const originalPath = (await source.textContent())?.match(/\/media\/[0-9a-f-]+\/[^)\s]+/)?.[0]
  expect(originalPath).toBeTruthy()

  await page.goto("/admin/assets")
  await page.getByRole("button", { name: /사용처 보기|View usage/ }).first().click()
  await expect(page.getByRole("dialog", { name: /문서 사용처|Document usage/ })).toContainText(/E2E|fixture/i)
  await page.getByRole("button", { name: /닫기|Close/ }).click()

  await page.getByRole("button", { name: /새 버전 만들기|Replace/ }).first().click()
  await page.getByLabel(/이미지 업로드|Upload images/).setInputFiles(fixturePath!)
  await expect(page.getByText(/기존 문서 경로는 바뀌지 않았습니다|Existing document paths were not changed/)).toBeVisible()

  await page.goto(`/admin/documents/${draftId}`)
  await expect(page.locator(".cm-content")).toContainText(originalPath!)
})
