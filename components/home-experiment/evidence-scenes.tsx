"use client"

import { useReducedMotion } from "motion/react"

import type { HomeExperimentArtifact, HomeExperimentCopy } from "@/lib/home-experiment"
import type { Locale } from "@/lib/i18n"

import styles from "./evidence-scenes.module.css"

type CompactSceneProps = {
  compact?: boolean
}

type ArtifactSceneProps = CompactSceneProps & {
  artifact: HomeExperimentArtifact
  locale: Locale
}

type MethodItem = HomeExperimentCopy["method"]["items"][number]

function sceneState(reducedMotion: boolean | null) {
  return reducedMotion ? "complete" : "animated"
}

function sceneClass(compact: boolean) {
  return compact ? `${styles.scene} ${styles.compact}` : styles.scene
}

export function BuildScene({
  compact = false,
  label,
}: CompactSceneProps & { label: string }) {
  const reducedMotion = useReducedMotion()

  return (
    <figure
      aria-label={label}
      className={sceneClass(compact)}
      data-compact={String(compact)}
      data-evidence-scene="build"
      data-motion-state={sceneState(reducedMotion)}
    >
      <figcaption className={styles.sceneCaption}>
        <span>BUILD / 001</span>
        <strong>{label}</strong>
      </figcaption>

      <div className={styles.buildWorkspace}>
        <div className={styles.editorPane}>
          <div className={styles.windowBar}>
            <span>index.html</span>
            <span>HTML</span>
          </div>
          <pre className={styles.code} aria-label="HTML build source"><code>
            <span><i>01</i><b>&lt;main</b> class=<em>&quot;laf&quot;</em><b>&gt;</b></span>
            <span><i>02</i>  <b>&lt;h1&gt;</b>LAF<b>&lt;/h1&gt;</b></span>
            <span><i>03</i>  <b>&lt;footer&gt;</b></span>
            <span><i>04</i>    SOFTWARE · SEOUL</span>
            <span><i>05</i>  <b>&lt;/footer&gt;</b></span>
            <span><i>06</i><b>&lt;/main&gt;</b><mark aria-hidden="true" /></span>
          </code></pre>
          <div className={styles.runLine}>
            <span>RUN / 01</span>
            <span aria-hidden="true" />
            <b>READY</b>
          </div>
        </div>

        <svg className={styles.buildRoute} viewBox="0 0 80 48" aria-hidden="true">
          <path d="M4 24H68" />
          <path d="m61 17 7 7-7 7" />
        </svg>

        <div className={styles.renderPane}>
          <div className={styles.renderMeta}>
            <span>LAF / OUTPUT</span>
            <span>01:01</span>
          </div>
          <strong className={styles.renderMark}>LAF</strong>
          <div className={styles.renderFooter}>
            <span>SOFTWARE</span>
            <span>SEOUL / KR</span>
          </div>
        </div>
      </div>
    </figure>
  )
}

export function MethodScene({
  compact = false,
  item,
}: CompactSceneProps & { item: MethodItem }) {
  const reducedMotion = useReducedMotion()
  const sceneId = `method-${item.mark.toLowerCase()}`

  return (
    <figure
      aria-label={item.caption}
      className={`${sceneClass(compact)} ${styles.methodScene}`}
      data-compact={String(compact)}
      data-evidence-scene={sceneId}
      data-motion-state={sceneState(reducedMotion)}
    >
      <figcaption className={styles.methodCaption}>
        <span>{item.mark}</span>
        <strong>{item.title}</strong>
      </figcaption>

      <div className={styles.methodCanvas}>
        <svg className={styles.methodRoute} viewBox="0 0 560 210" aria-hidden="true">
          <path d="M40 108H188L252 44H520" />
          <path d="M188 108 252 172H520" />
          <rect x="32" y="100" width="16" height="16" />
          <rect x="512" y="36" width="16" height="16" />
          <rect x="512" y="164" width="16" height="16" />
        </svg>
        <div className={styles.methodNote}>
          <span>{item.mark} / FIELD NOTE</span>
          <p>{item.caption}</p>
        </div>
        <strong className={styles.methodMark} aria-hidden="true">{item.mark}</strong>
      </div>
    </figure>
  )
}

