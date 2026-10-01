import { describe, expect, it } from "vitest"
import { MagnifyingGlass } from "@phosphor-icons/react"

import { AccordionContent, AccordionTrigger } from "@/components/ui/accordion"
import { Button } from "@/components/ui/button"
import { ButtonLink } from "@/components/ui/button-link"
import { DialogContent } from "@/components/ui/dialog"
import {
  DropdownMenuCheckboxItem,
  DropdownMenuRadioItem,
  DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu"
import { SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select"

function UnsupportedCompositionProps() {
  return (
    <>
      {/* @ts-expect-error LafLabs owns multiple children in this trigger. */}
      <SelectTrigger asChild />
      {/* @ts-expect-error LafLabs owns the viewport and scroll controls. */}
      <SelectContent asChild />
      {/* @ts-expect-error LafLabs owns item text and selection indicator. */}
      <SelectItem value="one" asChild>One</SelectItem>
      {/* @ts-expect-error LafLabs owns the close control in dialog content. */}
      <DialogContent closeLabel="Close" asChild />
      {/* @ts-expect-error LafLabs owns the trailing submenu indicator. */}
      <DropdownMenuSubTrigger asChild />
      {/* @ts-expect-error LafLabs owns the checkbox indicator. */}
      <DropdownMenuCheckboxItem asChild />
      {/* @ts-expect-error LafLabs owns the radio indicator. */}
      <DropdownMenuRadioItem value="one" asChild />
      {/* @ts-expect-error LafLabs owns the heading and caret structure. */}
      <AccordionTrigger asChild />
      {/* @ts-expect-error LafLabs owns the animated content wrapper. */}
      <AccordionContent asChild />
      {/* @ts-expect-error Icon-only buttons require an accessible name. */}
      <Button size="icon"><MagnifyingGlass aria-hidden /></Button>
      {/* @ts-expect-error Navigation does not expose disabled button semantics. */}
      <ButtonLink href="/design" disabled>Design</ButtonLink>
      {/* @ts-expect-error Navigation does not expose loading button semantics. */}
      <ButtonLink href="/design" loading>Design</ButtonLink>
    </>
  )
}

describe("Core UI composition contracts", () => {
  it("keeps unsupported multi-child composition out of the public types", () => {
    expect(UnsupportedCompositionProps).toBeTypeOf("function")
  })
})
