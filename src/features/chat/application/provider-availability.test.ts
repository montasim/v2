import { describe, expect, it } from "vitest"

import { createProviderAvailability } from "@/features/chat/application/provider-availability"

describe("provider availability", () => {
  it("cools down a rate-limited provider for the requested duration", () => {
    let now = 1_000
    const availability = createProviderAvailability(() => now)

    availability.recordFailure("gemini", {
      statusCode: 429,
      responseHeaders: { "retry-after": "2" },
    })

    expect(availability.canAttempt("gemini")).toBe(false)
    now += 1_999
    expect(availability.canAttempt("gemini")).toBe(false)
    now += 1
    expect(availability.canAttempt("gemini")).toBe(true)
  })

  it("does not cool down a provider after an unrelated failure", () => {
    const availability = createProviderAvailability()

    availability.recordFailure("groq", { statusCode: 500 })

    expect(availability.canAttempt("groq")).toBe(true)
  })

  it("uses structured provider retry metadata when no retry-after header exists", () => {
    let now = 1_000
    const availability = createProviderAvailability(() => now)

    availability.recordFailure("gemini", {
      statusCode: 429,
      data: {
        error: {
          details: [
            {
              "@type": "type.googleapis.com/google.rpc.RetryInfo",
              retryDelay: "42s",
            },
          ],
        },
      },
    })

    now += 41_999
    expect(availability.canAttempt("gemini")).toBe(false)
    now += 1
    expect(availability.canAttempt("gemini")).toBe(true)
  })

  it("uses the maximum cooldown for a daily provider quota", () => {
    let now = 1_000
    const availability = createProviderAvailability(() => now)

    availability.recordFailure("gemini", {
      statusCode: 429,
      data: {
        error: {
          details: [
            {
              "@type": "type.googleapis.com/google.rpc.QuotaFailure",
              violations: [
                {
                  quotaId: "GenerateRequestsPerDayPerProjectPerModel-FreeTier",
                },
              ],
            },
            {
              "@type": "type.googleapis.com/google.rpc.RetryInfo",
              retryDelay: "11s",
            },
          ],
        },
      },
    })

    now += 299_999
    expect(availability.canAttempt("gemini")).toBe(false)
    now += 1
    expect(availability.canAttempt("gemini")).toBe(true)
  })
})