export function IdentityArtifact({ artifact, compact = false, locale }: ArtifactSceneProps) {
  const reducedMotion = useReducedMotion()

  return (
    <figure
      aria-label={artifact.label[locale]}
      className={sceneClass(compact)}
      data-compact={String(compact)}
      data-evidence-scene="identity"
      data-motion-state={sceneState(reducedMotion)}
    >
      <ArtifactHeader artifact={artifact} locale={locale} meta="OAuth 2.0 / OIDC" />
      <div className={styles.identityBody}>
        <div className={styles.requestPane}>
          <span className={styles.miniLabel}>REQUEST</span>
          <strong>/authorize</strong>
          <dl>
            <div><dt>response_type</dt><dd>code</dd></div>
            <div><dt>scope</dt><dd>openid</dd></div>
            <div><dt>state</dt><dd>verified</dd></div>
          </dl>
        </div>
        <svg className={styles.identityRoute} viewBox="0 0 420 94" aria-hidden="true">
          <path d="M22 47H398" />
          <rect x="16" y="41" width="12" height="12" />
          <rect x="204" y="41" width="12" height="12" />
          <rect x="392" y="41" width="12" height="12" />
        </svg>
        <ol className={styles.identitySteps}>
          {artifact.lines.map((line, index) => (
            <li key={line}><span>{String(index + 1).padStart(2, "0")}</span><strong>{line}</strong></li>
          ))}
        </ol>
      </div>
    </figure>
  )
}

export function LafetchArtifact({ artifact, compact = false, locale }: ArtifactSceneProps) {
  const reducedMotion = useReducedMotion()

  return (
    <figure
      aria-label={artifact.label[locale]}
      className={sceneClass(compact)}
      data-compact={String(compact)}
      data-evidence-scene="lafetch"
      data-motion-state={sceneState(reducedMotion)}
    >
      <ArtifactHeader artifact={artifact} locale={locale} meta="client.ts / TypeScript" />
      <div className={styles.codeArtifact}>
        <div className={styles.fileRail} aria-hidden="true">
          <span>src</span>
          <strong>client.ts</strong>
          <span>types.ts</span>
          <span>README.md</span>
        </div>
        <pre aria-label={artifact.label[locale]}><code>
          {artifact.lines.map((line, index) => (
            <span key={`${index}-${line}`}><i>{String(index + 1).padStart(2, "0")}</i>{line}</span>
          ))}
        </code></pre>
        <div className={styles.codeResult}>
          <span>REQUEST</span>
          <strong>GET /users/123</strong>
          <b>200</b>
        </div>
      </div>
    </figure>
  )
}

export function LafwallArtifact({ artifact, compact = false, locale }: ArtifactSceneProps) {
  const reducedMotion = useReducedMotion()

  return (
    <figure
      aria-label={artifact.label[locale]}
      className={sceneClass(compact)}
      data-compact={String(compact)}
      data-evidence-scene="lafwall"
      data-motion-state={sceneState(reducedMotion)}
    >
      <ArtifactHeader artifact={artifact} locale={locale} meta="ARCHITECTURE STUDY" />
      <div className={styles.wallCanvas}>
        <svg className={styles.wallRoute} viewBox="0 0 620 270" aria-hidden="true">
          <path d="M40 135H146M474 135H580" />
          <path d="M198 72H422V198H198Z" />
          <path d="M246 104H374V166H246Z" />
          <rect x="32" y="127" width="16" height="16" />
          <rect x="572" y="127" width="16" height="16" />
        </svg>
        <span className={styles.wallEdge}>API</span>
        <strong className={styles.wallCore}>SECRET</strong>
        <ol className={styles.wallPrinciples}>
          {artifact.lines.map((line, index) => (
            <li key={line}><span>{String(index + 1).padStart(2, "0")}</span>{line}</li>
          ))}
        </ol>
      </div>
    </figure>
  )
}

function ArtifactHeader({
  artifact,
  locale,
  meta,
}: {
  artifact: HomeExperimentArtifact
  locale: Locale
  meta: string
}) {
  return (
    <figcaption className={styles.artifactHeader}>
      <span>{artifact.label[locale]}</span>
      <strong>{artifact.title[locale]}</strong>
      <small>{meta}</small>
    </figcaption>
  )
}
