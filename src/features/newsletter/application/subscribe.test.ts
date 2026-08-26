import { describe, expect, it, vi } from "vitest"

import type {
  NewsletterConfirmationDelivery,
  NewsletterSubscriberRepository,
} from "@/features/newsletter/application/ports"
import { subscribeToNewsletterWithDependencies } from "@/features/newsletter/application/subscribe"
import type {
  NewsletterConfirmationState,
  NewsletterSubscriber,
} from "@/features/newsletter/domain/subscriber"

function createHarness(
  subscriber: NewsletterSubscriber = {
    id: "subscriber-1",
    email: "reader@example.com",
    confirmationState: "pending",
  }
) {
  const verifyEmail = vi.fn().mockResolvedValue(undefined)
  const findOrCreate = vi.fn().mockResolvedValue(subscriber)
  const markConfirmation = vi.fn().mockResolvedValue(undefined)
  const send = vi.fn().mockResolvedValue(undefined)

  return {
    dependencies: {
      verifyEmail,
      subscribers: {
        findOrCreate,
        markConfirmation,
      } satisfies NewsletterSubscriberRepository,
      confirmation: { send } satisfies NewsletterConfirmationDelivery,
    },
    findOrCreate,
    markConfirmation,
    send,
    verifyEmail,
  }
}

describe("newsletter subscription", () => {
  it("stores a verified subscriber and sends one idempotent confirmation", async () => {
    const harness = createHarness()

    await expect(
      subscribeToNewsletterWithDependencies(
        "reader@example.com",
        harness.dependencies
      )
    ).resolves.toEqual({ subscribed: true })

    expect(harness.verifyEmail).toHaveBeenCalledWith("reader@example.com")
    expect(harness.findOrCreate).toHaveBeenCalledWith("reader@example.com")
    expect(harness.markConfirmation.mock.calls).toEqual([
      ["subscriber-1", "sending"],
      ["subscriber-1", "sent"],
    ])
    expect(harness.send).toHaveBeenCalledWith({
      subscriber: expect.objectContaining({ id: "subscriber-1" }),
      idempotencyKey: "newsletter-subscription-subscriber-1-v1",
    })
  })

  it("does not resend confirmation to an existing confirmed subscriber", async () => {
    const harness = createHarness({
      id: "subscriber-1",
      email: "reader@example.com",
      confirmationState: "sent",
    })

    await subscribeToNewsletterWithDependencies(
      "reader@example.com",
      harness.dependencies
    )

    expect(harness.send).not.toHaveBeenCalled()
    expect(harness.markConfirmation).not.toHaveBeenCalled()
  })

  it("records a failed delivery so a later submission can retry", async () => {
    const harness = createHarness()
    harness.send.mockRejectedValue(new Error("provider unavailable"))

    await expect(
      subscribeToNewsletterWithDependencies(
        "reader@example.com",
        harness.dependencies
      )
    ).rejects.toThrow("subscription was saved")

    expect(harness.markConfirmation).toHaveBeenLastCalledWith(
      "subscriber-1",
      "failed" satisfies NewsletterConfirmationState,
      "provider unavailable"
    )
  })
})
