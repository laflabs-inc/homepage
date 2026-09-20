import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
  Label,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { NativeSelect } from "@/components/ui/native-select"
import { Textarea } from "@/components/ui/textarea"

describe("Field", () => {
  it("connects the label, required state, description, and error to its control", () => {
    render(
      <Field invalid required>
        <FieldLabel>Email</FieldLabel>
        <Input aria-describedby="external-help" name="email" />
        <FieldDescription>Work address only.</FieldDescription>
        <FieldError>Enter a valid address.</FieldError>
      </Field>,
    )

    const input = screen.getByRole("textbox", { name: /Email/ })
    expect(input).toBeRequired()
    expect(input).toHaveAttribute("aria-invalid", "true")
    expect(input.getAttribute("aria-describedby")?.split(" ")).toEqual([
      "external-help",
      expect.stringMatching(/-description$/),
      expect.stringMatching(/-error$/),
    ])
    expect(screen.getByText("Work address only.")).toHaveAttribute(
      "id",
      expect.stringMatching(/-description$/),
    )
    expect(screen.getByText("Enter a valid address.")).toHaveAttribute(
      "id",
      expect.stringMatching(/-error$/),
    )
  })

  it("preserves caller control values and removes duplicate described-by IDs", () => {
    render(
      <Field invalid required>
        <FieldLabel htmlFor="custom-account">Account</FieldLabel>
        <Input
          aria-describedby="custom-help custom-help"
          aria-invalid="false"
          id="custom-account"
          required={false}
        />
        <FieldDescription>Account ID.</FieldDescription>
      </Field>,
    )

    const input = screen.getByRole("textbox", { name: "Account" })
    expect(input).toHaveAttribute("id", "custom-account")
    expect(input).not.toBeRequired()
    expect(input).toHaveAttribute("aria-invalid", "false")
    expect(input.getAttribute("aria-describedby")?.split(" ")).toEqual([
      "custom-help",
      expect.stringMatching(/-description$/),
    ])
  })

  it("does not reference compound parts that render no content", () => {
    render(
      <Field>
        <FieldLabel>Name</FieldLabel>
        <Input />
        <FieldDescription>{""}</FieldDescription>
        <FieldError>{null}</FieldError>
      </Field>,
    )

    expect(screen.getByRole("textbox", { name: "Name" })).not.toHaveAttribute("aria-describedby")
  })

  it("gives separate fields unique control IDs", () => {
    render(
      <>
        <Field><FieldLabel>First</FieldLabel><Input /></Field>
        <Field><FieldLabel>Second</FieldLabel><Input /></Field>
      </>,
    )

    const first = screen.getByRole("textbox", { name: "First" })
    const second = screen.getByRole("textbox", { name: "Second" })
    expect(first.id).not.toBe(second.id)
  })

  it("supports a standalone native label", () => {
    render(<><Label htmlFor="outside">Outside field</Label><Input id="outside" /></>)
    expect(screen.getByRole("textbox", { name: "Outside field" })).toHaveAttribute("id", "outside")
  })
})

describe("native form controls", () => {
  it("forwards textarea rows, name, and disabled state", () => {
    render(<Textarea aria-label="Details" disabled name="details" rows={7} />)
    const textarea = screen.getByRole("textbox", { name: "Details" })
    expect(textarea).toBeDisabled()
    expect(textarea).toHaveAttribute("name", "details")
    expect(textarea).toHaveAttribute("rows", "7")
  })

  it("keeps a native select as the only interactive element", () => {
    render(
      <Field>
        <FieldLabel>Category</FieldLabel>
        <NativeSelect name="category" defaultValue="general">
          <option value="general">General</option>
          <option value="legal">Legal</option>
        </NativeSelect>
      </Field>,
    )

    const select = screen.getByRole("combobox", { name: "Category" })
    expect(select).toHaveValue("general")
    expect(select).toHaveAttribute("name", "category")
    expect(screen.getAllByRole("combobox")).toHaveLength(1)
  })
})
