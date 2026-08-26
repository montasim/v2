import { z } from "zod"

import { visitorEmailSchema } from "@/features/email-verification/domain/email-verification"

export const newsletterSubscriptionSchema = z.object({
  email: visitorEmailSchema,
  website: z.string().max(200).optional().default(""),
})

export type NewsletterSubscription = z.infer<
  typeof newsletterSubscriptionSchema
>

export type NewsletterConfirmationState =
  "pending" | "sending" | "sent" | "failed"

export type NewsletterSubscriber = {
  id: string
  email: string
  confirmationState: NewsletterConfirmationState
}

export const SUBSCRIPTION_CONFIRMATION_FAILED_ERROR =
  "Your subscription was saved, but the confirmation email could not be sent. Try again."

export function getNewsletterSubscriptionError(error: unknown) {
  return error instanceof Error &&
    error.message === SUBSCRIPTION_CONFIRMATION_FAILED_ERROR
    ? error.message
    : null
}
