"use client"

import { Button } from "@/components/ui/button"
import { ToastProvider, useToast } from "@/components/ui/toast"
import type { ComponentDemoProps } from "./component-demo-registry"
import styles from "./design-system.module.css"

function ToastActions({ locale, state }: ComponentDemoProps) {
  const toast = useToast()
  const persistent = state === "persistent"

  return (
    <div className={styles.demoC3cActions}>
      <Button
        onClick={() => toast.success(
          locale === "ko" ? "문서를 저장했습니다." : "Document saved.",
          {
            description: locale === "ko" ? "변경 내용이 공개 초안에 반영됐습니다." : "Changes are now in the public draft.",
            duration: persistent ? 0 : undefined,
          },
        )}
      >
        {locale === "ko" ? "저장 알림" : "Save notice"}
      </Button>
      <Button
        onClick={() => toast.error(
          locale === "ko" ? "업로드하지 못했습니다." : "Upload failed.",
          {
            action: {
              label: locale === "ko" ? "다시 시도" : "Retry",
              onClick: () => undefined,
            },
            description: locale === "ko" ? "연결을 확인한 뒤 다시 시도해 주세요." : "Check the connection and try again.",
            duration: persistent ? 0 : undefined,
          },
        )}
        variant="secondary"
      >
        {locale === "ko" ? "오류 알림" : "Error notice"}
      </Button>
      <Button
        onClick={() => toast.info(
          locale === "ko" ? "문서를 보관했습니다." : "Document archived.",
          {
            action: {
              label: locale === "ko" ? "되돌리기" : "Undo",
              onClick: () => undefined,
            },
            duration: persistent ? 0 : undefined,
          },
        )}
        variant="secondary"
      >
        {locale === "ko" ? "되돌리기 알림" : "Undo notice"}
      </Button>
    </div>
  )
}

export function ToastDemo(props: ComponentDemoProps) {
  return (
    <ToastProvider
      closeLabel={props.locale === "ko" ? "알림 닫기" : "Dismiss notification"}
      viewportLabel={props.locale === "ko" ? "알림" : "Notifications"}
    >
      <ToastActions {...props} />
    </ToastProvider>
  )
}
