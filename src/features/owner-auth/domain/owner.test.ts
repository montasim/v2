import { describe, expect, it } from "vitest"

import {
  isPortfolioOwnerEmail,
  isGoogleAuthRequest,
  isOwnerAuthPath,
} from "@/features/owner-auth/domain/owner"

describe("portfolio owner authorization", () => {
  it("accepts only the configured owner email", () => {
    const ownerEmail = "owner@example.com"

    expect(isPortfolioOwnerEmail(ownerEmail, ownerEmail)).toBe(true)
    expect(
      isPortfolioOwnerEmail(
        ` ${ownerEmail.toUpperCase()} `,
        ` ${ownerEmail.toUpperCase()} `
      )
    ).toBe(true)
    expect(isPortfolioOwnerEmail("someone@example.com", ownerEmail)).toBe(false)
    expect(isPortfolioOwnerEmail(null, ownerEmail)).toBe(false)
    expect(isPortfolioOwnerEmail(ownerEmail, undefined)).toBe(false)
  })

  it("allows only the Google owner authentication endpoints", () => {
    expect(isOwnerAuthPath("sign-in/social")).toBe(true)
    expect(isOwnerAuthPath("callback/google")).toBe(true)
    expect(isOwnerAuthPath("sign-in/email")).toBe(false)
    expect(isOwnerAuthPath("sign-up/email")).toBe(false)
    expect(isOwnerAuthPath("callback/github")).toBe(false)

    expect(isGoogleAuthRequest({ provider: "google" })).toBe(true)
    expect(isGoogleAuthRequest({ provider: "github" })).toBe(false)
  })
})
