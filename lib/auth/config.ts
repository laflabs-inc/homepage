import "server-only"

import type { NextAuthConfig } from "next-auth"
import type { JWT } from "next-auth/jwt"
import GitHub from "next-auth/providers/github"

import { checkGitHubOrgMembership } from "@/lib/auth/github"
import { getAuthEnv } from "@/lib/env"

const SESSION_MAX_AGE_SECONDS = 8 * 60 * 60
const MEMBERSHIP_REVALIDATION_MS = 30 * 60 * 1_000

export async function refreshMembershipToken(
  token: JWT,
  newAccessToken?: string,
): Promise<JWT> {
  const now = Date.now()
  const accessToken =
    newAccessToken ||
    (typeof token.githubAccessToken === "string"
      ? token.githubAccessToken
      : undefined)

  if (!accessToken) return { ...token, orgMember: false }

  const checkedAt = token.membershipCheckedAt
  const hasReusableResult =
    newAccessToken === undefined &&
    typeof token.orgMember === "boolean" &&
    typeof checkedAt === "number" &&
    checkedAt <= now &&
    now - checkedAt < MEMBERSHIP_REVALIDATION_MS

  if (hasReusableResult) return token

  const { ADMIN_GITHUB_ORG } = getAuthEnv()
  const orgMember = await checkGitHubOrgMembership(
    accessToken,
    ADMIN_GITHUB_ORG,
  )

  return {
    ...token,
    githubAccessToken: accessToken,
    membershipCheckedAt: now,
    orgMember,
  }
}

export function createAuthConfig(): NextAuthConfig {
  const env = getAuthEnv()

  return {
    secret: env.AUTH_SECRET,
    providers: [
      GitHub({
        clientId: env.AUTH_GITHUB_ID,
        clientSecret: env.AUTH_GITHUB_SECRET,
        authorization: { params: { scope: "read:user read:org" } },
      }),
    ],
    session: { strategy: "jwt", maxAge: SESSION_MAX_AGE_SECONDS },
    pages: { signIn: "/admin/sign-in" },
    callbacks: {
      async signIn({ account }) {
        const accessToken = account?.access_token
        if (typeof accessToken !== "string" || accessToken.length === 0) {
          return false
        }

        return checkGitHubOrgMembership(accessToken, env.ADMIN_GITHUB_ORG)
      },
      async jwt({ token, account }) {
        const accessToken =
          typeof account?.access_token === "string"
            ? account.access_token
            : undefined
        return refreshMembershipToken(token, accessToken)
      },
      session({ session, token }) {
        session.user = {
          ...session.user,
          orgMember: token.orgMember === true,
        }
        return session
      },
    },
  }
}
