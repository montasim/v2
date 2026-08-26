import { createServerFn } from "@tanstack/react-start"

import type {
  NewsletterConfirmationDelivery,
  NewsletterSubscriberRepository,
} from "@/features/newsletter/application/ports"
import {
  SUBSCRIPTION_CONFIRMATION_FAILED_ERROR,
  newsletterSubscriptionSchema,
} from "@/features/newsletter/domain/subscriber"
import { DrizzleNewsletterSubscriberRepository } from "@/features/newsletter/infrastructure/subscribers.server"
import { ResendNewsletterConfirmationDelivery } from "@/features/newsletter/infrastructure/resend.server"
import { requirePermanentEmail } from "@/features/email-verification/infrastructure/disposable-email.server"

type SubscribeDependencies = {
  verifyEmail: (email: string) => Promise<void>
  subscribers: NewsletterSubscriberRepository
  confirmation: NewsletterConfirmationDelivery
}

export async function subscribeToNewsletterWithDependencies(
  email: string,
  dependencies: SubscribeDependencies
) {
  await dependencies.verifyEmail(email)
  const subscriber = await dependencies.subscribers.findOrCreate(email)

  if (subscriber.confirmationState === "sent") {
    return { subscribed: true as const }
  }

  await dependencies.subscribers.markConfirmation(subscriber.id, "sending")

  try {
    await dependencies.confirmation.send({
      subscriber,
      idempotencyKey: `newsletter-subscription-${subscriber.id}-v1`,
    })
    await dependencies.subscribers.markConfirmation(subscriber.id, "sent")
  } catch (error) {
    await dependencies.subscribers.markConfirmation(
      subscriber.id,
      "failed",
      error instanceof Error ? error.message : "Unknown delivery error"
    )
    throw new Error(SUBSCRIPTION_CONFIRMATION_FAILED_ERROR)
  }

  return { subscribed: true as const }
}

export const subscribeToNewsletter = createServerFn({ method: "POST" })
  .validator((input: unknown) => newsletterSubscriptionSchema.parse(input))
  .handler(async ({ data }) => {
    if (data.website) return { subscribed: true as const }

    return subscribeToNewsletterWithDependencies(data.email, {
      verifyEmail: requirePermanentEmail,
      subscribers: new DrizzleNewsletterSubscriberRepository(),
      confirmation: new ResendNewsletterConfirmationDelivery(),
    })
  })
