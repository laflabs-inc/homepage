import { PgDialect } from "drizzle-orm/pg-core"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { createDocumentCategoryStore } from "@/lib/document-categories/store"

const execute = vi.fn()
const store = createDocumentCategoryStore({ execute })
const actor = { githubId: "github:42", name: "Laf Admin" }
const row = {
  id: "00000000-0000-4000-8000-000000000001",
  kind: "notice" as const,
  slug: "general",
  labelKo: "일반",
  labelEn: "General",
  sortOrder: 0,
  active: true,
  version: 1,
  createdBy: actor.githubId,
  updatedBy: actor.githubId,
  createdAt: new Date("2026-08-31T00:00:00Z"),
  updatedAt: new Date("2026-08-31T00:00:00Z"),
}

beforeEach(() => execute.mockReset())

describe("document category store", () => {
  it("lists categories in stable kind and order sequence", async () => {
    execute.mockResolvedValue({ rows: [row] })

    await expect(store.list({ kind: "notice", active: true })).resolves.toEqual([row])

    const compiled = new PgDialect().sqlToQuery(execute.mock.calls[0][0])
    const normalized = compiled.sql.replace(/\s+/g, " ").toLowerCase()
    expect(normalized).toContain('where c."kind" =')
    expect(normalized).toContain('and c."active" =')
    expect(normalized).toContain('order by "kind" asc, "sort_order" asc, "slug" asc')
  })

  it("creates and audits a category in one statement", async () => {
    execute.mockResolvedValue({ rows: [{ updateStatus: "created", ...row }] })

    await expect(store.create({
      kind: "notice",
      slug: "general",
      labelKo: "일반",
      labelEn: "General",
      sortOrder: 0,
    }, actor)).resolves.toEqual({ status: "created", category: row })

    const compiled = new PgDialect().sqlToQuery(execute.mock.calls[0][0])
    const normalized = compiled.sql.replace(/\s+/g, " ").toLowerCase()
    expect(normalized).toContain('insert into "document_categories"')
    expect(normalized).toContain('on conflict ("kind","slug") do nothing')
    expect(normalized).toContain('insert into "admin_audit_log"')
    expect(normalized).toContain("'document_category.create'")
    const audit = normalized.slice(normalized.indexOf("audit_entry as"), normalized.indexOf("select 'created'"))
    expect(audit).not.toContain('"label_ko"')
  })

  it("returns a stable slug conflict without a partial audit", async () => {
    execute.mockResolvedValue({ rows: [{ updateStatus: "slug_conflict" }] })

    await expect(store.create({
      kind: "notice",
      slug: "general",
      labelKo: "일반",
      labelEn: "General",
      sortOrder: 0,
    }, actor)).resolves.toEqual({ status: "slug_conflict" })
  })

  it("uses one locked statement for a complete reorder", async () => {
    execute.mockResolvedValue({
      rows: [{ updateStatus: "updated", categories: [row] }],
    })

    await expect(store.reorder({
      kind: "notice",
      items: [{ id: row.id, version: 1 }],
    }, actor)).resolves.toEqual({ status: "updated", categories: [row] })

    const compiled = new PgDialect().sqlToQuery(execute.mock.calls[0][0])
    const normalized = compiled.sql.replace(/\s+/g, " ").toLowerCase()
    expect(normalized).toContain("for update")
    expect(normalized).toContain("jsonb_to_recordset")
    expect(normalized).toContain("category_set_changed")
    expect(normalized).toContain("version_conflict")
    expect(normalized).toContain("'document_category.reorder'")
  })

  it("updates labels without placing them in audit metadata", async () => {
    execute.mockResolvedValue({ rows: [{ updateStatus: "updated", ...row, version: 2 }] })

    await store.update(row.id, {
      labelKo: "새 일반",
      labelEn: "New general",
      sortOrder: 0,
      active: true,
      version: 1,
    }, actor)

    const compiled = new PgDialect().sqlToQuery(execute.mock.calls[0][0])
    const normalized = compiled.sql.replace(/\s+/g, " ").toLowerCase()
    const audit = normalized.slice(
      normalized.indexOf("audit_entry as"),
      normalized.indexOf("select update_decision"),
    )
    expect(audit).toContain("'document_category.update'")
    expect(audit).toContain("'changedfields'")
    expect(audit).not.toContain('updated_category."label_ko"')
    expect(audit).not.toContain('updated_category."label_en"')
  })
})
