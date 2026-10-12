import type { Metadata } from "next"

import { siteUrl } from "@/lib/content"
import type { Locale } from "@/lib/i18n"

const metadataCopy: Record<Locale, { title: string; description: string; openGraphDescription: string }> = {
  ko: {
    title: "채용",
    description: "LafLabs가 다루는 문제와 함께 일하는 기준을 소개합니다.",
    openGraphDescription: "제품에서 찾은 문제를 기반 기술로 만들고 직접 운영하는 LafLabs의 일하는 방식을 소개합니다.",
  },
  en: {
    title: "Careers",
    description: "Explore the problems LafLabs takes on and how we work together.",
    openGraphDescription: "See how LafLabs turns product problems into shared technology and operates what it builds.",
  },
}

export function buildCareersMetadata(locale: Locale): Metadata {
  const copy = metadataCopy[locale]
  return {
    title: copy.title,
    description: copy.description,
    alternates: { canonical: "/careers" },
    openGraph: {
      title: `${copy.title} · LafLabs`,
      description: copy.openGraphDescription,
      locale: locale === "ko" ? "ko_KR" : "en_US",
      url: `${siteUrl}/careers`,
    },
  }
}
