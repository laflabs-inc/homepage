"use client"

import type { ConsentChoice } from "@/lib/analytics/types"
import type { Locale } from "@/lib/i18n"
import styles from "./consent-panel.module.css"

const consentCopy = {
  ko: {
    title: "분석 쿠키를 선택해 주세요",
    body: "사이트를 개선하기 위해 익명 사용 통계를 수집합니다. 허용 전에는 분석 정보를 보내지 않습니다.",
    essential: "필수만 사용",
    analytics: "분석 허용",
    settings: "쿠키 설정",
    details: "수집 항목 보기",
    close: "쿠키 설정 닫기",
    dnt: "브라우저의 추적 거부 설정을 존중하여 분석 쿠키를 사용하지 않습니다.",
    events: ["페이지 방문", "제품 클릭", "GitHub 클릭", "문의 클릭", "언어 변경", "분석 동의"],
    retention: "수집한 분석 이벤트는 90일 후 삭제합니다.",
  },
  en: {
    title: "Choose your analytics preference",
    body: "We use anonymous usage statistics to improve the site. No analytics data is sent before you allow it.",
    essential: "Essential only",
    analytics: "Allow analytics",
    settings: "Cookie settings",
    details: "See what is collected",
    close: "Close cookie settings",
    dnt: "We honor your browser's Do Not Track preference and will not use analytics cookies.",
    events: ["Page views", "Product clicks", "GitHub clicks", "Contact clicks", "Language changes", "Analytics consent"],
    retention: "Collected analytics events are deleted after 90 days.",
  },
} as const

type ConsentPanelProps = {
  locale: Locale
  open: boolean
  pending: boolean
  error: string | null
  dnt?: boolean
  onChoose: (choice: ConsentChoice) => void
  onClose: (() => void) | null
}

export function ConsentPanel({
  locale,
  open,
  pending,
  error,
  dnt = false,
  onChoose,
  onClose,
}: ConsentPanelProps) {
  if (!open) return null

  const t = consentCopy[locale]

  return (
    <section
      className={styles.panel}
      aria-label={t.settings}
      aria-busy={pending}
    >
      <div className={styles.intro}>
        <p className={styles.eyebrow}>{t.settings}</p>
        <h2>{t.title}</h2>
        <p className={styles.body}>{t.body}</p>
        {dnt ? <p className={styles.notice}>{t.dnt}</p> : null}
        {error ? <p className={styles.error} role="alert">{error}</p> : null}
      </div>

      {onClose ? (
        <button
          type="button"
          className={styles.close}
          aria-label={t.close}
          onClick={onClose}
          disabled={pending}
        >
          ×
        </button>
      ) : null}

      <div className={styles.actions}>
        <button
          type="button"
          className={styles.choice}
          disabled={pending}
          onClick={() => onChoose("essential")}
        >
          {t.essential}
        </button>
        <button
          type="button"
          className={styles.choice}
          disabled={pending}
          onClick={() => onChoose("analytics")}
        >
          {t.analytics}
        </button>
      </div>

      <details className={styles.details}>
        <summary>{t.details}</summary>
        <ul>
          {t.events.map((eventName) => <li key={eventName}>{eventName}</li>)}
        </ul>
        <p>{t.retention}</p>
      </details>
    </section>
  )
}
