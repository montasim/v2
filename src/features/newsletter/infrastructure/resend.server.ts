import { Resend } from "resend"

import type { NewsletterConfirmationDelivery } from "@/features/newsletter/application/ports"

type SendNewsletterEmail = (
  message: { from: string; to: string; subject: string; text: string },
  options: { idempotencyKey: string }
) => Promise<{ error: unknown }>

export type NewsletterEmailConfig = {
  apiKey: string
  from: string
}

export class ResendNewsletterConfirmationDelivery implements NewsletterConfirmationDelivery {
  constructor(
    private readonly config?: NewsletterEmailConfig,
    private readonly sendEmail?: SendNewsletterEmail
  ) {}

  async send({
    subscriber,
    idempotencyKey,
  }: Parameters<NewsletterConfirmationDelivery["send"]>[0]) {
    const config = this.config ?? readNewsletterEmailConfig()
    const result = await (this.sendEmail ?? createEmailSender(config.apiKey))(
      {
        from: config.from,
        to: subscriber.email,
        subject: "You're subscribed to Montasim's engineering notes",
        text: formatSubscriptionConfirmation(),
      },
      { idempotencyKey }
    )

    if (result.error) throw new Error("Subscription confirmation failed.")
  }
}

export function formatSubscriptionConfirmation() {
  return [
    "You're subscribed.",
    "Thanks for joining. I'll send occasional engineering notes about reliable systems, frontend architecture, and practical AI workflows.",
    "No tracking or filler.",
    "Best,\nMontasim",
  ].join("\n\n")
}

function readNewsletterEmailConfig(): NewsletterEmailConfig {
  const apiKey = process.env.RESEND_API_KEY
  const from = process.env.FROM_EMAIL

  if (!apiKey || !from) {
    throw new Error("Newsletter email delivery is not configured.")
  }

  return { apiKey, from }
}

function createEmailSender(apiKey: string): SendNewsletterEmail {
  const resend = new Resend(apiKey)
  return (message, options) =>
    resend.post(
      "/emails",
      {
        from: message.from,
        to: message.to,
        subject: message.subject,
        text: message.text,
      },
      options
    )
}
