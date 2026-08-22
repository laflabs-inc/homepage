import { signIn } from "@/auth"
import styles from "../admin.module.css"

function GitHubMark() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
      <path d="M12 .7a11.5 11.5 0 0 0-3.64 22.4c.58.1.79-.25.79-.56v-2.02c-3.22.7-3.9-1.37-3.9-1.37-.53-1.34-1.29-1.7-1.29-1.7-1.05-.72.08-.7.08-.7 1.16.08 1.78 1.2 1.78 1.2 1.04 1.76 2.71 1.25 3.37.95.1-.75.4-1.25.73-1.54-2.57-.29-5.27-1.28-5.27-5.69 0-1.26.45-2.28 1.19-3.09-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.16 1.18a10.9 10.9 0 0 1 5.76 0c2.2-1.49 3.16-1.18 3.16-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.83 1.19 3.09 0 4.42-2.71 5.39-5.29 5.68.42.36.79 1.06.79 2.14v3.04c0 .31.21.67.8.56A11.5 11.5 0 0 0 12 .7Z" />
    </svg>
  )
}

export default function AdminSignInPage() {
  async function startGitHubSignIn() {
    "use server"
    await signIn("github", { redirectTo: "/admin/analytics" })
  }

  return (
    <section className={styles.signInGrid}>
      <div className={styles.signInIntro}>
        <p className={styles.eyebrow}>LafLabs / Internal analytics</p>
        <h1>
          Observe quietly.
          <br />
          Decide clearly.
        </h1>
        <p>
          Consented, first-party product signals for the LafLabs team. Access is
          limited to active organization members.
        </p>
      </div>

      <div className={styles.signInCard}>
        <span className={styles.cardIndex}>AUTH / 01</span>
        <div>
          <h2>Continue with GitHub</h2>
          <p>
            Your current membership in <code>laflabs-inc</code> is verified
            before access is granted.
          </p>
        </div>
        <form action={startGitHubSignIn}>
          <button type="submit" className={styles.signInButton}>
            <GitHubMark />
            Verify membership
          </button>
        </form>
      </div>
    </section>
  )
}
