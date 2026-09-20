import type { Metadata } from "next"

import { DesignShell } from "@/components/design-system/design-shell"
import { PatternsGuide } from "@/components/design-system/patterns-guide"
import { designCatalog, designPageEntries } from "@/lib/design-system/catalog"
import { resolveDocumentPageLocale } from "../../locale"

const pageEntry = designPageEntries.find((entry) => entry.id === "patterns")

export const metadata: Metadata = {
  title: `${pageEntry?.title.en ?? "Patterns"} | ${designCatalog.meta.name}`,
  description: pageEntry?.description.ko,
  alternates: { canonical: "/design/patterns" },
}

export default async function PatternsPage({
  searchParams,
}: {
  searchParams: Promise<{ locale?: string }>
}) {
  const query = await searchParams
  const locale = await resolveDocumentPageLocale(Promise.resolve(query))

  return (
    <DesignShell locale={locale} currentPath="/design/patterns">
      <PatternsGuide locale={locale} />
    </DesignShell>
  )
}
