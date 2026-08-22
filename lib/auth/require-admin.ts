import "server-only"

import { redirect } from "next/navigation"

import { auth } from "@/auth"

export async function requireAdmin() {
  const session = await auth()

  if (session?.user.orgMember !== true) redirect("/admin/sign-in")

  return session
}
