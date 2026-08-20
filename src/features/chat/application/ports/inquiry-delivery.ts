import type { InquirySubmission } from "@/features/chat/domain/inquiry"

export interface InquiryDelivery {
  deliver: (inquiry: InquirySubmission) => Promise<void>
}
