"use client"

import Link from "next/link"
import { useMemo, useState } from "react"

import { Button } from "@/components/ui/button"
import { Field, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { NativeSelect } from "@/components/ui/native-select"
import { recipeCategories, type RecipeCategory } from "@/lib/design-system/recipe-options"
import type { RecipeEntry } from "@/lib/design-system/schema"
import type { Locale } from "@/lib/i18n"
import { getDesignPageHref } from "./design-shell"
import styles from "./design-system.module.css"

type CategoryFilter = "all" | RecipeCategory

const copy = {
  ko: {
    search: "레시피 검색",
    searchPlaceholder: "이름, 목적, 컴포넌트 또는 상태 검색",
    category: "레시피 카테고리",
    all: "모든 카테고리",
    empty: "조건에 맞는 레시피가 없습니다.",
    clear: "레시피 필터 초기화",
    details: (title: string) => `${title} 자세히 보기`,
    components: "사용 컴포넌트",
    categories: {
      action: "동작",
      form: "폼",
      collection: "컬렉션",
      "system-state": "시스템 상태",
    },
  },
  en: {
    search: "Search Recipes",
    searchPlaceholder: "Search names, purpose, components, or states",
    category: "Recipe category",
    all: "All categories",
    empty: "No Recipes match these filters.",
    clear: "Clear Recipe filters",
    details: (title: string) => `${title} details`,
    components: "Components used",
    categories: {
      action: "Action",
      form: "Form",
      collection: "Collection",
      "system-state": "System state",
    },
  },
} as const

function matchesRecipe(recipe: RecipeEntry, query: string, locale: Locale) {
  const normalized = query.trim().toLocaleLowerCase(locale)
  if (!normalized) return true

  return [
    recipe.title[locale],
    recipe.summary[locale],
    ...recipe.components,
    ...recipe.states.map(({ id }) => id),
  ].some((value) => value.toLocaleLowerCase(locale).includes(normalized))
}

export function RecipeIndexClient({
  locale,
  recipes,
}: {
  locale: Locale
  recipes: readonly RecipeEntry[]
}) {
  const text = copy[locale]
  const [query, setQuery] = useState("")
  const [category, setCategory] = useState<CategoryFilter>("all")
  const filteredRecipes = useMemo(
    () => recipes.filter((recipe) =>
      (category === "all" || recipe.category === category)
      && matchesRecipe(recipe, query, locale),
    ),
    [category, locale, query, recipes],
  )

  return (
    <div className={styles.recipeIndex}>
      <div className={styles.recipeFilters} role="search">
        <Field>
          <FieldLabel>{text.search}</FieldLabel>
          <Input
            onChange={(event) => setQuery(event.currentTarget.value)}
            placeholder={text.searchPlaceholder}
            type="search"
            value={query}
          />
        </Field>
        <Field>
          <FieldLabel>{text.category}</FieldLabel>
          <NativeSelect
            onChange={(event) => setCategory(event.currentTarget.value as CategoryFilter)}
            value={category}
          >
            <option value="all">{text.all}</option>
            {recipeCategories.map((value) => (
              <option key={value} value={value}>{text.categories[value]}</option>
            ))}
          </NativeSelect>
        </Field>
      </div>

      {filteredRecipes.length > 0 ? (
        <div className={styles.recipeList}>
          {recipeCategories.map((categoryId) => {
            const categoryRecipes = filteredRecipes.filter((recipe) => recipe.category === categoryId)
            if (categoryRecipes.length === 0) return null

            return (
              <section
                aria-labelledby={`recipe-category-${categoryId}`}
                className={styles.recipeGroup}
                key={categoryId}
              >
                <h2 id={`recipe-category-${categoryId}`}>{text.categories[categoryId]}</h2>
                {categoryRecipes.map((recipe) => (
                  <article className={styles.recipeRow} data-testid="recipe-row" key={recipe.id}>
                    <div className={styles.recipeIdentity}>
                      <span>{text.categories[recipe.category]}</span>
                      <h3>
                        <Link
                          aria-label={text.details(recipe.title[locale])}
                          href={getDesignPageHref(`/design/recipes/${recipe.id}`, locale)}
                        >
                          {recipe.title[locale]}
                        </Link>
                      </h3>
                    </div>
                    <p>{recipe.summary[locale]}</p>
                    <div className={styles.recipeComponents}>
                      <span>{text.components}</span>
                      <ul>
                        {recipe.components.map((componentId) => (
                          <li key={componentId}>
                            <Link href={getDesignPageHref(`/design/components/${componentId}`, locale)}>
                              {componentId}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </article>
                ))}
              </section>
            )
          })}
        </div>
      ) : (
        <div className={styles.recipeEmpty}>
          <p>{text.empty}</p>
          <Button
            onClick={() => {
              setQuery("")
              setCategory("all")
            }}
            variant="secondary"
          >
            {text.clear}
          </Button>
        </div>
      )}
    </div>
  )
}
