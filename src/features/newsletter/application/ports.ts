import type {
  NewsletterConfirmationState,
  NewsletterSubscriber,
} from "@/features/newsletter/domain/subscriber"

export interface NewsletterSubscriberRepository {
  findOrCreate: (email: string) => Promise<NewsletterSubscriber>
  markConfirmation: (
    id: string,
    state: NewsletterConfirmationState,
    error?: string
  ) => Promise<void>
}

export interface NewsletterConfirmationDelivery {
  send: (input: {
    subscriber: NewsletterSubscriber
    idempotencyKey: string
  }) => Promise<void>
}
