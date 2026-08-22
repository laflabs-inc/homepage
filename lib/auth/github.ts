import "server-only"

const GITHUB_API_VERSION = "2022-11-28"
const MEMBERSHIP_TIMEOUT_MS = 5_000

export async function checkGitHubOrgMembership(
  accessToken: string,
  org: string,
): Promise<boolean> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), MEMBERSHIP_TIMEOUT_MS)

  try {
    const response = await fetch(
      `https://api.github.com/user/memberships/orgs/${encodeURIComponent(org)}`,
      {
        method: "GET",
        headers: {
          Accept: "application/vnd.github+json",
          Authorization: `Bearer ${accessToken}`,
          "X-GitHub-Api-Version": GITHUB_API_VERSION,
        },
        cache: "no-store",
        signal: controller.signal,
      },
    )

    if (!response.ok) return false

    const body: unknown = await response.json()
    return (
      typeof body === "object" &&
      body !== null &&
      "state" in body &&
      body.state === "active"
    )
  } catch {
    return false
  } finally {
    clearTimeout(timeout)
  }
}
