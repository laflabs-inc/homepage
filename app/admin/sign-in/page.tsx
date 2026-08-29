import { signIn } from "@/auth"
import { adminCopy } from "@/lib/admin/i18n"
import { getAdminLocale } from "@/lib/admin/locale"
import styles from "../admin.module.css"

function GitHubMark() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
      <path d="M12 .7a11.5 11.5 0 0 0-3.64 22.4c.58.1.79-.25.79-.56v-2.02c-3.22.7-3.9-1.37-3.9-1.37-.53-1.34-1.29-1.7-1.29-1.7-1.05-.72.08-.7.08-.7 1.16.08 1.78 1.2 1.78 1.2 1.04 1.76 2.71 1.25 3.37.95.1-.75.4-1.25.73-1.54-2.57-.29-5.27-1.28-5.27-5.69 0-1.26.45-2.28 1.19-3.09-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.16 1.18a10.9 10.9 0 0 1 5.76 0c2.2-1.49 3.16-1.18 3.16-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.83 1.19 3.09 0 4.42-2.71 5.39-5.29 5.68.42.36.79 1.06.79 2.14v3.04c0 .31.21.67.8.56A11.5 11.5 0 0 0 12 .7Z" />
    </svg>
  )
}

export default async function AdminSignInPage() {
  const locale = await getAdminLocale()
  const t = adminCopy[locale].signIn

  async function startGitHubSignIn() {
    "use server"
    await signIn("github", { redirectTo: "/admin/analytics" })
  }

  return (
    <section className={styles.signInGrid}>
      <div className={styles.signInIntro}>
        <p className={styles.eyebrow}>{t.eyebrow}</p>
        <h1>{t.heading}</h1>
        <p>{t.description}</p>
      </div>

      <div className={styles.signInCard}>
        <span className={styles.cardIndex}>{t.cardIndex}</span>
        <div>
          <h2>{t.cardHeading}</h2>
          <p>{t.cardDescription}</p>
        </div>
        <form action={startGitHubSignIn}>
          <button type="submit" className={styles.signInButton}>
            <GitHubMark />
            {t.submit}
          </button>
        </form>
      </div>
    </section>
  )
}
