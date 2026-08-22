import { describe, expect, it } from "vitest"

import {
  OWNER_OAUTH_CALLBACK_PATH,
  isOwnerOAuthCallbackRequest,
} from "@/features/owner-auth/infrastructure/oauth-callback"

describe("isOwnerOAuthCallbackRequest", () => {
  it("recognizes the Neon session verifier returned to the dashboard", () => {
    const request = new Request(
      `http://localhost:3000${OWNER_OAUTH_CALLBACK_PATH}?neon_auth_session_verifier=test-verifier`
    )

    expect(isOwnerOAuthCallbackRequest(request)).toBe(true)
  })

  it("does not treat an ordinary dashboard request as an OAuth callback", () => {
    const request = new Request("http://localhost:3000/dashboard")

    expect(isOwnerOAuthCallbackRequest(request)).toBe(false)
  })
})
