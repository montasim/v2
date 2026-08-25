import { afterEach, describe, expect, it, vi } from "vitest"

import {
  INQUIRY_RATE_LIMIT_POLICY,
  createInquirySubjectHasher,
  inquiryRetrySubject,
} from "@/features/chat/infrastructure/inquiry/rate-limit.server"

describe("inquiry rate-limit policy", () => {
  afterEach(() => vi.unstubAllEnvs())

  it("uses the public inquiry defaults", () => {
    expect(INQUIRY_RATE_LIMIT_POLICY).toEqual({
      visitor: { limit: 3, windowMs: 15 * 60 * 1_000 },
      retryVisitor: { limit: 6, windowMs: 15 * 60 * 1_000 },
      retryInquiry: { limit: 1, windowMs: 5 * 60 * 1_000 },
      acceptedEmail: { limit: 3, windowMs: 24 * 60 * 60 * 1_000 },
    })
  })

  it("creates stable, normalized, non-reversible subject hashes", () => {
    const hasher = createInquirySubjectHasher("s".repeat(32))

    const first = hasher.hash(" Recruiter@Example.com ")
    const second = hasher.hash("recruiter@example.com")

    expect(first).toBe(second)
    expect(first).toMatch(/^[a-f0-9]{64}$/)
    expect(first).not.toContain("recruiter")
  })

  it("requires an explicit production-grade hashing secret", () => {
    expect(() => createInquirySubjectHasher("short")).toThrow(
      "at least 32 characters"
    )
  })

  it("does not derive the inquiry hashing secret from unrelated credentials", () => {
    vi.stubEnv("INQUIRY_RATE_LIMIT_SECRET", "")
    vi.stubEnv("CHAT_RATE_LIMIT_SECRET", "c".repeat(32))
    vi.stubEnv("DATABASE_URL", "postgresql://credential@example.com/database")

    expect(() => createInquirySubjectHasher()).toThrow("at least 32 characters")
  })

  it("domain-separates and hashes durable per-inquiry retry subjects", () => {
    const inquiryId = "11111111-1111-4111-8111-111111111111"
    const subject = inquiryRetrySubject(
      createInquirySubjectHasher("s".repeat(32)),
      inquiryId
    )

    expect(subject).toMatch(/^[a-f0-9]{64}$/)
    expect(subject).not.toContain(inquiryId)
    expect(subject).not.toBe(
      createInquirySubjectHasher("s".repeat(32)).hash(inquiryId)
    )
  })
})
