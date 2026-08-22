import NextAuth from "next-auth"

import {
  createAuthConfig,
  refreshMembershipToken,
} from "@/lib/auth/config"

export { refreshMembershipToken }

export const { handlers, auth, signIn, signOut } = NextAuth(createAuthConfig)
