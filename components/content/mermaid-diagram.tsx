"use client"

import { useEffect, useId, useState } from "react"

import styles from "./content.module.css"

let mermaidConfigured = false

export function MermaidDiagram({ source }: { source: string }) {
  const instanceId = useId().replace(/[^a-zA-Z0-9_-]/g, "")
  const [svg, setSvg] = useState<string | null>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function renderDiagram() {
      try {
        const { default: mermaid } = await import("mermaid")
        if (!mermaidConfigured) {
          mermaid.initialize({
            startOnLoad: false,
            securityLevel: "strict",
            theme: "base",
            themeVariables: {
              background: "#f8fafc",
              primaryColor: "#dbeafe",
              primaryTextColor: "#0f172a",
              primaryBorderColor: "#2563eb",
              lineColor: "#1e40af",
              secondaryColor: "#eff6ff",
              tertiaryColor: "#f8fafc",
              fontFamily: "Pretendard, Geist Sans, sans-serif",
            },
          })
          mermaidConfigured = true
        }

        const rendered = await mermaid.render(`laf-mermaid-${instanceId}`, source)
        if (!cancelled) setSvg(rendered.svg)
      } catch {
        if (!cancelled) setFailed(true)
      }
    }

    void renderDiagram()
    return () => { cancelled = true }
  }, [instanceId, source])

  return (
    <figure className={styles.diagram} aria-label="Mermaid diagram">
      <figcaption>
        <span>DIAGRAM / MERMAID</span>
        <span>{failed ? "RENDER ERROR" : svg ? "READY" : "RENDERING"}</span>
      </figcaption>
      {svg ? (
        <div className={styles.diagramCanvas} dangerouslySetInnerHTML={{ __html: svg }} />
      ) : failed ? (
        <div className={styles.diagramFallback}>
          <p>다이어그램 문법을 확인해 주세요.</p>
          <pre><code>{source}</code></pre>
        </div>
      ) : (
        <div className={styles.diagramLoading}>다이어그램을 그리는 중입니다.</div>
      )}
    </figure>
  )
}
