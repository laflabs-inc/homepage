"use client"

import { useSearchParams } from "next/navigation"

import { useLocale } from "@/components/i18n/locale-provider"
import { pickLocale } from "@/lib/i18n"

export function useDocumentRouteLocale() {
  const rootLocale = useLocale()
  const searchParams = useSearchParams()
  return pickLocale(searchParams.get("locale")) ?? rootLocale
}
