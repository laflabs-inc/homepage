import { describe, expect, it } from "vitest"

import { toAdminDocumentListRow } from "@/lib/documents/admin-list"
import type { DocumentRevision } from "@/lib/documents/types"

const revision: DocumentRevision = {
  id: "8ca55b3d-a4fc-4a41-b922-a0a9c32d7131",
  seriesId: "c5bcf607-a48f-42b9-af99-55c70ef48640",
  kind: "notice",
  locale: "ko",
  slug: "service-update",
  category: "service",
  pinned: false,
  revision: 2,
  title: "서비스 업데이트",
  summary: "클라이언트 목록에 전달하면 안 되는 요약",
  bodyMarkdown: "x".repeat(200_000),
  status: "published",
  effectiveAt: null,
  scheduledAt: null,
  publishedAt: new Date("2026-08-23T12:00:00.000Z"),
  createdBy: "creator-1",
  updatedBy: "updater-2",
  publishedBy: "publisher-3",
  createdAt: new Date("2026-08-22T12:00:00.000Z"),
  updatedAt: new Date("2026-08-23T12:00:00.000Z"),
}

describe("admin document list rows", () => {
  it("maps complete revisions to an explicit minimal client DTO", () => {
    const row = toAdminDocumentListRow(revision)

    expect(row).toEqual({
      id: revision.id,
      kind: "notice",
      locale: "ko",
      revision: 2,
      title: "서비스 업데이트",
      status: "published",
      publisher: "publisher-3",
      dateLabel: "Published",
      relevantAt: "2026-08-23T12:00:00.000Z",
    })
    expect(row).not.toHaveProperty("summary")
    expect(row).not.toHaveProperty("bodyMarkdown")
    expect(row).not.toHaveProperty("createdBy")
    expect(row).not.toHaveProperty("updatedBy")
    expect(row).not.toHaveProperty("seriesId")
    expect(JSON.stringify(row)).not.toContain("클라이언트 목록에 전달하면 안 되는 요약")
    expect(JSON.stringify(row)).not.toContain("x".repeat(100))
  })
})
