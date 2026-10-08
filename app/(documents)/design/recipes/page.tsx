import type { Metadata } from "next"

import { DesignShell } from "@/components/design-system/design-shell"
import { RecipeIndex } from "@/components/design-system/recipe-index"
import { designCatalog, designPageEntries } from "@/lib/design-system/catalog"
import { resolveDocumentPageLocale } from "../../locale"

const pageEntry = designPageEntries.find((entry) => entry.id === "recipes")

type RecipesPageProps = {
  searchParams: Promise<{ locale?: string }>
}

export async function generateMetadata({ searchParams }: RecipesPageProps): Promise<Metadata> {
  const locale = await resolveDocumentPageLocale(searchParams)

  return {
    title: `${pageEntry?.title[locale] ?? "Recipes"} | ${designCatalog.meta.name}`,
    description: pageEntry?.description[locale],
    alternates: { canonical: "/design/recipes" },
  }
}

export default async function RecipesPage({ searchParams }: RecipesPageProps) {
  const locale = await resolveDocumentPageLocale(searchParams)

  return (
    <DesignShell currentPath="/design/recipes" locale={locale}>
      <RecipeIndex locale={locale} />
    </DesignShell>
  )
}
