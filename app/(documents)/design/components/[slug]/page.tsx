import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { ComponentDetail } from "@/components/design-system/component-detail"
import { DesignShell } from "@/components/design-system/design-shell"
import { designCatalog, getComponentEntry } from "@/lib/design-system/catalog"
import { resolveDocumentPageLocale } from "../../../locale"

type ComponentDetailPageProps = {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ locale?: string }>
}

export function generateStaticParams() {
  return designCatalog.components.map(({ id }) => ({ slug: id }))
}

export async function generateMetadata({
  params,
  searchParams,
}: ComponentDetailPageProps): Promise<Metadata> {
  const [{ slug }, locale] = await Promise.all([
    params,
    resolveDocumentPageLocale(searchParams),
  ])
  const component = getComponentEntry(slug)

  if (!component) notFound()

  return {
    title: `${component.name} | ${designCatalog.meta.name}`,
    description: component.summary[locale],
    alternates: { canonical: `/design/components/${component.id}` },
  }
}

export default async function ComponentDetailPage({
  params,
  searchParams,
}: ComponentDetailPageProps) {
  const [{ slug }, locale] = await Promise.all([
    params,
    resolveDocumentPageLocale(searchParams),
  ])
  const component = getComponentEntry(slug)

  if (!component) notFound()

  return (
    <DesignShell locale={locale} currentPath="/design/components">
      <ComponentDetail component={component} locale={locale} />
    </DesignShell>
  )
}
