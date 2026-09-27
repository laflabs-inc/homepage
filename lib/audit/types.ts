import type { AdminActor } from "@/lib/auth/admin-api"

export type AuditAction = {
  action: string
  targetType: string
  targetId: string
  actor: AdminActor
  metadata?: Record<string, unknown>
}
