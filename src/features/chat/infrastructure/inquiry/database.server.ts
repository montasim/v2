import { getDatabase } from "@/db/client.server"
import { portfolioInquiries } from "@/db/schema"
import type { InquiryDelivery } from "@/features/chat/application/ports/inquiry-delivery"
import type { InquirySubmission } from "@/features/chat/domain/inquiry"

export class DatabaseInquiryDelivery implements InquiryDelivery {
  async deliver(inquiry: InquirySubmission) {
    const details =
      inquiry.type === "hire"
        ? {
            role: inquiry.role,
            arrangement: inquiry.arrangement,
            projectType: null,
            timeline: null,
          }
        : {
            role: null,
            arrangement: null,
            projectType: inquiry.projectType,
            timeline: inquiry.timeline,
          }

    await getDatabase()
      .insert(portfolioInquiries)
      .values({
        id: inquiry.id,
        type: inquiry.type,
        name: inquiry.name,
        email: inquiry.email,
        context: inquiry.context ?? null,
        ...details,
      })
      .onConflictDoNothing({ target: portfolioInquiries.id })
  }
}
