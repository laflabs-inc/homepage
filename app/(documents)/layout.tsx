import { SiteFooter } from "@/components/layout/site-footer"
import { SiteHeader } from "@/components/layout/site-header"

export default function DocumentLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteHeader homeHref="/" />
      <main id="top">{children}</main>
      <SiteFooter homeHref="/" />
    </>
  )
}
