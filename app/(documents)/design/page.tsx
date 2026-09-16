import type { Metadata } from "next"

import { DesignOverview } from "@/components/design-system/design-overview"
import { DesignShell } from "@/components/design-system/design-shell"
import { resolveDocumentPageLocale } from "../locale"

export const metadata: Metadata = {
  title: "LafLabs Design System",
  description: "LafLabs 제품과 문서를 설계하고 구현하기 위한 공식 디자인 시스템입니다.",
  alternates: { canonical: "/design" },
}

export default async function DesignPage({ searchParams }: { searchParams: Promise<{ locale?: string }> }) {
  const query = await searchParams
  const locale = await resolveDocumentPageLocale(Promise.resolve(query))
  return (
    <DesignShell locale={locale} currentPath="/design">
      <DesignOverview locale={locale} />
    </DesignShell>
  )
}
