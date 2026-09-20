import type { Metadata } from "next"

import { AiGuide } from "@/components/design-system/ai-guide"
import { DesignShell } from "@/components/design-system/design-shell"
import { designCatalog, designPageEntries } from "@/lib/design-system/catalog"
import { resolveDocumentPageLocale } from "../../locale"

const pageEntry = designPageEntries.find((entry) => entry.id === "ai")

export const metadata: Metadata = {
  title: `${pageEntry?.title.en ?? "Use with AI"} | ${designCatalog.meta.name}`,
  description: pageEntry?.description.ko,
  alternates: { canonical: "/design/ai" },
}

export default async function AiPage({
  searchParams,
}: {
  searchParams: Promise<{ locale?: string }>
}) {
  const query = await searchParams
  const locale = await resolveDocumentPageLocale(Promise.resolve(query))

  return (
    <DesignShell locale={locale} currentPath="/design/ai">
      <AiGuide locale={locale} />
    </DesignShell>
  )
}
