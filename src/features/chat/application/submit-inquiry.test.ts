import { describe, expect, it, vi } from "vitest"

import {
  EMAIL_VERIFICATION_UNAVAILABLE_ERROR,
  TEMPORARY_EMAIL_ERROR,
} from "@/features/email-verification/domain/email-verification"
import type {
  InquiryDeliveryChannel,
  InquiryDestination,
  InquiryRateLimiter,
  InquiryRepository,
} from "@/features/chat/application/ports/portfolio-inquiry"
import { PortfolioInquiry } from "@/features/chat/application/portfolio-inquiry.server"
import type { InquirySubmission } from "@/features/chat/domain/inquiry"

const inquiry: InquirySubmission = {
  id: "11111111-1111-4111-8111-111111111111",
  type: "project",
  name: "Amina Rahman",
  email: "amina@example.com",
  projectType: "SaaS platform",
  timeline: "Within 1-3 months",
}
const leaseStartedAt = new Date("2026-08-23T06:00:00.000Z")

function createHarness(options?: {
  pending?: readonly InquiryDeliveryChannel[]
  verify?: () => Promise<void>
  accept?: () => Promise<never>
  deliveryFailure?: InquiryDeliveryChannel
  deliveryDelayMs?: number
  deliveryTimeoutMs?: number
  deliveryClaimTimeoutMs?: number
  retryLimitTimeoutMs?: number
  existing?: boolean
  lookupFailure?: Error
  recoveryFailure?: Error
  retryAllowed?: boolean
  retryFailure?: Error
  retryDelayMs?: number
  claimDelayMs?: number
  recoveryIds?: readonly string[]
}) {
  const calls: string[] = []
  const deliveryUpdates: Parameters<InquiryRepository["recordDelivery"]>[0][] =
    []
  const claimedDeliveries = new Set<InquiryDeliveryChannel>()
  const pending = options?.pending ?? [
    "resend-owner",
    "resend-acknowledgement",
    "google-sheets",
  ]

  const repository: InquiryRepository = {
    async findAccepted(acceptedInquiry) {
      calls.push("lookup")
      if (options?.lookupFailure) throw options.lookupFailure
      if (!options?.existing) return null
      return {
        inquiry: acceptedInquiry,
        pendingDeliveries: pending.map((channel) => ({
          channel,
          idempotencyKey: `portfolio-inquiry-${acceptedInquiry.id}-${channel}-v1`,
        })),
      }
    },
    async findPending() {
      calls.push("recover")
      if (options?.recoveryFailure) throw options.recoveryFailure
      if (!options?.existing) return null
      return {
        inquiry,
        pendingDeliveries: pending.map((channel) => ({
          channel,
          idempotencyKey: `portfolio-inquiry-${inquiry.id}-${channel}-v1`,
        })),
      }
    },
    async listPendingIds() {
      calls.push("scan")
      return options?.recoveryIds ?? []
    },
    async accept({ inquiry: acceptedInquiry }) {
      calls.push("store")
      if (options?.accept) return options.accept()
      return {
        inquiry: acceptedInquiry,
        pendingDeliveries: pending.map((channel) => ({
          channel,
          idempotencyKey: `portfolio-inquiry-${acceptedInquiry.id}-${channel}-v1`,
        })),
      }
    },
    async claimDelivery({ channel }) {
      calls.push(`claim:${channel}`)
      if (claimedDeliveries.has(channel)) return null
      claimedDeliveries.add(channel)
      if (options?.claimDelayMs) {
        await new Promise((resolve) =>
          setTimeout(resolve, options.claimDelayMs)
        )
      }
      return { leaseStartedAt }
    },
    async recordDelivery(update) {
      deliveryUpdates.push(update)
    },
  }
  const rateLimiter: InquiryRateLimiter = {
    async consumeVisitorAttempt() {
      calls.push("visitor-limit")
    },
    async allowRetryAttempt() {
      calls.push("retry-limit")
      if (options?.retryDelayMs) {
        await new Promise((resolve) =>
          setTimeout(resolve, options.retryDelayMs)
        )
      }
      if (options?.retryFailure) throw options.retryFailure
      return options?.retryAllowed ?? true
    },
    async reserveAcceptedEmail() {
      calls.push("email-limit")
      return { reserved: true }
    },
  }
  const destinations = pending.map<InquiryDestination>((channel) => ({
    channel,
    async deliver({ idempotencyKey, signal }) {
      calls.push(`${channel}:${idempotencyKey}`)
      if (options?.deliveryDelayMs) {
        await new Promise<void>((resolve, reject) => {
          const timeout = setTimeout(resolve, options.deliveryDelayMs)
          signal?.addEventListener(
            "abort",
            () => {
              clearTimeout(timeout)
              reject(signal.reason)
            },
            { once: true }
          )
        })
      }
      if (options?.deliveryFailure === channel) {
        throw new Error(`${channel} unavailable`)
      }
    },
  }))
  const emailPolicy = {
    async requirePermanent() {
      calls.push("email-policy")
      await options?.verify?.()
    },
  }
  const module = new PortfolioInquiry({
    repository,
    rateLimiter,
    emailPolicy,
    emailHasher: { hash: (value) => `hash:${value}` },
    destinations,
    now: () => new Date("2026-08-23T06:00:00.000Z"),
    deliveryTimeoutMs: options?.deliveryTimeoutMs,
    deliveryClaimTimeoutMs: options?.deliveryClaimTimeoutMs,
    retryLimitTimeoutMs: options?.retryLimitTimeoutMs,
  })

  return { module, calls, deliveryUpdates }
}

