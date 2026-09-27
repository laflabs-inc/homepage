import { describe, expect, it } from "vitest"

import { sanitizeSvg } from "@/lib/assets/svg-sanitizer"

const encode = (value: string) => new TextEncoder().encode(value)

describe("SVG sanitizer", () => {
  it("keeps bounded presentation geometry and local fragment references", () => {
    const result = sanitizeSvg(encode(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 80" role="img">
        <title>Laf mark</title>
        <defs><clipPath id="clip"><rect width="120" height="80" /></clipPath></defs>
        <g clip-path="url(#clip)" fill="#2563eb"><path d="M0 0h120v80H0z" /></g>
      </svg>
    `))

    const output = new TextDecoder().decode(result.bytes)
    expect(result).toMatchObject({ width: 120, height: 80 })
    expect(output).toContain("clip-path=\"url(#clip)\"")
    expect(output).toContain("<title>Laf mark</title>")
  })

  it.each([
    `<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>`,
    `<svg xmlns="http://www.w3.org/2000/svg"><foreignObject><div>html</div></foreignObject></svg>`,
    `<svg xmlns="http://www.w3.org/2000/svg"><use href="https://evil.invalid/a.svg#x" /></svg>`,
    `<svg xmlns="http://www.w3.org/2000/svg"><image href="data:image/png;base64,AA==" /></svg>`,
    `<svg xmlns="http://www.w3.org/2000/svg" onclick="alert(1)"><path d="M0 0" /></svg>`,
    `<svg xmlns="http://www.w3.org/2000/svg"><path style="fill:url(https://evil.invalid/x)" /></svg>`,
    `<!DOCTYPE svg [<!ENTITY xxe SYSTEM "file:///etc/passwd">]><svg>&xxe;</svg>`,
  ])("rejects active or externally-referenced SVG content", (svg) => {
    expect(() => sanitizeSvg(encode(svg))).toThrow(expect.objectContaining({ code: "unsafe_svg" }))
  })

  it("rejects malformed XML instead of repairing it", () => {
    expect(() => sanitizeSvg(encode(`<svg><g></svg>`))).toThrow(
      expect.objectContaining({ code: "unsafe_svg" }),
    )
  })
})
