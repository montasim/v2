import { describe, expect, it, vi } from "vitest"

import {
  ResendNewsletterConfirmationDelivery,
  formatSubscriptionConfirmation,
} from "@/features/newsletter/infrastructure/resend.server"

describe("newsletter confirmation email", () => {
  it("sends a concise confirmation with the supplied idempotency key", async () => {
    const sendEmail = vi.fn().mockResolvedValue({ error: null })
    const delivery = new ResendNewsletterConfirmationDelivery(
      {
        apiKey: "resend-key",
        from: "Montasim <portfolio@example.com>",
      },
      sendEmail
    )

    await delivery.send({
      subscriber: {
        id: "subscriber-1",
        email: "reader@example.com",
        confirmationState: "pending",
      },
      idempotencyKey: "newsletter-subscription-subscriber-1-v1",
    })

    expect(sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "reader@example.com",
        subject: "You're subscribed to Montasim's engineering notes",
      }),
      { idempotencyKey: "newsletter-subscription-subscriber-1-v1" }
    )
  })

  it("explains what the subscriber will receive", () => {
    expect(formatSubscriptionConfirmation()).toContain(
      "occasional engineering notes"
    )
    expect(formatSubscriptionConfirmation()).toContain("No tracking or filler")
  })
})
