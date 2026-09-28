import styles from "@/components/admin/asset-library.module.css"
import { Skeleton } from "@/components/ui/skeleton"

export default function AssetsLoading() {
  return (
    <section className={styles.page} aria-busy="true" aria-label="Loading asset library">
      <div className={styles.loadingHeading}>
        <Skeleton />
        <Skeleton />
      </div>
      <Skeleton className={styles.loadingUpload} />
      <div className={styles.loadingGrid}>
        <Skeleton />
        <Skeleton />
        <Skeleton />
      </div>
    </section>
  )
}
