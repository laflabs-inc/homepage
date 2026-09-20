import type { Metadata } from "next"

import { AssetsGuide } from "@/components/design-system/assets-guide"
import { DesignShell } from "@/components/design-system/design-shell"
import { designCatalog, designPageEntries } from "@/lib/design-system/catalog"
import { resolveDocumentPageLocale } from "../../locale"

const pageEntry = designPageEntries.find((entry) => entry.id === "assets")

export const metadata: Metadata = {
  title: `${pageEntry?.title.en ?? "Assets"} | ${designCatalog.meta.name}`,
  description: pageEntry?.description.ko,
  alternates: { canonical: "/design/assets" },
}

export default async function AssetsPage({
  searchParams,
}: {
  searchParams: Promise<{ locale?: string }>
}) {
  const query = await searchParams
  const locale = await resolveDocumentPageLocale(Promise.resolve(query))

  return (
    <DesignShell locale={locale} currentPath="/design/assets">
      <AssetsGuide locale={locale} />
    </DesignShell>
  )
}
