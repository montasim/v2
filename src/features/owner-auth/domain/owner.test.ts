import { describe, expect, it } from "vitest"

import {
  isPortfolioOwnerEmail,
  isGoogleAuthRequest,
  isOwnerAuthPath,
  portfolioOwnerEmail,
} from "@/features/owner-auth/domain/owner"

describe("portfolio owner authorization", () => {
  it("accepts only the configured owner email", () => {
    expect(isPortfolioOwnerEmail(portfolioOwnerEmail)).toBe(true)
    expect(
      isPortfolioOwnerEmail(` ${portfolioOwnerEmail.toUpperCase()} `)
    ).toBe(true)
    expect(isPortfolioOwnerEmail("someone@example.com")).toBe(false)
    expect(isPortfolioOwnerEmail(null)).toBe(false)
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
