import Link from "next/link"

import styles from "@/components/content/content.module.css"

export default function DocumentNotFound() {
  return (
    <section className={styles.page}>
      <div className={styles.unavailableState}>
        <span aria-hidden="true">□</span>
        <h1>문서를 찾을 수 없습니다.</h1>
        <p>게시되지 않았거나 더 이상 제공되지 않는 문서입니다.</p>
        <Link href="/">홈으로 돌아가기</Link>
      </div>
    </section>
  )
}
