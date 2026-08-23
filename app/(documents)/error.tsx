"use client"

import styles from "@/components/content/content.module.css"

export default function DocumentError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <section className={styles.page} role="alert">
      <div className={styles.unavailableState}>
        <span aria-hidden="true">□</span>
        <h1>문서를 불러오지 못했습니다.</h1>
        <p>잠시 후 다시 시도해 주세요. 홈페이지와 다른 서비스는 계속 이용할 수 있습니다.</p>
        <button type="button" onClick={reset}>다시 시도</button>
      </div>
    </section>
  )
}
