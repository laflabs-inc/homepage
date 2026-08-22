import { requireAdmin } from "@/lib/auth/require-admin"

export default async function ProtectedAdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  await requireAdmin()

  return children
}
