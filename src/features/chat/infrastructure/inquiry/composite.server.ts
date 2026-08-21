import type { InquiryDelivery } from "@/features/chat/application/ports/inquiry-delivery"
import type { InquirySubmission } from "@/features/chat/domain/inquiry"
import { logger } from "@/lib/logger.server"

export class CompositeInquiryDelivery implements InquiryDelivery {
  constructor(
    private readonly primary: InquiryDelivery,
    private readonly secondary: readonly InquiryDelivery[] = []
  ) {}

  async deliver(inquiry: InquirySubmission) {
    await this.primary.deliver(inquiry)

    const results = await Promise.allSettled(
      this.secondary.map((delivery) => delivery.deliver(inquiry))
    )
    const failures = results.filter((result) => result.status === "rejected")
    if (failures.length > 0) {
      logger.warn(
        { inquiryId: inquiry.id, failureCount: failures.length },
        "Secondary inquiry delivery failed"
      )
    }
  }
}
