import ReactMarkdown from "react-markdown"
import rehypeSlug from "rehype-slug"
import remarkGfm from "remark-gfm"

import { remarkLafCallouts } from "@/lib/markdown/callouts"
import styles from "./content.module.css"

type MarkdownDocumentProps = {
  source: string
  title: string
}

type CalloutProperties = {
  "data-callout"?: string
  "data-callout-title"?: string
}

function isRootRelative(url: string) {
  return url.startsWith("/") && !url.startsWith("//")
}

function hasAllowedProtocol(url: string, protocols: readonly string[]) {
  try {
    return protocols.includes(new URL(url).protocol)
  } catch {
    return false
  }
}

function transformDocumentUrl(url: string, key: string) {
  if (key === "src") {
    return isRootRelative(url) || hasAllowedProtocol(url, ["https:"])
      ? url
      : undefined
  }

  if (url.startsWith("#") || isRootRelative(url)) return url

  return hasAllowedProtocol(url, ["http:", "https:", "mailto:"])
    ? url
    : undefined
}

function isExternalLink(href: string | undefined) {
  if (!href) return false

  try {
    const protocol = new URL(href).protocol
    return protocol === "http:" || protocol === "https:"
  } catch {
    return false
  }
}

function withoutNode<T extends { node?: unknown }>({ node, ...props }: T): Omit<T, "node"> {
  void node
  return props
}

function classNames(...names: Array<string | undefined>) {
  return names.filter(Boolean).join(" ")
}

export function MarkdownDocument({ source, title }: MarkdownDocumentProps) {
  return (
    <article className={styles.document}>
      <h1 className={styles.title}>{title}</h1>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkLafCallouts]}
        rehypePlugins={[rehypeSlug]}
        urlTransform={transformDocumentUrl}
        components={{
          h1: (props) => <h2 className={styles.headingOne} {...withoutNode(props)} />,
          h2: (props) => <h2 className={styles.headingTwo} {...withoutNode(props)} />,
          h3: (props) => <h3 className={styles.headingThree} {...withoutNode(props)} />,
          h4: (props) => <h4 className={styles.headingFour} {...withoutNode(props)} />,
          h5: (props) => <h5 className={styles.headingFive} {...withoutNode(props)} />,
          h6: (props) => <h6 className={styles.headingSix} {...withoutNode(props)} />,
          a: (props) => {
            const attributes = withoutNode(props)

            return (
              <a
                {...attributes}
                className={styles.link}
                rel={isExternalLink(attributes.href) ? "noreferrer noopener" : undefined}
              />
            )
          },
          blockquote: (props) => {
            const { children, ...attributes } = withoutNode(props)
            const calloutProps = attributes as typeof attributes & CalloutProperties
            const callout = calloutProps["data-callout"]
            const title = calloutProps["data-callout-title"]

            return (
              <blockquote
                {...attributes}
                className={callout ? styles.callout : styles.blockquote}
              >
                {callout ? <p className={styles.calloutTitle}>{title}</p> : null}
                {children}
              </blockquote>
            )
          },
          table: (props) => (
            <div className={styles.tableScroll} role="region" aria-label="Scrollable table" tabIndex={0}>
              <table {...withoutNode(props)} />
            </div>
          ),
          pre: (props) => <pre className={styles.pre} {...withoutNode(props)} />,
          code: (props) => {
            const { className, ...attributes } = withoutNode(props)
            return <code {...attributes} className={classNames(styles.code, className)} />
          },
          img: (props) => {
            const { alt, ...attributes } = withoutNode(props)
            // Markdown images are dynamic HTTPS or same-origin public assets.
            // eslint-disable-next-line @next/next/no-img-element
            return <img className={styles.image} alt={alt || "Document image"} {...attributes} />
          },
          ul: (props) => {
            const { className, ...attributes } = withoutNode(props)
            return <ul {...attributes} className={classNames(styles.list, className)} />
          },
          ol: (props) => {
            const { className, ...attributes } = withoutNode(props)
            return <ol {...attributes} className={classNames(styles.list, className)} />
          },
        }}
      >
        {source}
      </ReactMarkdown>
    </article>
  )
}
