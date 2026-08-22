export const OWNER_OAUTH_CALLBACK_PATH = "/auth/callback"

type GetSession = () => Promise<{
  data?: { user?: unknown } | null
  error?: unknown
}>
type GetOwnerState = () => Promise<{ status: string }>

export async function resolveOwnerOAuthDestination(
  getSession: GetSession,
  getOwnerState: GetOwnerState
): Promise<"/dashboard" | "/root"> {
  try {
    const result = await getSession()
    if (result.error || !result.data?.user) return "/root"

    const ownerState = await getOwnerState()
    return ownerState.status === "owner" ? "/dashboard" : "/root"
  } catch {
    return "/root"
  }
}
