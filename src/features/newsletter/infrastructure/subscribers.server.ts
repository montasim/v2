import { eq } from "drizzle-orm"

import { getDatabase } from "@/db/client.server"
import { newsletterSubscribers } from "@/db/schema"
import type { NewsletterSubscriberRepository } from "@/features/newsletter/application/ports"
import type {
  NewsletterConfirmationState,
  NewsletterSubscriber,
} from "@/features/newsletter/domain/subscriber"

function toSubscriber(
  row: typeof newsletterSubscribers.$inferSelect
): NewsletterSubscriber {
  return {
    id: row.id,
    email: row.email,
    confirmationState: row.confirmationState as NewsletterConfirmationState,
  }
}

export class DrizzleNewsletterSubscriberRepository implements NewsletterSubscriberRepository {
  async findOrCreate(email: string) {
    const database = getDatabase()
    const created = (
      await database
        .insert(newsletterSubscribers)
        .values({ email })
        .onConflictDoNothing({ target: newsletterSubscribers.email })
        .returning()
    ).at(0)

    if (created) return toSubscriber(created)

    const existing = (
      await database
        .select()
        .from(newsletterSubscribers)
        .where(eq(newsletterSubscribers.email, email))
        .limit(1)
    ).at(0)

    if (!existing) throw new Error("The subscription could not be saved.")
    return toSubscriber(existing)
  }

  async markConfirmation(
    id: string,
    state: NewsletterConfirmationState,
    error?: string
  ) {
    await getDatabase()
      .update(newsletterSubscribers)
      .set({
        confirmationState: state,
        confirmationLastError: error ?? null,
        confirmationSentAt: state === "sent" ? new Date() : undefined,
        updatedAt: new Date(),
      })
      .where(eq(newsletterSubscribers.id, id))
  }
}
