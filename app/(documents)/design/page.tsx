import type { Metadata } from "next"

import { DesignGuide } from "@/components/content/design-guide"
import { resolveDocumentPageLocale } from "../locale"

export const metadata: Metadata = {
  title: "Design guide",
  description: "LafLabs의 로고, 컬러, 타이포그래피, 인터페이스 원칙과 공식 에셋을 확인합니다.",
  alternates: { canonical: "/design" },
}

export default async function DesignPage({ searchParams }: { searchParams: Promise<{ locale?: string }> }) {
  const query = await searchParams
  const locale = await resolveDocumentPageLocale(Promise.resolve(query))
  return <DesignGuide locale={locale} />
}
