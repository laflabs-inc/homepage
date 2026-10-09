import type { RecipeEntry } from "@/lib/design-system/schema"
import type { Locale } from "@/lib/i18n"
import { DesignCode } from "./design-code"

export function RecipeCode({ recipe, locale }: { recipe: RecipeEntry; locale: Locale }) {
  return <DesignCode locale={locale} source={recipe.usageExample} targetId={recipe.id} />
}
