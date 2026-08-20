import type { InquiryDelivery } from "@/features/chat/application/ports/inquiry-delivery"
import type { InquirySubmission } from "@/features/chat/domain/inquiry"

export class CompositeInquiryDelivery implements InquiryDelivery {
  constructor(private readonly deliveries: readonly InquiryDelivery[]) {}

  async deliver(inquiry: InquirySubmission) {
    await Promise.all(
      this.deliveries.map((delivery) => delivery.deliver(inquiry))
    )
  }
}
