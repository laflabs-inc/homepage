import { redirect } from "next/navigation"

import { requireAdmin } from "@/lib/auth/require-admin"

export default async function AdminIndexPage() {
  await requireAdmin()
  redirect("/admin/analytics")
}
