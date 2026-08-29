import { MarkdownDocument } from "@/components/content/markdown-document"
import { markdownAuthoringGuideSource, markdownGuideSections } from "@/lib/markdown/authoring-guide"
import styles from "@/app/admin/admin.module.css"

export function MarkdownAuthoringGuide() {
  return (
    <div className={styles.markdownGuide}>
      <MarkdownDocument
        title="Markdown 작성 가이드"
        source={markdownAuthoringGuideSource}
        intro={(
          <>
            <p className={styles.markdownGuideIntro}>
              문서의 목적에 맞는 문법을 고르고, 바로 아래 예시에서 실제 출력까지 확인하세요.
            </p>
            <nav className={styles.markdownGuideContents} aria-label="가이드 목차">
              <span>빠른 이동</span>
              <div>
                {markdownGuideSections.map(([label, href]) => (
                  <a key={href} href={href}>{label}</a>
                ))}
              </div>
            </nav>
          </>
        )}
      />
    </div>
  )
}
