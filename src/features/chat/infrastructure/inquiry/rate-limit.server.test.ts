import { beforeEach, describe, expect, it } from "vitest"

import {
  checkInquiryRateLimit,
  resetInquiryRateLimitsForTests,
} from "@/features/chat/infrastructure/inquiry/rate-limit.server"

describe("inquiry rate limit", () => {
  beforeEach(resetInquiryRateLimitsForTests)

  it("allows three inquiries per normalized email within a window", () => {
    expect(() =>
      checkInquiryRateLimit("Recruiter@Example.com", 1_000)
    ).not.toThrow()
    expect(() =>
      checkInquiryRateLimit("recruiter@example.com", 2_000)
    ).not.toThrow()
    expect(() =>
      checkInquiryRateLimit("recruiter@example.com", 3_000)
    ).not.toThrow()
    expect(() => checkInquiryRateLimit("recruiter@example.com", 4_000)).toThrow(
      "Too many inquiry attempts"
    )
  })

  it("starts a fresh count after the window expires", () => {
    checkInquiryRateLimit("recruiter@example.com", 0)
    expect(() =>
      checkInquiryRateLimit("recruiter@example.com", 15 * 60 * 1_000)
    ).not.toThrow()
  })
})
