import type { Metadata } from "next"

import { AgentSettings } from "@/components/admin/agent-settings"
import { agentService } from "@/lib/agent/service"
import { adminCopy } from "@/lib/admin/i18n"
import { getAdminLocale } from "@/lib/admin/locale"
import { requireAdmin } from "@/lib/auth/require-admin"

export const dynamic = "force-dynamic"

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getAdminLocale()
  return { title: adminCopy[locale].agent.heading }
}

export default async function AgentPage() {
  await requireAdmin()
  const configuration = await agentService.getConfiguration()

  return <AgentSettings initialConfiguration={configuration} />
}
