import type { Metadata } from "next"

import { ComponentIndex } from "@/components/design-system/component-index"
import { DesignShell } from "@/components/design-system/design-shell"
import { designCatalog, designPageEntries } from "@/lib/design-system/catalog"
import { resolveDocumentPageLocale } from "../../locale"

const pageEntry = designPageEntries.find((entry) => entry.id === "components")

type ComponentsPageProps = {
  searchParams: Promise<{ locale?: string }>
}

export async function generateMetadata({ searchParams }: ComponentsPageProps): Promise<Metadata> {
  const locale = await resolveDocumentPageLocale(searchParams)

  return {
    title: `${pageEntry?.title[locale] ?? "Components"} | ${designCatalog.meta.name}`,
    description: pageEntry?.description[locale],
    alternates: { canonical: "/design/components" },
  }
}

export default async function ComponentsPage({ searchParams }: ComponentsPageProps) {
  const locale = await resolveDocumentPageLocale(searchParams)

  return (
    <DesignShell locale={locale} currentPath="/design/components">
      <ComponentIndex locale={locale} />
    </DesignShell>
  )
}