describe("PortfolioInquiry.submit", () => {
  it("stores in Neon-authoritative persistence before secondary delivery", async () => {
    const harness = createHarness()

    await expect(
      harness.module.submit({ inquiry, visitorHash: "visitor-hash" })
    ).resolves.toEqual({ delivered: true })

    expect(harness.calls.slice(0, 5)).toEqual([
      "lookup",
      "visitor-limit",
      "email-policy",
      "email-limit",
      "store",
    ])
    expect(harness.deliveryUpdates).toHaveLength(3)
    expect(
      harness.deliveryUpdates.every(({ outcome }) => outcome.status === "sent")
    ).toBe(true)
  })

  it("retries only destinations returned as pending with stable keys", async () => {
    const harness = createHarness({ pending: ["google-sheets"] })

    await harness.module.submit({ inquiry, visitorHash: "visitor-hash" })

    expect(harness.calls).toContain(
      "google-sheets:portfolio-inquiry-11111111-1111-4111-8111-111111111111-google-sheets-v1"
    )
    expect(harness.calls.some((call) => call.startsWith("resend-owner:"))).toBe(
      false
    )
  })

  it("recognizes an exact persisted retry before normal limits or email verification", async () => {
    const harness = createHarness({
      existing: true,
      pending: ["google-sheets"],
    })

    await expect(
      harness.module.submit({ inquiry, visitorHash: "visitor-hash" })
    ).resolves.toEqual({ delivered: true })

    expect(harness.calls).toEqual([
      "lookup",
      "retry-limit",
      "claim:google-sheets",
      "google-sheets:portfolio-inquiry-11111111-1111-4111-8111-111111111111-google-sheets-v1",
    ])
    expect(harness.deliveryUpdates).toEqual([
      {
        inquiryId: inquiry.id,
        channel: "google-sheets",
        leaseStartedAt,
        outcome: { status: "sent" },
      },
    ])
  })

  it("durably backs off repeated public retries while preserving accepted success", async () => {
    const harness = createHarness({
      existing: true,
      pending: ["google-sheets"],
      retryAllowed: false,
    })

    await expect(
      harness.module.submit({ inquiry, visitorHash: "visitor-hash" })
    ).resolves.toEqual({ delivered: true })

    expect(harness.calls).toEqual(["lookup", "retry-limit"])
    expect(harness.deliveryUpdates).toEqual([])
  })

  it("fails retry delivery closed when its limiter is unavailable", async () => {
    const harness = createHarness({
      existing: true,
      pending: ["google-sheets"],
      retryFailure: new Error("Neon unavailable"),
    })

    await expect(
      harness.module.submit({ inquiry, visitorHash: "visitor-hash" })
    ).resolves.toEqual({ delivered: true })

    expect(harness.calls).toEqual(["lookup", "retry-limit"])
  })

  it("bounds a stalled retry limiter and skips secondary delivery", async () => {
    vi.useFakeTimers()
    try {
      const harness = createHarness({
        existing: true,
        pending: ["google-sheets"],
        retryDelayMs: 100,
        retryLimitTimeoutMs: 25,
      })
      const submission = harness.module.submit({
        inquiry,
        visitorHash: "visitor-hash",
      })

      await vi.advanceTimersByTimeAsync(30)

      await expect(submission).resolves.toEqual({ delivered: true })
      expect(harness.calls).toEqual(["lookup", "retry-limit"])
      await vi.advanceTimersByTimeAsync(100)
    } finally {
      vi.useRealTimers()
    }
  })

  it("rejects a reused identifier with different content before abuse checks", async () => {
    const harness = createHarness({
      lookupFailure: new Error(
        "This inquiry identifier has already been used."
      ),
    })

    await expect(
      harness.module.submit({ inquiry, visitorHash: "visitor-hash" })
    ).rejects.toThrow("identifier has already been used")
    expect(harness.calls).toEqual(["lookup"])
  })

  it("lets only one concurrent retry claim each pending destination", async () => {
    const harness = createHarness({
      existing: true,
      pending: ["google-sheets"],
    })

    await Promise.all([
      harness.module.submit({ inquiry, visitorHash: "visitor-hash" }),
      harness.module.submit({ inquiry, visitorHash: "visitor-hash" }),
    ])

    expect(
      harness.calls.filter((call) => call.startsWith("google-sheets:"))
    ).toHaveLength(1)
    expect(harness.deliveryUpdates).toHaveLength(1)
  })

  it("provides a server-owned recovery path for durable pending delivery", async () => {
    const harness = createHarness({
      existing: true,
      pending: ["resend-owner"],
    })

    await expect(harness.module.retryPending(inquiry.id)).resolves.toEqual({
      retried: true,
    })

    expect(harness.calls).toEqual([
      "recover",
      "claim:resend-owner",
      `resend-owner:portfolio-inquiry-${inquiry.id}-resend-owner-v1`,
    ])
    expect(harness.deliveryUpdates.at(0)).toMatchObject({
      inquiryId: inquiry.id,
      channel: "resend-owner",
      outcome: { status: "sent" },
    })
  })

  it("sweeps a bounded batch of durable pending inquiries", async () => {
    const harness = createHarness({
      existing: true,
      pending: ["resend-owner"],
      recoveryIds: [inquiry.id],
    })

    await expect(
      harness.module.retryPendingBatch({ limit: 4 })
    ).resolves.toEqual({ selected: 1, retried: 1, failed: 0 })

    expect(harness.calls).toEqual([
      "scan",
      "recover",
      "claim:resend-owner",
      `resend-owner:portfolio-inquiry-${inquiry.id}-resend-owner-v1`,
    ])
  })

  it("isolates a failed inquiry during a scheduled recovery sweep", async () => {
    const harness = createHarness({
      existing: true,
      recoveryIds: [inquiry.id],
      recoveryFailure: new Error("Neon read failed"),
    })

    await expect(
      harness.module.retryPendingBatch({ limit: 4 })
    ).resolves.toEqual({ selected: 1, retried: 0, failed: 1 })
  })

  it("bounds post-persistence delivery and leaves a timed-out channel pending", async () => {
    vi.useFakeTimers()
    try {
      const harness = createHarness({
        pending: ["google-sheets"],
        deliveryDelayMs: 60_000,
        deliveryTimeoutMs: 25,
      })
      const submission = harness.module.submit({
        inquiry,
        visitorHash: "visitor-hash",
      })

      await vi.advanceTimersByTimeAsync(30)

      await expect(submission).resolves.toEqual({ delivered: true })
      expect(harness.deliveryUpdates).toEqual([
        {
          inquiryId: inquiry.id,
          channel: "google-sheets",
          leaseStartedAt,
          outcome: {
            status: "pending",
            error: "Inquiry delivery timed out after 25ms.",
          },
        },
      ])
    } finally {
      vi.useRealTimers()
    }
  })

  it("releases a database delivery claim that resolves after its deadline", async () => {
    vi.useFakeTimers()
    try {
      const harness = createHarness({
        pending: ["google-sheets"],
        claimDelayMs: 100,
        deliveryClaimTimeoutMs: 25,
      })
      const submission = harness.module.submit({
        inquiry,
        visitorHash: "visitor-hash",
      })

      await vi.advanceTimersByTimeAsync(30)
      await expect(submission).resolves.toEqual({ delivered: true })
      expect(harness.deliveryUpdates).toEqual([])

      await vi.advanceTimersByTimeAsync(100)
      expect(harness.deliveryUpdates).toEqual([
        {
          inquiryId: inquiry.id,
          channel: "google-sheets",
          leaseStartedAt,
          outcome: {
            status: "pending",
            error: "Inquiry delivery claim completed after its deadline.",
          },
        },
      ])
    } finally {
      vi.useRealTimers()
    }
  })

  it("keeps failed secondary delivery pending and still accepts the inquiry", async () => {
    const harness = createHarness({
      pending: ["resend-owner"],
      deliveryFailure: "resend-owner",
    })

    await expect(
      harness.module.submit({ inquiry, visitorHash: "visitor-hash" })
    ).resolves.toEqual({ delivered: true })
    expect(harness.deliveryUpdates).toEqual([
      {
        inquiryId: inquiry.id,
        channel: "resend-owner",
        leaseStartedAt,
        outcome: {
          status: "pending",
          error: "resend-owner unavailable",
        },
      },
    ])
  })

  it("fails closed with a clear retryable error when email verification is unavailable", async () => {
    const harness = createHarness({
      verify: async () => {
        throw new Error("Network unavailable")
      },
    })

    await expect(
      harness.module.submit({ inquiry, visitorHash: "visitor-hash" })
    ).rejects.toThrow(EMAIL_VERIFICATION_UNAVAILABLE_ERROR)
    expect(harness.calls).toEqual(["lookup", "visitor-limit", "email-policy"])
  })

  it("preserves the permanent-email rejection shown by the inquiry UI", async () => {
    const harness = createHarness({
      verify: async () => {
        throw new Error(TEMPORARY_EMAIL_ERROR)
      },
    })

    await expect(
      harness.module.submit({ inquiry, visitorHash: "visitor-hash" })
    ).rejects.toThrow(TEMPORARY_EMAIL_ERROR)
  })

  it("keeps an accepted-email reservation when storage outcome is uncertain", async () => {
    const harness = createHarness({
      accept: async () => {
        throw new Error("Neon unavailable")
      },
    })

    await expect(
      harness.module.submit({ inquiry, visitorHash: "visitor-hash" })
    ).rejects.toThrow("Neon unavailable")
    expect(harness.calls).toEqual([
      "lookup",
      "visitor-limit",
      "email-policy",
      "email-limit",
      "store",
    ])
  })

  it("silently accepts a filled honeypot without touching remote dependencies", async () => {
    const harness = createHarness()

    await expect(
      harness.module.submit({
        inquiry,
        visitorHash: "visitor-hash",
        website: "https://spam.example",
      })
    ).resolves.toEqual({ delivered: true })
    expect(harness.calls).toEqual([])
  })

  it("requires one adapter per delivery channel", () => {
    const duplicate: InquiryDestination = {
      channel: "google-sheets",
      deliver: vi.fn(),
    }
    const dependencies = createHarness({ pending: [] })

    expect(
      () =>
        new PortfolioInquiry({
          repository: {
            findAccepted: vi.fn(),
            findPending: vi.fn(),
            listPendingIds: vi.fn(),
            accept: vi.fn(),
            claimDelivery: vi.fn(),
            recordDelivery: vi.fn(),
          },
          rateLimiter: {
            consumeVisitorAttempt: vi.fn(),
            allowRetryAttempt: vi.fn(),
            reserveAcceptedEmail: vi.fn(),
          },
          emailPolicy: { requirePermanent: vi.fn() },
          emailHasher: { hash: (value) => value },
          destinations: [duplicate, duplicate],
        })
    ).toThrow("unique channel")
    expect(dependencies.calls).toEqual([])
  })
})
