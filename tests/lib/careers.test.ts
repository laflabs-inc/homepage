import { describe, expect, it } from "vitest"

import { readCareersContent } from "@/lib/careers"

describe("readCareersContent", () => {
  it("returns one complete bilingual careers narrative", () => {
    const content = readCareersContent()

    expect(content.hero.title.ko).toBe("함께 오래 쓸 시스템을 만듭니다.")
    expect(content.hero.title.en).toBe("Build systems that stay useful.")
    expect(content.problems).toHaveLength(3)
    expect(content.principles).toHaveLength(5)
    expect(content.process).toHaveLength(4)
    expect(content.problems.every((item) => item.title.ko && item.title.en)).toBe(true)
    expect(content.principles.every((item) => item.body.ko && item.body.en)).toBe(true)
    expect(content.process.every((item) => item.title.ko && item.title.en)).toBe(true)
    expect(content.openApplication.email).toBe("contact@laflabs.co")
  })

  it("starts with an honest empty role collection", () => {
    const content = readCareersContent()

    expect(content.roles).toEqual([])
    expect(content.roles).not.toBe(readCareersContent().roles)
  })

  it("does not expose mutable shared collections", () => {
    const content = readCareersContent()

    expect(Object.isFrozen(content.problems)).toBe(true)
    expect(Object.isFrozen(content.principles)).toBe(true)
    expect(Object.isFrozen(content.process)).toBe(true)
    expect(Object.isFrozen(content.roles)).toBe(true)
  })
})
