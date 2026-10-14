import { AdminPage, AdminPageHeader } from "@/components/admin/admin-page"
import styles from "@/components/admin/asset-library.module.css"
import { Skeleton } from "@/components/ui/skeleton"

export default function AssetsLoading() {
  return (
    <AdminPage aria-busy="true" aria-label="Loading asset library">
      <AdminPageHeader
        eyebrow={<span className={styles.loadingEyebrow} />}
        title={<span className={styles.loadingTitle} />}
        description={<span className={styles.loadingDescription} />}
      />
      <Skeleton className={styles.loadingUpload} />
      <div className={styles.loadingGrid}>
        <Skeleton />
        <Skeleton />
        <Skeleton />
      </div>
    </AdminPage>
  )
}
