import { describe, expect, it } from "vitest"

import {
  OWNER_OAUTH_CALLBACK_PATH,
  resolveOwnerOAuthDestination,
} from "@/features/owner-auth/infrastructure/oauth-callback"

describe("owner OAuth callback", () => {
  it("uses a public callback route instead of sending the verifier to the protected dashboard", () => {
    expect(OWNER_OAUTH_CALLBACK_PATH).toBe("/auth/callback")
  })

  it("continues to the dashboard after the client exchanges the verifier", async () => {
    const getSession = async () => ({
      data: { user: { email: "owner@example.com" } },
      error: null,
    })

    const getOwnerState = async () => ({ status: "owner" as const })

    await expect(
      resolveOwnerOAuthDestination(getSession, getOwnerState)
    ).resolves.toBe("/dashboard")
  })

  it("rejects a valid Google session that does not belong to the configured owner", async () => {
    const getSession = async () => ({
      data: { user: { email: "someone@gmail.com" } },
      error: null,
    })
    const getOwnerState = async () => ({ status: "forbidden" as const })

    await expect(
      resolveOwnerOAuthDestination(getSession, getOwnerState)
    ).resolves.toBe("/root")
  })

  it("returns to sign-in when the verifier exchange fails", async () => {
    const getSession = async () => ({ data: null, error: new Error("failed") })

    const getOwnerState = async () => ({ status: "signed-out" as const })

    await expect(
      resolveOwnerOAuthDestination(getSession, getOwnerState)
    ).resolves.toBe("/root")
  })
})
