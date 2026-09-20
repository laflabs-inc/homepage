"use client"

import { useEffect, useRef, useState, type ReactNode } from "react"

import styles from "./content.module.css"

const languageNames: Record<string, string> = {
  bash: "Bash",
  diff: "Diff",
  js: "JavaScript",
  javascript: "JavaScript",
  json: "JSON",
  py: "Python",
  python: "Python",
  sh: "Shell",
  shell: "Shell",
  sql: "SQL",
  ts: "TypeScript",
  typescript: "TypeScript",
  yaml: "YAML",
  yml: "YAML",
}

export type CodeBlockCopyLabels = Readonly<{
  buttonLabel: string
  copyText: string
  copiedText: string
  retryText: string
  copiedStatus: string
  errorStatus: string
}>

export function codeLanguageName(language?: string) {
  if (!language) return "Plain text"
  return languageNames[language.toLowerCase()] ?? language
}

export function CodeBlock({
  children,
  language,
  source,
  copyLabels,
}: {
  children: ReactNode
  language?: string
  source: string
  copyLabels?: CodeBlockCopyLabels
}) {
  const [status, setStatus] = useState<"idle" | "copied" | "error">("idle")
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const languageName = codeLanguageName(language)
  const labels = copyLabels ?? {
    buttonLabel: `Copy ${languageName} code`,
    copyText: "COPY",
    copiedText: "COPIED",
    retryText: "RETRY",
    copiedStatus: `${languageName} code copied to clipboard.`,
    errorStatus: `Could not copy ${languageName} code. Try again.`,
  }
  const statusMessage = status === "copied"
    ? labels.copiedStatus
    : status === "error"
      ? labels.errorStatus
      : ""

  useEffect(() => () => {
    if (resetTimer.current) clearTimeout(resetTimer.current)
  }, [])

  async function copySource() {
    try {
      await navigator.clipboard.writeText(source)
      setStatus("copied")
    } catch {
      setStatus("error")
    }

    if (resetTimer.current) clearTimeout(resetTimer.current)
    resetTimer.current = setTimeout(() => setStatus("idle"), 1800)
  }

  return (
    <div className={styles.codeBlock}>
      <div className={styles.codeToolbar}>
        <span>{languageName}</span>
        <button type="button" onClick={copySource} aria-label={labels.buttonLabel}>
          {status === "copied" ? labels.copiedText : status === "error" ? labels.retryText : labels.copyText}
        </button>
        <span className={styles.srOnly} role="status" aria-live="polite" aria-atomic="true">
          {statusMessage}
        </span>
      </div>
      <pre className={styles.pre}>{children}</pre>
    </div>
  )
}
