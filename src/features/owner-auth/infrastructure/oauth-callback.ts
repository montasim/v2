export const OWNER_OAUTH_CALLBACK_PATH = "/dashboard"

export function isOwnerOAuthCallbackRequest(request: Request) {
  const url = new URL(request.url)
  return (
    url.pathname === OWNER_OAUTH_CALLBACK_PATH &&
    url.searchParams.has("neon_auth_session_verifier")
  )
}
