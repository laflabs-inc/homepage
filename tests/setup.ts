import "@testing-library/jest-dom/vitest"
import { cleanup } from "@testing-library/react"
import { afterEach } from "vitest"

Range.prototype.getClientRects ??= () => [] as unknown as DOMRectList
Range.prototype.getBoundingClientRect ??= () => new DOMRect()
globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
}

afterEach(() => cleanup())
