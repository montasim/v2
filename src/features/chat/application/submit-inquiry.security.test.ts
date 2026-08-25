import {
  getCsrfRequestValidationResult,
  isCsrfRequestAllowed,
} from "@tanstack/react-start"
import { describe, expect, it, vi } from "vitest"

import { resolveInquiryVisitorAddress } from "@/features/chat/application/inquiry-request-address.server"
import {
  INQUIRY_SUBMISSION_UNAVAILABLE_ERROR,
  INVALID_INQUIRY_REQUEST_ERROR,
  MAX_INQUIRY_REQUEST_BYTES,
  parseInquiryRequest,
} from "@/features/chat/application/submit-inquiry"
import {
  INQUIRY_SERVER_FN_DEADLINE_MS,
  runInquiryServerOperation,
  sanitizeInquirySubmissionError,
} from "@/features/chat/application/submit-inquiry-runtime.server"
import { TEMPORARY_EMAIL_ERROR } from "@/features/email-verification/domain/email-verification"

const validRequest = {
  inquiry: {
    id: "22222222-2222-4222-8222-222222222222",
    type: "hire" as const,
    name: "Amina Rahman",
    email: "amina@example.com",
    role: "Senior Frontend Engineer",
    arrangement: "Remote",
  },
  website: "",
}

const TANSTACK_DEFAULT_CSRF_OPTIONS = {
  secFetchSite: "same-origin" as const,
  referer: true,
  allowRequestsWithoutOriginCheck: false,
}

function csrfContext(request: Request) {
  return { request } as never
}

describe("inquiry server-function security", () => {
  it("allows same-origin requests and rejects cross-site or originless requests", async () => {
    const sameOrigin = new Request("https://portfolio.example/_server", {
      headers: { origin: "https://portfolio.example" },
    })
    const crossSite = new Request("https://portfolio.example/_server", {
      headers: {
        origin: "https://attacker.example",
        "sec-fetch-site": "cross-site",
      },
    })
    const originless = new Request("https://portfolio.example/_server")

    await expect(
      getCsrfRequestValidationResult(
        TANSTACK_DEFAULT_CSRF_OPTIONS,
        csrfContext(sameOrigin)
      )
    ).resolves.toBe(true)
    await expect(
      getCsrfRequestValidationResult(
        TANSTACK_DEFAULT_CSRF_OPTIONS,
        csrfContext(crossSite)
      )
    ).resolves.toBe(false)
    await expect(
      isCsrfRequestAllowed(
        TANSTACK_DEFAULT_CSRF_OPTIONS,
        csrfContext(originless)
      )
    ).resolves.toBe(false)
  })

  it("rejects an oversized serialized input before schema parsing can discard it", () => {
    expect(() =>
      parseInquiryRequest({
        ...validRequest,
        ignoredPadding: "x".repeat(MAX_INQUIRY_REQUEST_BYTES),
      })
    ).toThrow("too large")

    expect(parseInquiryRequest(validRequest)).toEqual(validRequest)
  })

  it("sanitizes malformed input and unexpected server failures", () => {
    expect(() =>
      parseInquiryRequest({
        ...validRequest,
        inquiry: { ...validRequest.inquiry, id: "not-a-uuid" },
      })
    ).toThrow(INVALID_INQUIRY_REQUEST_ERROR)

    const source = Object.assign(
      new Error("password leaked by postgresql://user:secret@database"),
      { code: "XX000", cause: new Error("raw driver failure") }
    )
    const sanitized = sanitizeInquirySubmissionError(source)

    expect(sanitized).not.toBe(source)
    expect(sanitized.message).toBe(INQUIRY_SUBMISSION_UNAVAILABLE_ERROR)
    expect(sanitized.cause).toBeUndefined()
    expect("code" in sanitized).toBe(false)
    expect(
      sanitizeInquirySubmissionError(new Error(TEMPORARY_EMAIL_ERROR)).message
    ).toBe(TEMPORARY_EMAIL_ERROR)
  })

  it("enforces and sanitizes the outer server-function deadline", async () => {
    vi.useFakeTimers()
    try {
      const signals: AbortSignal[] = []
      const bounded = runInquiryServerOperation(async (signal) => {
        signals.push(signal)
        return new Promise<never>((_resolve, reject) => {
          signal.addEventListener(
            "abort",
            () => reject(new Error("raw Neon timeout with credentials")),
            { once: true }
          )
        })
      }, 25)
      const rejection = expect(bounded).rejects.toThrow(
        INQUIRY_SUBMISSION_UNAVAILABLE_ERROR
      )

      await vi.advanceTimersByTimeAsync(30)

      await rejection
      expect(signals.at(0)?.aborted).toBe(true)
      expect(INQUIRY_SERVER_FN_DEADLINE_MS).toBeLessThan(48_000)
    } finally {
      vi.useRealTimers()
    }
  })

  it("uses Netlify's client IP before trusted fallbacks and ignores User-Agent", () => {
    const firstHeaders = new Headers({
      "x-nf-client-connection-ip": "203.0.113.10",
      "cf-connecting-ip": "203.0.113.20",
      "x-real-ip": "203.0.113.30",
      "x-forwarded-for": "203.0.113.40, 10.0.0.1",
      "user-agent": "browser-one",
    })
    const secondHeaders = new Headers(firstHeaders)
    secondHeaders.set("user-agent", "browser-two")

    expect(resolveInquiryVisitorAddress(firstHeaders)).toBe("203.0.113.10")
    expect(resolveInquiryVisitorAddress(secondHeaders)).toBe("203.0.113.10")
  })

  it("accepts only a valid IP from trusted fallback headers", () => {
    expect(
      resolveInquiryVisitorAddress(
        new Headers({
          "x-nf-client-connection-ip": "not-an-ip",
          "cf-connecting-ip": "2001:db8::8",
          "x-real-ip": "203.0.113.30",
        })
      )
    ).toBe("2001:db8::8")
    expect(
      resolveInquiryVisitorAddress(
        new Headers({ "x-forwarded-for": "203.0.113.90, 10.0.0.1" })
      )
    ).toBe("203.0.113.90")
    expect(
      resolveInquiryVisitorAddress(
        new Headers({ "x-forwarded-for": "attacker-controlled-hostname" })
      )
    ).toBe("unknown-address")
  })
})
