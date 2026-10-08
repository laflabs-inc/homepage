import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { DesignShell } from "@/components/design-system/design-shell"
import { RecipeDetail } from "@/components/design-system/recipe-detail"
import { designCatalog, getRecipeEntry } from "@/lib/design-system/catalog"
import { designRecipeSlugs } from "@/lib/design-system/recipe-slugs"
import { resolveDocumentPageLocale } from "../../../locale"

type RecipeDetailPageProps = {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ locale?: string }>
}

export function generateStaticParams() {
  return designRecipeSlugs.map((slug) => ({ slug }))
}

export async function generateMetadata({
  params,
  searchParams,
}: RecipeDetailPageProps): Promise<Metadata> {
  const [{ slug }, locale] = await Promise.all([
    params,
    resolveDocumentPageLocale(searchParams),
  ])
  const recipe = getRecipeEntry(slug)

  if (!recipe) notFound()

  return {
    title: `${recipe.title[locale]} | ${designCatalog.meta.name}`,
    description: recipe.summary[locale],
    alternates: { canonical: `/design/recipes/${recipe.id}` },
  }
}

export default async function RecipeDetailPage({
  params,
  searchParams,
}: RecipeDetailPageProps) {
  const [{ slug }, locale] = await Promise.all([
    params,
    resolveDocumentPageLocale(searchParams),
  ])
  const recipe = getRecipeEntry(slug)

  if (!recipe) notFound()

  return (
    <DesignShell currentPath="/design/recipes" locale={locale}>
      <RecipeDetail locale={locale} recipe={recipe} />
    </DesignShell>
  )
}
