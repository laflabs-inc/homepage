import { redirect } from "next/navigation"

import { auth } from "@/auth"

export default async function ProtectedAdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  if (session?.user.orgMember !== true) redirect("/admin/sign-in")

  return children
}
