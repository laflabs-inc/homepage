import type { DefaultSession } from "next-auth"

declare module "next-auth" {
  interface Session {
    user: NonNullable<DefaultSession["user"]> & {
      githubId?: string
      orgMember: boolean
    }
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    githubAccessToken?: string
    githubId?: string
    membershipCheckedAt?: number
    orgMember?: boolean
  }
}
