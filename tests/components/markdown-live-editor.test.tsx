import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

vi.mock("@/components/admin/asset-picker-dialog", () => ({
  AssetPickerDialog: ({ open, onSelect }: { open: boolean; onSelect: (value: { src: string; alt: string }) => void }) => open
    ? <button onClick={() => onSelect({ src: "/media/11111111-1111-4111-8111-111111111111/image.png", alt: "Architecture" })}>Choose fixture</button>
    : null,
}))
vi.mock("@/app/admin/admin.module.css", () => ({
  default: new Proxy({}, { get: (_target, property) => String(property) }),
}))

import { MarkdownLiveEditor } from "@/components/admin/markdown-live-editor"
import { LocaleProvider } from "@/components/i18n/locale-provider"

describe("MarkdownLiveEditor managed media", () => {
  it("inserts one stable image block and emits one document change", async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    vi.spyOn(window, "requestAnimationFrame").mockImplementation((callback) => {
      callback(0)
      return 1
    })
    render(
      <LocaleProvider initialLocale="en">
        <MarkdownLiveEditor value="Intro" onChange={onChange} documentLocale="en" />
      </LocaleProvider>,
    )

    await user.click(screen.getByRole("button", { name: "Insert managed image" }))
    await user.click(screen.getByRole("button", { name: "Choose fixture" }))

    await waitFor(() => expect(onChange).toHaveBeenCalledTimes(1))
    expect(onChange).toHaveBeenCalledWith(
      "![Architecture](/media/11111111-1111-4111-8111-111111111111/image.png)\n\nIntro",
    )
  })
})
