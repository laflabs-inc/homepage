import { AgentSettings } from "@/components/admin/agent-settings"
import { agentService } from "@/lib/agent/service"
import { requireAdmin } from "@/lib/auth/require-admin"

export const dynamic = "force-dynamic"

export default async function AgentPage() {
  await requireAdmin()
  const configuration = await agentService.getConfiguration()

  return <AgentSettings initialConfiguration={configuration} />
}
