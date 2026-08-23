import "server-only"

import { auth } from "@/auth"

export type AdminActor = { githubId: string; name: string }

export type AdminApiAuthorization =
  | { ok: true; actor: AdminActor }
  | { ok: false; response: Response }

export async function authorizeAdminApi(): Promise<AdminApiAuthorization> {
  const session = await auth()

  if (!session) {
    return {
      ok: false,
      response: Response.json({ error: "unauthenticated" }, { status: 401 }),
    }
  }

  if (!session.user.orgMember || !session.user.githubId) {
    return {
      ok: false,
      response: Response.json({ error: "forbidden" }, { status: 403 }),
    }
  }

  return {
    ok: true,
    actor: {
      githubId: session.user.githubId,
      name: session.user.name ?? "GitHub admin",
    },
  }
}
