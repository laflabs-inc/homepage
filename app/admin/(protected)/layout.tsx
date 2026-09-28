import { AdminNav } from "@/components/admin/admin-nav"
import { requireAdmin } from "@/lib/auth/require-admin"

export default async function ProtectedAdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  await requireAdmin()

  return (
    <>
      <AdminNav />
      {children}
    </>
  )
}
