import Image from "next/image"

import { designCatalog, designPageEntries } from "@/lib/design-system/catalog"
import type { AssetEntry } from "@/lib/design-system/schema"
import type { Locale } from "@/lib/i18n"
import styles from "./design-system.module.css"

const pageEntry = designPageEntries.find((entry) => entry.id === "assets")
const systemLoopPoster = designCatalog.assets.find((asset) => asset.id === "system-loop-poster")

const downloadLabel = { ko: "다운로드", en: "Download" } as const

function parseRasterDimensions(dimensions: string | undefined): { width: number; height: number } | null {
  const match = dimensions?.match(/^(\d+) × (\d+) px$/)
  if (!match) return null
  return { width: Number(match[1]), height: Number(match[2]) }
}

function AssetPreview({ asset }: { asset: AssetEntry }) {
  const dimensions = parseRasterDimensions(asset.dimensions)

  if (asset.format === "PNG" && dimensions) {
    return (
      <Image
        src={asset.path}
        alt={asset.name}
        width={dimensions.width}
        height={dimensions.height}
        sizes="(max-width: 720px) calc(100vw - 64px), 320px"
      />
    )
  }

  if (asset.format === "WebM" || asset.format === "MP4") {
    return (
      <video
        aria-label={asset.name}
        controls
        playsInline
        poster={systemLoopPoster?.path}
        preload="metadata"
      >
        <source src={asset.path} type={`video/${asset.format.toLowerCase()}`} />
      </video>
    )
  }

  return null
}

export function AssetsGuide({ locale }: { locale: Locale }) {
  if (!pageEntry) return null

  return (
    <article>
      <header className={styles.masthead}>
        <h1>{pageEntry.title[locale]}</h1>
        <p>{pageEntry.description[locale]}</p>
      </header>

      <div className={styles.assetList}>
        {designCatalog.assets.map((asset) => (
          <section className={styles.assetRow} aria-labelledby={`asset-${asset.id}`} key={asset.id}>
            <div className={styles.assetPreview}>
              <AssetPreview asset={asset} />
            </div>
            <div className={styles.assetDetails}>
              <h2 id={`asset-${asset.id}`}>{asset.name}</h2>
              <dl className={styles.assetMetadata}>
                <div>
                  <dt>format</dt>
                  <dd>{asset.format}</dd>
                </div>
                {asset.dimensions ? (
                  <div>
                    <dt>dimensions</dt>
                    <dd>{asset.dimensions}</dd>
                  </div>
                ) : null}
              </dl>
              <p>{asset.usage[locale]}</p>
              {asset.downloadable ? (
                <a className={styles.downloadLink} href={asset.path} download>
                  {downloadLabel[locale]}
                  <span aria-hidden="true">↓</span>
                </a>
              ) : null}
            </div>
          </section>
        ))}
      </div>
    </article>
  )
}
