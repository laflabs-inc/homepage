import "server-only"

import { sql, type SQL } from "drizzle-orm"

import type { AuditAction } from "@/lib/documents/types"
import { adminAuditLog } from "@/lib/db/schema"
import { getDb } from "@/lib/db"

type SqlExecutor = {
  execute(query: SQL): Promise<{ rows: unknown[] }>
}

const forbiddenMetadataKeys = /(?:body|markdown|api.?key|ciphertext|prompt|answer)/i

export function serializeAuditMetadata(metadata: Record<string, unknown> = {}): string {
  for (const key of Object.keys(metadata)) {
    if (forbiddenMetadataKeys.test(key)) {
      throw new Error(`Sensitive audit metadata key: ${key}`)
    }
  }
  return JSON.stringify(metadata)
}

export function auditInsertSql(entry: AuditAction): SQL {
  return sql`
    INSERT INTO ${adminAuditLog} (
      "action", "target_type", "target_id", "actor_github_id", "actor_name", "metadata"
    ) VALUES (
      ${entry.action}, ${entry.targetType}, ${entry.targetId},
      ${entry.actor.githubId}, ${entry.actor.name}, ${serializeAuditMetadata(entry.metadata)}::jsonb
    )
  `
}

export interface AuditStore {
  append(entry: AuditAction): Promise<void>
}

export function createAuditStore(database: SqlExecutor): AuditStore {
  return {
    async append(entry) {
      await database.execute(auditInsertSql(entry))
    },
  }
}

export const auditStore = createAuditStore({
  execute(query) {
    return getDb().execute(query)
  },
})
