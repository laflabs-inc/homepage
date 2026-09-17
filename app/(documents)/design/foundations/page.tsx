import type { Metadata } from "next"

import { DesignShell } from "@/components/design-system/design-shell"
import { FoundationsGuide } from "@/components/design-system/foundations-guide"
import { designCatalog, designPageEntries } from "@/lib/design-system/catalog"
import { resolveDocumentPageLocale } from "../../locale"

const pageEntry = designPageEntries.find((entry) => entry.id === "foundations")

export const metadata: Metadata = {
  title: `${pageEntry?.title.en ?? "Foundations"} | ${designCatalog.meta.name}`,
  description: pageEntry?.description.ko,
  alternates: { canonical: "/design/foundations" },
}

export default async function FoundationsPage({
  searchParams,
}: {
  searchParams: Promise<{ locale?: string }>
}) {
  const query = await searchParams
  const locale = await resolveDocumentPageLocale(Promise.resolve(query))

  return (
    <DesignShell locale={locale} currentPath="/design/foundations">
      <FoundationsGuide locale={locale} />
    </DesignShell>
  )
}
