import { describe, expect, it } from "vitest"

import { getOwnerSignInError } from "./sign-in-error"

describe("owner sign-in errors", () => {
  it("recognizes the quota error normalized and thrown by the Neon client", () => {
    const error = Object.assign(
      new Error(
        "Your account or project has exceeded the quota. Upgrade your plan to increase limits."
      ),
      { status: 500, code: "unexpected_failure" }
    )

    expect(getOwnerSignInError(error)).toContain(
      "Resolve the quota issue in Neon Console"
    )
  })

  it("explains the Neon quota failure returned by social sign-in", () => {
    expect(
      getOwnerSignInError({
        status: 500,
        code: "DATABASE_ERROR",
        message:
          "Your account or project has exceeded the quota. Upgrade your plan to increase limits.",
        cause: { code: "53000" },
      })
    ).toBe(
      "Sign-in is unavailable because the Neon account or project has exceeded its quota. Resolve the quota issue in Neon Console, then try again."
    )
  })

  it("does not blame the connection for other provider failures", () => {
    expect(getOwnerSignInError({ status: 500, code: "DATABASE_ERROR" })).toBe(
      "The authentication service could not start sign-in. Please try again later."
    )
  })

  it("does not expose arbitrary upstream error messages", () => {
    expect(getOwnerSignInError({ message: "sensitive upstream details" })).toBe(
      "Sign-in could not be started. Please try again."
    )
  })

  it("handles network exceptions and missing error details", () => {
    expect(getOwnerSignInError(new TypeError("Failed to fetch"))).toBe(
      "Sign-in could not be started. Please try again."
    )
    expect(getOwnerSignInError(null)).toBe(
      "Sign-in could not be started. Please try again."
    )
  })
})
